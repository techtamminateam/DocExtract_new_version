"""
app.py  –  Flask API for dynamic PDF data extraction
Each data point carries its own individual extraction prompt.
PDF pages are extracted in parallel; all field extractions run in a single Gemini API call.
"""

import os
import sys
import json
import time
import tempfile
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed, Future
from collections import OrderedDict
from typing import Dict, Any
from datetime import datetime, timezone

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from flask_sqlalchemy import SQLAlchemy
from config import Config, UploadConfig

from models import db, ExtractionRecord, ExtractionResultStatus, Template
from routes.history import history_bp
from routes.dashboard import result_status_bp
from routes.templates_tab import template_bp
from routes.integration import integration_bp
from routes.oneDrive import one_drive_bp




sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
app.config.from_object(UploadConfig)
app.secret_key = "nvjkfdskjgbvabjgsdsbsggbui"

app.register_blueprint(history_bp, url_prefix="/api")
app.register_blueprint(result_status_bp, url_prefix="/api")
app.register_blueprint(template_bp, url_prefix="/api")
app.register_blueprint(integration_bp, url_prefix="/api")
app.register_blueprint(one_drive_bp, url_prefix="/api")


CORS(app, supports_credentials=True)

app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    db.create_all()

    if not Template.query.first():
        print("Creating default templates")
        from templates import *
        TEMPLATES = {
            "Health Care Documents": HEALTHCARE_TEMPLATE,
            "Financial Statements": FINANCIAL_TEMPLATE,
            "MSA Extraction": MSA_TEMPLATE,
            "Invoice Checking": INVOICE_TEMPLATE,
            "Legal Documents": LEGAL_TEMPLATE,
            "SOW Extraction": SOW_TEMPLATE
        }
        try:
            for template_name, template_content in TEMPLATES.items():
                template = Template(template_name=template_name, template_content=template_content)
                db.session.add(template)
            db.session.commit()
            print("Default templates created successfully.")
        except Exception as e:
            print(f"Error creating default templates: {e}")
            db.session.rollback()
            sys.exit(1)
    else:
        print("Default templates already exist.")




def create_folders(app):
    folders = [
        app.config["UPLOAD_FOLDER"]
    ]

    for folder in folders:
        os.makedirs(folder, exist_ok=True)

create_folders(app)


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ── Tuneable concurrency constants ────────────────────────────────────────────
# How many Gemini calls to fire in parallel.
# Gemini free-tier: ~60 RPM  →  keep ≤ 10 concurrent workers to stay safe.
# Paid tier: raise to 20-30.
MAX_FIELD_WORKERS  = int(os.getenv("MAX_FIELD_WORKERS", "10"))

# How many PDF pages to OCR in parallel inside text_extract_parallel().
MAX_PAGE_WORKERS   = int(os.getenv("MAX_PAGE_WORKERS", "4"))

_pipeline = None




def get_pipeline():
    global _pipeline
    if _pipeline is None:
        import ppp as ppp
        import google.generativeai as genai
        from dotenv import load_dotenv
        import tiktoken

        load_dotenv(".env")
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        gemini_model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={"temperature": 0.0}
        )
        encoding = tiktoken.encoding_for_model("gpt-4-32k")
        _pipeline = {
            "ppp": ppp,
            "genai": genai,
            "gemini_model": gemini_model,
            "encoding": encoding,
        }
    return _pipeline


