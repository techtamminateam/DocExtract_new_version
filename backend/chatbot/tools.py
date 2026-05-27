from langchain_core.tools import tool
from flask import current_app
from models import *
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json

@tool
def get_template_info(template_name: str) -> str:
    """
    Get detailed information about an AIExtracter preset template.
    Templates: Healthcare Documents, Financial Statements, MSA Extraction,
    Invoice Checking, Legal Documents, SOW Extraction.
    Returns use cases, key fields extracted, tips, and common issues.
    """
    template = Template.query.filter_by(template_name=template_name).first()
    if not template:
        return json.dumps({"error": "Template not found"})

    return json.dumps({
        "template_name": template.template_name,
        "data_points": template.data_points
    })

@tool
def list_all_templates_name_only() -> str:
    """
    List all available AIExtracter preset templates by name.
    Returns a list of template names.
    """
    templates = Template.query.with_entities(Template.template_name).all()
    template_names = [t.template_name for t in templates]
    print(f"Available templates: {template_names}")  # Debug print to verify template retrieval
    return json.dumps(template_names)

@tool
def list_all_templates_with_details() -> str:
    """
    List all available AIExtracter preset templates with details.
    Returns a list of templates with their name, use cases, key fields, tips, and common issues.
    """
    templates = Template.query.all()
    template_details = []
    for template in templates:
        template_details.append({
            "template_name": template.template_name,
            "data_points": template.data_points
        })
    return json.dumps(template_details)\
    
@tool
def get_recent_extraction_records(limit: int = 5) -> str:
    """
    Get recent extraction records.
    Returns a list of recent extraction records with template name, timestamp, and data points.
    """
    records = ExtractionRecord.query.order_by(desc(ExtractionRecord.timestamp)).limit(limit).all()
    record_list = []
    for record in records:
        record_list.append({
            "template_name": record.template_name,
            "pdf_filename": record.pdf_filename,
            "timestamp": record.timestamp.isoformat(),
            "data_points": record.data_points
        })
    return json.dumps(record_list)

@tool
def get_extraction_records_by_date_range(start_date: str, end_date: str) -> str:
    """
    Get extraction records within a specific date range.
    Returns a list of extraction records with template name, timestamp, and data points.
    """
    start_dt = datetime.fromisoformat(start_date)
    end_dt = datetime.fromisoformat(end_date)
    records = ExtractionRecord.query.filter(ExtractionRecord.timestamp.between(start_dt, end_dt)).order_by(desc(ExtractionRecord.timestamp)).all()
    record_list = []
    for record in records:
        record_list.append({
            "template_name": record.template_name,
            "pdf_filename": record.pdf_filename,
            "timestamp": record.timestamp.isoformat(),
            "data_points": record.data_points
        })
    return json.dumps(record_list)

@tool
def get_extraction_record_by_filename(pdf_filename: str) -> str:
    """
    Get extraction record by PDF filename.
    Returns the extraction record with template name, timestamp, and data points.
    """
    record = ExtractionRecord.query.filter_by(pdf_filename=pdf_filename).first()
    if not record:
        return json.dumps({"error": "Record not found"})
    
    return json.dumps({
        "template_name": record.template_name,
        "pdf_filename": record.pdf_filename,
        "timestamp": record.timestamp.isoformat(),
        "data_points": record.data_points
    })

@tool
def get_extraction_result(extraction_id: int) -> str:
    """
    Get extraction result by record ID.
    Returns the extraction result with template name, timestamp, data points, and results.
    """
    record = ExtractionRecord.query.get(extraction_id)
    if not record:
        return json.dumps({"error": "Record not found"})
    
    return json.dumps({
        "template_name": record.template_name,
        "pdf_filename": record.pdf_filename,
        "timestamp": record.timestamp.isoformat(),
        "data_points": record.data_points,
        "results": record.results
    })

@tool
def get_extraction_analytics() -> str:
    """
    Get overall analytics and metrics from the extraction database:
    total extractions, success rate, most used templates, extractions this week.
    Use when user asks about 'dashboard', 'metrics', 'analytics', or 'statistics'.
    """
    try:
        total = ExtractionRecord.query.count()
        if total == 0:
            return "No extractions in the database yet. Upload your first PDF to get started!"
        success_count = ExtractionRecord.query.filter(ExtractionRecord.results.isnot(None)).count()
        success_rate = (success_count / total) * 100 if total > 0 else 0
        
        most_used_template = db.session.query(ExtractionRecord.template_name, func.count(ExtractionRecord.id).label('count')).group_by(ExtractionRecord.template_name).order_by(desc('count')).first()
        most_used_template_name = most_used_template.template_name if most_used_template else "N/A"
        
        week_ago = datetime.utcnow() - timedelta(days=7)
        extractions_this_week = ExtractionRecord.query.filter(ExtractionRecord.timestamp >= week_ago).count()
        analytics = {
            "total_extractions": total,
            "success_rate": f"{success_rate:.2f}%",
            "most_used_template": most_used_template_name,
            "extractions_this_week": extractions_this_week
        }
        return json.dumps(analytics)
    except Exception as e:
        return json.dumps({"error": str(e)})
    
@tool
def get_extraction_by_template(template_name: str) -> str:
    """
    Get extractions by template name.
    Returns a list of extraction records with PDF name, timestamp, and data points for the specified template.
    """
    records = ExtractionRecord.query.filter_by(template_name=template_name).order_by(desc(ExtractionRecord.timestamp)).all()
    record_list = []
    for record in records:
        record_list.append({
            "template_name": record.template_name,
            "pdf_filename": record.pdf_filename,
            "timestamp": record.timestamp.isoformat(),
            "data_points": record.data_points
        })
    return json.dumps(record_list)  

        
# All tools exported
AIEXTRACTER_TOOLS = [
    get_template_info,
    list_all_templates_name_only,
    list_all_templates_with_details,
    get_recent_extraction_records,
    get_extraction_records_by_date_range,
    get_extraction_record_by_filename,
    get_extraction_result,
    get_extraction_analytics,
    get_extraction_by_template
]