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
from config import Config, UploadConfig, MailConfig
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from ppp import extract_text_from_file, extract_text_from_image

from models import (
    db,
    ExtractionRecord,
    Template,
    Document,
    User,
    ChatHistory,
    UserProfile,
    UserSession,
)
from routes.history import history_bp
from routes.dashboard import result_status_bp
from routes.templates_tab import template_bp
from routes.integration import integration_bp
from routes.oneDrive import one_drive_bp
from routes.google_sheets import sheets_bp
from routes.chatbot import chatbot_bp
from routes.login import login_bp
from routes.profile import profile_bp
from routes.razorpayy import billing_bp



from flask_mail import Mail, Message

mail = Mail()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Path to the React production build directory (frontend/app/build)
FRONTEND_BUILD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "app", "build"))
if not os.path.isdir(FRONTEND_BUILD_DIR):
    FRONTEND_BUILD_DIR = None

# Serve frontend build as Flask static files so only the backend process is needed
app = Flask(__name__, static_folder=FRONTEND_BUILD_DIR, static_url_path="")
# Load configs FIRST
load_dotenv()
app.config.from_object(Config)
app.config.from_object(UploadConfig)
app.config.from_object(MailConfig)

# Secret keys
app.secret_key = os.getenv("SECRET_KEY")

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

# Initialize extensions
db.init_app(app)
mail.init_app(app)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# CORS
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:5000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)

app.register_blueprint(history_bp, url_prefix="/api")
app.register_blueprint(result_status_bp, url_prefix="/api")
app.register_blueprint(template_bp, url_prefix="/api")
app.register_blueprint(integration_bp, url_prefix="/api")
app.register_blueprint(one_drive_bp, url_prefix="/api")
app.register_blueprint(sheets_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")
app.register_blueprint(login_bp, url_prefix="/api")
app.register_blueprint(profile_bp, url_prefix="/api")
app.register_blueprint(billing_bp, url_prefix="/api")


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
        DATAPOINTS = {
            "Health Care Documents": HEALTHCARE_DATA_POINTS,
            "Financial Statements": FINANCIAL_DATA_POINTS,
            "MSA Extraction": MSA_DATA_POINTS,
            "Invoice Checking": INVOICE_DATA_POINTS,
            "Legal Documents": LEGAL_DATA_POINTS,
            "SOW Extraction": SOW_DATA_POINTS
        }
        try:
            for template_name, template_content in TEMPLATES.items():
                data_points = DATAPOINTS.get(template_name, [])
                template = Template(template_name=template_name, template_content=template_content, data_points=json.dumps(data_points) if data_points else None)
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
# app.py — replace your /api/extract route

import threading
def process_file_background(app, record_id, file_path, data_points, 
                             template_name, filename, user_id_raw, source_type, file_type):
    """Runs in a background thread. Uses app context for DB access."""
    with app.app_context():
        extraction_record = ExtractionRecord.query.get(record_id)
        suffix = os.path.splitext(filename)[1] or ""

        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                with open(file_path, "rb") as f:
                    tmp.write(f.read())
                tmp_path = tmp.name

            p = get_pipeline()
            ppp_mod = p["ppp"]
            gemini_model = p["gemini_model"]
            encoding = p["encoding"]

            # Stage 1 — extract text
            extraction_record.processing_status = "extracting_text"
            extraction_record.progress = 20
            extraction_record.processing_message = "Extracting text from file"
            db.session.commit()

            large_text = text_extract_parallel(tmp_path)

            extraction_record.processing_status = "text_extracted"
            extraction_record.progress = 50
            extraction_record.processing_message = "Text extracted from file"
            db.session.commit()

            # Stage 2 — vectorstore if large
            pdf_tokens = len(encoding.encode(large_text))
            if pdf_tokens > 40000:
                extraction_record.processing_status = "vectorstore_created"
                extraction_record.progress = 70
                extraction_record.processing_message = "Building vectorstore for large document"
                db.session.commit()

                texts = ppp_mod.split_text(large_text, 4000, buffer=400)
                vectorstore = ppp_mod.create_vectorstore(texts)
                retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
                field_parts = [dp["field"] for dp in data_points]
                docs = retriever.get_relevant_documents(" ".join(field_parts)[:1500])
                combined_text = "\n\n".join([d.page_content for d in docs])
            else:
                combined_text = large_text

            # Stage 3 — field extraction
            extraction_record.processing_status = "extracting_fields"
            extraction_record.progress = 80
            extraction_record.processing_message = "Extracting required fields"
            db.session.commit()

            selected_template = get_template(template_name)
            results = extract_all_fields(data_points, combined_text, gemini_model, selected_template)

            # Done
            result_status = {
                field["field"]: {"status": "pending", "value": None}
                for field in data_points
            }
            extraction_record.results = results
            extraction_record.timestamp = datetime.now()
            extraction_record.result_status = result_status
            extraction_record.processing_status = "completed"
            extraction_record.progress = 100
            extraction_record.processing_message = "Extraction completed"
            db.session.commit()

            # Save document record
            try:
                user_id = int(user_id_raw) if user_id_raw else None
            except (TypeError, ValueError):
                user_id = None

            file_size = os.path.getsize(file_path)
            template_row = Template.query.filter_by(template_name=template_name).first()
            document = Document(
                user_id=user_id,
                filename=filename,
                file_size=file_size,
                file_type=file_type,
                source_type=source_type,
                template_id=template_row.id if template_row else None,
                document_id=extraction_record.id
            )
            db.session.add(document)
            db.session.commit()

        except Exception as exc:
            logger.error(f"Background processing failed: {exc}", exc_info=True)
            extraction_record.processing_status = "failed"
            extraction_record.progress = 0
            extraction_record.processing_message = str(exc)
            db.session.commit()
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            
@app.route("/api/extract", methods=["POST"])
def extract():
    uploaded_files = request.files.getlist("file")
    if not uploaded_files:
        return jsonify({"error": "No files provided"}), 400

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

    record_ids = []

    for uploaded_file in uploaded_files:
        if not uploaded_file or uploaded_file.filename == "":
            continue

        # Save file immediately (before handing off to thread)
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], uploaded_file.filename)
        uploaded_file.save(file_path)

        # Create DB record right now so we can return the ID
        extraction_record = ExtractionRecord(
            file_name=uploaded_file.filename,
            data_points=data_points,
            template_name=template_name,
            timestamp=None,
            results=None,
            result_status=None,
            processing_status="uploaded",
            progress=5,
            processing_message="File uploaded, queued for processing"
        )
        db.session.add(extraction_record)
        db.session.commit()
        record_id = extraction_record.id
        record_ids.append(record_id)

        # Capture values for the thread (can't pass request context)
        user_id_raw = (request.form.get("user_id") or "").strip()
        source_type = (request.form.get("upload_source") or "local").strip()
        file_type = (uploaded_file.mimetype or "").strip()

        # Run the heavy work in background
        thread = threading.Thread(
            target=process_file_background,
            args=(app, record_id, file_path, data_points, template_name,
                  uploaded_file.filename, user_id_raw, source_type, file_type),
            daemon=True
        )
        thread.start()

    return jsonify({
        "status": "queued",
        "record_ids": record_ids,
        "record_id": record_ids[0] if record_ids else None  # convenience for single file
    })