# ── Parallel PDF page extraction ──────────────────────────────────────────────
def text_extract_parallel(pdf_path: str) -> str:
    """
    Extract text from every page concurrently using MAX_PAGE_WORKERS threads.
    Each worker handles one page: digital text + table extraction + OCR if needed.
    Results are re-joined in original page order.
    """
    import fitz                         # PyMuPDF — already a dependency of ppp.py
    import io
    import hashlib
    import re
    import numpy as np
    import cv2
    import pytesseract
    from PIL import Image
    from collections import OrderedDict

    p = get_pipeline()
    ppp = p["ppp"]

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    logger.info(f"Starting parallel page extraction  pages={total_pages}  workers={MAX_PAGE_WORKERS}")

    # Close the fitz doc now; each worker will re-open it (fitz is NOT thread-safe).
    doc.close()

    def process_page(page_idx: int) -> tuple[int, str]:
        """Extract one page and return (page_num, text_segment)."""
        local_doc = fitz.open(pdf_path)
        try:
            page     = local_doc[page_idx]
            page_num = page_idx + 1
            segments = [f"[PAGE {page_num} START]"]

            # ── Digital text ──
            raw_text       = page.get_text("text") or ""
            raw_text_clean = raw_text.strip()
            if raw_text_clean:
                lines = [ppp.clean_text_for_llm(ln) for ln in raw_text_clean.splitlines() if ln.strip()]
                if lines:
                    segments.append("[TEXT] " + " ".join(lines))

            # ── Tables ──
            try:
                tables = page.find_tables()
                if tables:
                    for t_idx, table in enumerate(tables, start=1):
                        segments.append(f"[TABLE {t_idx}]")
                        df = table.to_pandas()
                        for r_idx, row in df.iterrows():
                            row_text = " | ".join(
                                ppp.clean_text_for_llm(str(v)) if v else "" for v in row.values
                            )
                            segments.append(f"  [ROW {r_idx+1}] {row_text}")
            except Exception:
                pass

            # ── OCR decision ──
            scanned = False
            if not raw_text_clean or len(raw_text_clean) < 30:
                scanned = True
            else:
                try:
                    scanned = ppp.is_scanned_page(page)
                except Exception:
                    scanned = False

            if scanned:
                img      = ppp.render_page_fast(page, scale=3)
                img_hash = ppp.hash_image(img)
                proc_img = ppp.preprocess_image_fast(img)
                ocr_raw  = ppp.hybrid_ocr(proc_img)
                if ocr_raw and ocr_raw.strip():
                    ocr_lines = [ppp.clean_text_for_llm(ln) for ln in ocr_raw.splitlines() if ln.strip()]
                    if ocr_lines:
                        tag = "[OCR_TABLE]" if ("|" in ocr_raw or re.search(r"\s{3,}", ocr_raw)) else "[OCR]"
                        segments.append(f"{tag} " + " ".join(ocr_lines))

            segments.append(f"[PAGE {page_num} END]")
            segments = list(OrderedDict.fromkeys(segments))   # dedup
            return page_num, "\n".join(segments)

        finally:
            local_doc.close()

    # ── Dispatch all pages concurrently ──
    page_texts: Dict[int, str] = {}
    with ThreadPoolExecutor(max_workers=MAX_PAGE_WORKERS) as pool:
        future_map: Dict[Future, int] = {
            pool.submit(process_page, idx): idx
            for idx in range(total_pages)
        }
        for fut in as_completed(future_map):
            try:
                page_num, segment = fut.result()
                page_texts[page_num] = segment
                logger.debug(f"  page {page_num}/{total_pages} done")
            except Exception as exc:
                idx = future_map[fut]
                logger.error(f"  page {idx+1} failed: {exc}", exc_info=True)
                page_texts[idx + 1] = f"[PAGE {idx+1} ERROR]"

    return "\n".join(page_texts[p] for p in sorted(page_texts.keys()))


# ── Batch field extraction (all fields in ONE API call) ────────────────────────
from templates import *

