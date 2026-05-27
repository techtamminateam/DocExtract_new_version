from flask import Blueprint, redirect, request, session, jsonify
from routes.sheets_helper import append_to_sheet
import logging

sheets_bp = Blueprint("sheets_bp", __name__)
logger = logging.getLogger(__name__)

@sheets_bp.route("/append_to_sheet", methods=["POST"])
def append_sheet():
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")

    if not access_token:
        return jsonify({"status": "error", "message": "Not authenticated. Please authenticate with Google Drive in Integrations first."}), 401
    
    data = request.get_json()
    
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    
    try:
        logger.info(f"Appending to sheet with data keys: {list(data.keys())}")
        result = append_to_sheet(access_token=access_token, refresh_token=refresh_token, extracted_data=data)

        if result and result.get("success"):
            return jsonify({
                "message": result.get("message", "Data saved to Google Sheets ✅"),
                "row": result.get("row", [])
            }), 200
        else:
            error_msg = result.get("error") if result else "Unknown error"
            return jsonify({
                "error": "Failed to write to Google Sheets",
                "details": error_msg
            }), 500

    except Exception as e:
        logger.error(f"Exception in sheets append: {type(e).__name__}: {e}", exc_info=True)
        return jsonify({
            "error": "Exception in sheets append",
            "details": str(e)
        }), 500
