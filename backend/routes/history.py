from flask import Blueprint, jsonify, current_app, send_from_directory
import os
import logging
from models import db, ExtractionRecord, Document, Template

logger = logging.getLogger(__name__)

# app.py imports: from routes.history import historybp
history_bp = Blueprint("historybp", __name__)


@history_bp.route("/history", methods=["GET"])
def history():
    try:
        records = ExtractionRecord.query.order_by(
            ExtractionRecord.timestamp.desc()
        ).limit(20).all()

        return jsonify({
            "status": "success",
            "history": [
                {
                    "id": r.id,
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                    "pdf_filename": r.pdf_filename,
                    "template_name": r.template_name,
                    "data_points": r.data_points,
                    "results": r.results
                }
                for r in records
            ]
        })
    except Exception as exc:
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


@history_bp.route("/history/delete_pdf/<int:id>", methods=["DELETE"])
def delete_pdf(id):
    try:
        record = ExtractionRecord.query.get(id)
        if not record:
            return jsonify({"error": "Record not found"}), 404

        pdf_path = os.path.join(current_app.config["UPLOAD_FOLDER"], record.pdf_filename)
        if record.pdf_filename and os.path.exists(pdf_path):
            os.remove(pdf_path)

        ExtractionRecord.query.filter_by(id=id).delete()
        Document.query.filter_by(document_id=id).delete()
        db.session.commit()

        return jsonify({"status": "success", "message": "PDF deleted"})
    except Exception as exc:
        db.session.rollback()
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


@history_bp.route("/history/document/<int:id>", methods=["DELETE"])
def delete_document(id):
    try:
        record = ExtractionRecord.query.get(id)
        if not record:
            return jsonify({"error": "Record not found"}), 404

        doc = Document.query.filter_by(document_id=id).first()
        file_name = doc.filename if doc and doc.filename else record.pdf_filename

        if file_name:
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], file_name)
            if os.path.exists(file_path):
                os.remove(file_path)

        if doc:
            db.session.delete(doc)

        db.session.delete(record)
        db.session.commit()

        return jsonify({"status": "success", "message": "Document deleted"})
    except Exception as exc:
        db.session.rollback()
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


@history_bp.route("/history/usage", methods=["GET"])
def usage():
    try:
        records = ExtractionRecord.query.all()
        templates = Template.query.all()

        return jsonify({
            "total_extractions": len(records),
            "templates_used": len(templates)
        })
    except Exception as exc:
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


@history_bp.route("/file/<path:filename>", methods=["GET"])
def serve_file(filename):
    try:
        upload_dir = os.path.abspath(current_app.config["UPLOAD_FOLDER"])
        safe_path = os.path.abspath(os.path.join(upload_dir, filename))

        if not safe_path.startswith(upload_dir):
            return jsonify({"error": "Invalid file path"}), 400

        if not os.path.isfile(safe_path):
            return jsonify({"error": f"File not found: {filename}"}), 404

        return send_from_directory(upload_dir, filename, as_attachment=False)
    except Exception as exc:
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# Optional backward-compatible alias for older frontend code
@history_bp.route("/pdf/<path:filename>", methods=["GET"])
def serve_pdf_alias(filename):
    return serve_file(filename)