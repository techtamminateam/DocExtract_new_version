from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class ExtractionRecord(db.Model):
    __tablename__ = "extraction_records"

    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    pdf_filename = db.Column(db.String(255))
    data_points = db.Column(db.JSON, nullable=False)
    results = db.Column(db.JSON, nullable=True)


class ExtractionResultStatus(db.Model):
    __tablename__ = "extraction_result_status"

    id = db.Column(db.Integer, primary_key=True)
    pdf_filename = db.Column(db.String(255), unique=True)
    result_status = db.Column(db.JSON, nullable=False)

class Template(db.Model):
    __tablename__ = "templates"

    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(255), unique=True, nullable=False)
    template_content = db.Column(db.Text, nullable=False)
    data_points = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


