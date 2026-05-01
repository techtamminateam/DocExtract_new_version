from flask import Blueprint, jsonify
import os
from models import db, ExtractionRecord, ExtractionResultStatus
import logging

logger = logging.getLogger(__name__)

history_bp = Blueprint("history_bp", __name__)

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
                    "timestamp": r.timestamp.isoformat(),
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

        pdf_path = os.path.join("uploads", record.pdf_filename)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        ExtractionRecord.query.filter_by(id=id).delete()
        ExtractionResultStatus.query.filter_by(pdf_filename=record.pdf_filename).delete()
        db.session.commit()

        return jsonify({"status": "success", "message": "PDF deleted"})

    except Exception as exc:
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500