def extract_all_fields(data_points: list, combined_text: str, gemini_model, selected_template: str) -> Dict[str, Any]:
    """
    Extract ALL fields in a single Gemini API call.
    Sends all data points and their prompts together.
    Returns a dict: { field_name: extracted_value, ... }
    """
    # Build field specifications
    print(f"""The selected template is: {selected_template}""")

    field_specs = []
    for dp in data_points:
        field_name = dp["field"]
        field_prompt = dp["prompt"].strip()
        field_specs.append(f"- {field_name}: {field_prompt}")
    
    fields_text = "\n".join(field_specs)
    
    # Build JSON output schema showing all expected fields
    expected_fields = ", ".join([f'"{dp["field"]}"' for dp in data_points])
    
    full_prompt = f"""
            {selected_template}

            FIELDS TO EXTRACT:
            {fields_text}

            OUTPUT RULES:
            - Return ONLY valid JSON
            - Include ALL fields: {expected_fields}
            - If not found → null

            Document text (may contain both digital and OCR-extracted text):
            {combined_text}
            """
    try:
        t0 = time.perf_counter()
        
        # Count tokens in the full prompt (for logging)
        import tiktoken
        try:
            encoding = tiktoken.encoding_for_model("gpt-4-32k")
            prompt_tokens = len(encoding.encode(full_prompt))
            logger.info(f"  Sending to Gemini: total_tokens={prompt_tokens}")
        except Exception:
            logger.debug("  Could not count prompt tokens")
        
        response = gemini_model.generate_content(
            ["JSON only", full_prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        elapsed = time.perf_counter() - t0
        raw = response.text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        
        logger.info(f"✓ Batch extraction completed  ({elapsed:.2f}s)  fields={len(data_points)}")
        
        # Build result dict, preserving original field order
        results = OrderedDict()
        for dp in data_points:
            field_name = dp["field"]
            # Tolerate minor key-casing differences
            norm = field_name.lower().replace(" ", "").replace("_", "")
            value = None
            for k, v in parsed.items():
                if k.lower().replace(" ", "").replace("_", "") == norm:
                    value = v
                    break
            if value is None and field_name not in parsed:
                # Try exact match as fallback
                value = parsed.get(field_name)
            results[field_name] = value
            logger.info(f"  • {field_name}: {value}")
        
        return results

    except Exception as exc:
        logger.error(f"Batch extraction failed: {exc}", exc_info=True)
        # Return nulls for all fields on error
        return OrderedDict((dp["field"], None) for dp in data_points)


def get_template(template_name):
    from models import Template
    # First, try to fetch from the database so edits take effect
    template_record = Template.query.filter_by(template_name=template_name).first()
    if template_record and template_record.template_content:
        return template_record.template_content

    # Fallback to hardcoded templates if not found in DB
    match template_name:
        case "Health Care Documents":
            return HEALTHCARE_TEMPLATE
        case "Financial Documents":
            return FINANCIAL_TEMPLATE
        case "MSA":
            return MSA_TEMPLATE
        case "Invoice":
            return INVOICE_TEMPLATE
        case "Legal":
            return LEGAL_TEMPLATE
        case "SOW":
            return SOW_TEMPLATE
        case _:
            return FINANCIAL_TEMPLATE



# ── /api/extract ──────────────────────────────────────────────────────────────
@app.route("/api/extract", methods=["POST"])
def extract():
    """
    Multipart form fields:
      - pdf          : the PDF file
      - data_points  : JSON array of objects:
                       [{ "field": "Policy Number", "prompt": "Return only the policy number..." }, ...]
    """
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400

    raw_dp = request.form.get("data_points", "[]")
    template_name = request.form.get("preset", "default_template")

    try:
        data_points = json.loads(raw_dp)
        if not isinstance(data_points, list) or not data_points:
            raise ValueError("data_points must be a non-empty JSON array")
        for dp in data_points:
            if not dp.get("field"):
                raise ValueError("Each data point must have a 'field' key")
            if not dp.get("prompt", "").strip():
                raise ValueError(f"Data point '{dp['field']}' is missing a prompt")
    except (json.JSONDecodeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400

    pdf_file = request.files["pdf"]
    suffix   = os.path.splitext(pdf_file.filename)[1] or ".pdf"
    
    # Save to uploads folder first
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], pdf_file.filename)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    pdf_file.save(file_path)
    
    # Create a temp copy for processing
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        with open(file_path, 'rb') as f:
            tmp.write(f.read())
        tmp_path = tmp.name

    try:
        p            = get_pipeline()
        ppp          = p["ppp"]
        gemini_model = p["gemini_model"]
        encoding     = p["encoding"]

        # ── 1. Parallel PDF text extraction ───────────────────────────────────
        t_pdf = time.perf_counter()
        logger.info(f"[1/3] Parallel page extraction  workers={MAX_PAGE_WORKERS}")
        large_text = text_extract_parallel(tmp_path)
        with open("extracted_text.txt", "w", encoding="utf-8") as f:
            f.write(large_text)
        logger.info(f"[1/3] Done  ({time.perf_counter()-t_pdf:.2f}s)")

        # ── 2. Token-aware context window ─────────────────────────────────────
        pdf_tokens = len(encoding.encode(large_text))
        logger.info(f"[2/3] PDF tokens: {pdf_tokens}")

        if pdf_tokens > 40000:
            logger.info("[2/3] Large doc — building FAISS retriever")
            texts        = ppp.split_text(large_text, 4000, buffer=400)
            vectorstore  = ppp.create_vectorstore(texts)
            retriever    = vectorstore.as_retriever(search_kwargs={"k": 3})
            
            # Build a rich FAISS query that includes field names, their prompts, AND common financial keywords
            # This helps the retriever find not just the field mentions, but also the actual financial data sections
            field_parts = []
            for dp in data_points:
                field_parts.append(dp["field"])
            
            # Add common financial extraction terms to improve retrieval
            common_financial_terms = [
                "Balance Sheet", "Statement of Profit and Loss", "Cash Flow Statement",
                "Total Assets", "Total Liabilities", "Revenue", "Net Income", "Gross Profit",
                "Operating Income", "EBITDA", "Cash and Cash Equivalents", "Current Assets",
                "Current Liabilities", "Total Debt", "Interest Expense", "Operating Cash Flow",
                "Capital Expenditure", "Free Cash Flow", "Share Capital", "Reserves", "Equity"
            ]
            field_parts.extend(common_financial_terms)
            
            query = " ".join(field_parts)[:1500]   # cap at 1500 chars
            logger.info(f"[2/3] FAISS query (enriched): {query[:150]}...")
            
            docs         = retriever.get_relevant_documents(query)
            logger.info(f"[2/3] Retrieved {len(docs)} top chunks from FAISS")
            for i, doc in enumerate(docs, 1):
                logger.debug(f"  Chunk {i}: {doc.page_content[:100]}...")
            
            combined_text = "\n\n".join([d.page_content for d in docs])
            
            # DEBUG: Save FAISS chunks to file
            with open("faiss_chunks.txt", "w", encoding="utf-8") as f:
                f.write(f"Query: {query}\n")
                f.write(f"Total Chunks Retrieved: {len(docs)}\n")
                f.write("="*80 + "\n\n")
                for i, doc in enumerate(docs, 1):
                    f.write(f"--- CHUNK {i} ---\n{doc.page_content}\n\n")
            logger.info(f"[2/3] Saved FAISS chunks to faiss_chunks.txt")
        else:
            combined_text = large_text

        # ── 3. Batch field extraction (single API call) ───────────────────────────
        t_fields = time.perf_counter()
        n        = len(data_points)
        
        # Count tokens being sent to LLM
        context_tokens = len(encoding.encode(combined_text))
        logger.info(f"[3/3] Batch field extraction  fields={n}  context_tokens={context_tokens}")

        selected_template = get_template(template_name)


        # Extract ALL fields in a single Gemini API call
        results = extract_all_fields(data_points, combined_text, gemini_model, selected_template)

        logger.info(f"[3/3] Done  ({time.perf_counter()-t_fields:.2f}s)")
        
        timestamp = datetime.now()
        extraction_record = ExtractionRecord(
            pdf_filename=pdf_file.filename,
            data_points=data_points,
            results=results,
            template_name=template_name,
            timestamp=timestamp
        )
        db.session.add(extraction_record)
        db.session.commit()

        # ── Save initial result status with all fields as "pending" ──────────
        result_status = {dp["field"]: "pending" for dp in data_points}
        
        # Check if status record already exists
        existing_status = ExtractionResultStatus.query.filter_by(
            pdf_filename=pdf_file.filename
        ).first()
        
        if existing_status:
            existing_status.result_status = result_status
            logger.info(f"Updated result status for: {pdf_file.filename}")
        else:
            status_record = ExtractionResultStatus(
                pdf_filename=pdf_file.filename,
                result_status=result_status
            )
            db.session.add(status_record)
            logger.info(f"Created initial result status (pending) for: {pdf_file.filename}")
        
        db.session.commit()
        
        return jsonify({"status": "success", "data": results})
    except Exception as exc:
        logger.error(f"Pipeline failed: {exc}", exc_info=True)
        return jsonify({"error": str(exc)}), 500

    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "config": {
            "page_extraction_workers": MAX_PAGE_WORKERS,
            "extraction_mode": "batch (all fields in single API call)"
        }
    })



