from templates import *
from flask import Blueprint, jsonify
from models import Template, db
from flask import request
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
                "data_points": json.loads(template.data_points) if template.data_points else [],
                "created_at": template.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)})

@template_bp.route("/templates/<int:template_id>", methods=["GET"])
def get_template(template_id):
    try:
        template = Template.query.get(template_id)
        if template:
            return jsonify({
                "id": template.id,
                "template_name": template.template_name,
                "template_content": template.template_content,
                "data_points": json.loads(template.data_points) if template.data_points else [],
                "created_at": template.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        else:
            return jsonify({"error": "Template not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)})

@template_bp.route("/templates", methods=["POST"])
def create_template():
    try:
        data = request.get_json()
        template_name = data.get("template_name")
        template_content = data.get("template_content")
        if not template_name or not template_content:
            return jsonify({"error": "Template name and content are required"}), 400
        data_points = data.get("data_points")
        new_template = Template(template_name=template_name, template_content=template_content, data_points=json.dumps(data_points) if data_points else None)
        db.session.add(new_template)
        db.session.commit()
        return jsonify({"message": "Template created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@template_bp.route("/templates/<int:template_id>", methods=["DELETE"])
def delete_template(template_id):
    try:
        template = Template.query.get(template_id)
        if not template:
            return jsonify({"error": "Template not found"}), 404
        db.session.delete(template)
        db.session.commit()
        return jsonify({"message": "Template deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@template_bp.route("/templates/<int:template_id>", methods=["PUT"])
def update_template(template_id):
    try:
        template = Template.query.get(template_id)
        if not template:
            return jsonify({"error": "Template not found"}), 404
        data = request.get_json()
        template_name = data.get("template_name")
        template_content = data.get("template_content")
        if template_name:
            template.template_name = template_name
        if template_content:
            template.template_content = template_content
        data_points = data.get("data_points")
        if data_points is not None:
            template.data_points = json.dumps(data_points) if data_points else None
        db.session.commit()
        return jsonify({"message": "Template updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500