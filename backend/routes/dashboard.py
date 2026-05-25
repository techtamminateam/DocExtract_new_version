from flask import Blueprint, jsonify, request
import os
from models import db, ExtractionResultStatus, ExtractionRecord
import logging
from collections import Counter
import json
from datetime import datetime

logger = logging.getLogger(__name__)

result_status_bp = Blueprint("result_status_bp", __name__)

@result_status_bp.route("/result_status", methods=["GET"])
def result_status():
    try:
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")

        records_query = ExtractionResultStatus.query

        if start_date_str or end_date_str:
            record_query = ExtractionRecord.query
            if start_date_str:
                try:
                    start_dt = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                    record_query = record_query.filter(ExtractionRecord.timestamp >= start_dt)
                except ValueError:
                    pass
            if end_date_str:
                try:
                    end_dt = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                    record_query = record_query.filter(ExtractionRecord.timestamp <= end_dt)
                except ValueError:
                    pass

            matching_records = record_query.all()
            matching_filenames = [r.pdf_filename for r in matching_records if r.pdf_filename]

            if not matching_filenames:
                return jsonify({
                    "status": "success",
                    "pdf_files_count": 0,
                    "status_count": {"approved": 0, "flagged": 0, "pending": 0}
                })

            records_query = records_query.filter(ExtractionResultStatus.pdf_filename.in_(matching_filenames))

        records = records_query.all()
        pdf_files_count = len(records)
        status_count = Counter({"approved": 0, "flagged": 0, "pending": 0})

        for r in records:
            data = r.result_status

            # convert JSON string → dict
            if isinstance(data, str):
                data = json.loads(data)

            for field in data.values():
                status_count[field.get("status", "pending")] += 1

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
    