@app.route("/api/extraction-status/<int:record_id>")
def extraction_status(record_id):

    record = ExtractionRecord.query.get(record_id)

    if not record:
        return jsonify({"error": "Record not found"}), 404

    return jsonify({
        "status": record.processing_status,
        "progress": record.progress,
        "message": record.processing_message
    })

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

        file_name = data.get("file_name", "")
        result_status = data.get("out", {})

        if not file_name:
            raise ValueError("file_name is required")
        if not isinstance(result_status, dict):
            raise ValueError("result_status must be a JSON object")

        isPdfExits = ExtractionRecord.query.filter_by(
            file_name=file_name
        ).first()
        message = "Saving new result status" if not isPdfExits else "Updated to existing result status"
        logger.info(f"{message} for PDF: {file_name}")
        if not isPdfExits:
            status_record = ExtractionRecord(
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


# Serve frontend static files (production build). If the build is missing,
# return a helpful JSON response so the operator knows to run `npm run build`.
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    if app.static_folder:
        requested_path = os.path.join(app.static_folder, path)
        if path and os.path.exists(requested_path) and os.path.isfile(requested_path):
            return send_from_directory(app.static_folder, path)
        index_path = os.path.join(app.static_folder, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(app.static_folder, "index.html")
    return jsonify({
        "error": "Frontend build not found. Run 'npm run build' in frontend/app and restart the backend." 
    }), 404

if __name__ == "__main__":
    # threaded=True lets Flask handle concurrent requests (each request gets its own thread)
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)
