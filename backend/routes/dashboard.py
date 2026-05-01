from flask import Blueprint, jsonify
import os
from models import db, ExtractionResultStatus
import logging
from collections import Counter
import json

logger = logging.getLogger(__name__)

result_status_bp = Blueprint("result_status_bp", __name__)
import json
from collections import Counter

@result_status_bp.route("/result_status", methods=["GET"])
def result_status():
    try:
        records = ExtractionResultStatus.query.all()

        pdf_files_count = len(records)
        status_count = Counter()

        for r in records:
            data = r.result_status

            # convert JSON string → dict
            if isinstance(data, str):
                data = json.loads(data)

            for field in data.values():
                status_count[field["status"]] += 1

        logger.info(f"{status_count}")
        logger.info(f"{pdf_files_count}")

        return jsonify({
            "status": "success",
            "pdf_files_count": pdf_files_count,
            "status_count": dict(status_count)
        })

    except Exception as exc:
        logger.error(exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500
    