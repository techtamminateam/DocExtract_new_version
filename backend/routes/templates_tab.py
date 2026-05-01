from templates import *
from flask import Blueprint, jsonify
from models import Template
import json

template_bp = Blueprint("templates_bp", __name__)


@template_bp.route("/templates", methods=["GET"])
def get_templates():
    try:
        response = []
        templates = Template.query.all()
        for template in templates:
            response.append({
                "id": template.id,
                "template_name": template.template_name,
                "template_content": template.template_content,
                "created_at": template.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)})