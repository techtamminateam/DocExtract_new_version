from langchain_core.tools import tool
from flask import current_app
from models import *
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json
import psycopg2
import os
from typing import List, Optional
from pydantic import BaseModel, Field

@tool
def execute_query(sql: str, params: Optional[str] = None) -> str:
    """Execute a dynamic SQL query on the database. 
    Use this to answer any data-related question by writing appropriate SQL.
    
    Args:
        sql: A safe SELECT SQL query (no mutations allowed)
        params: Optional JSON string of parameters for parameterized queries (e.g., '["value1", "value2"]')
    """
    if not sql.strip().lower().startswith("select"):
        return json.dumps({"error": "Only SELECT queries are allowed for safety."})
    
    # Parse params if provided as JSON string
    parsed_params = None
    if params:
        try:
            parsed_params = json.loads(params) if isinstance(params, str) else params
        except json.JSONDecodeError:
            return json.dumps({"error": "Invalid JSON format for params"})
    
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "AiExtract"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "123456")
    )
    
    try:
        with conn.cursor() as cursor:
            if parsed_params:
                cursor.execute(sql, parsed_params)
            else:
                cursor.execute(sql)
            result = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            return json.dumps([dict(zip(columns, row)) for row in result])
    except Exception as e:
        return json.dumps({"error": str(e)})
    finally:
        conn.close()


   
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
    get_recent_extraction_records,
    get_extraction_records_by_date_range,
    get_extraction_record_by_filename,
    get_extraction_result,
    get_extraction_analytics,
    get_extraction_by_template
]