@app.route("/api/pdf/<path:filename>", methods=["GET"])
def serve_pdf(filename):
    """Serve a stored PDF inline so the frontend can fetch it as a blob."""
    try:
        upload_dir = os.path.abspath(app.config["UPLOAD_FOLDER"])
        file_path = os.path.abspath(os.path.join(upload_dir, filename))
        
        # Security: ensure the resolved path is within the upload directory
        if not file_path.startswith(upload_dir):
            logger.error(f"Path traversal attempt blocked: {file_path}")
            return jsonify({"error": "Invalid file path"}), 400
        
        # Check if file exists
        if not os.path.isfile(file_path):
            logger.error(f"PDF file not found: {file_path}")
            return jsonify({"error": f"PDF file not found: {filename}"}), 404
        
        logger.info(f"Serving PDF: {file_path}")
        
        response = send_from_directory(
            upload_dir,
            filename,
            mimetype="application/pdf",
            as_attachment=False,  # inline, not a download
        )
        # Allow the React dev server (any origin) to fetch this as a blob
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Content-Disposition"] = f'inline; filename="{filename}"'
        response.headers["Content-Type"] = "application/pdf"
        return response
    except Exception as exc:
        logger.error(f"Failed to serve PDF '{filename}': {exc}", exc_info=True)
        return jsonify({"error": str(exc)}), 500

@app.route("/api/save_result_status", methods=["POST"])
def save_result_status():
    try:
        data = request.get_json()

        pdf_filename = data.get("file_name", "")
        result_status = data.get("out", {})

        if not isinstance(result_status, dict):
            raise ValueError("result_status must be a JSON object")

        isPdfExits = ExtractionResultStatus.query.filter_by(
            pdf_filename=pdf_filename
        ).first()
        message = "Saving new result status" if not isPdfExits else "Updated to existing result status"
        logger.info(f"{message} for PDF: {pdf_filename}")
        if not isPdfExits:
            status_record = ExtractionResultStatus(
                pdf_filename=pdf_filename,
                result_status=result_status
            )
            db.session.add(status_record)

        else:
            # ✅ FIX HERE
            isPdfExits.result_status = result_status

        db.session.commit()

        return jsonify({"status": "success", "message": message}), 200

    except Exception as exc:
        logger.error(f"Failed to save result status: {exc}", exc_info=True)

        return jsonify({
            "status": "error",
            "message": str(exc)
        }), 500

if __name__ == "__main__":
    # threaded=True lets Flask handle concurrent requests (each request gets its own thread)
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)