from templates import *
from flask import Blueprint, jsonify
import json

template_bp = Blueprint("templates_bp", __name__)
TEMPLATES = {
    "Health Care Documents": HEALTHCARE_TEMPLATE,
    "Financial Statements": FINANCIAL_TEMPLATE,
    "MSA Extraction": MSA_TEMPLATE,
    "Invoice Checking": INVOICE_TEMPLATE,
    "Legal Documents": LEGAL_TEMPLATE,
    "SOW Extraction": SOW_TEMPLATE
}

@template_bp.route("/templates", methods=["GET"])
def get_templates():
    try:
        response = []
        for template_name, template_text in TEMPLATES.items():
            response.append({
                "name": template_name,
                "text": template_text
            })
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500