from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash

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

class ChatHistory(db.Model):
    """Stores AIExtracter chatbot conversation history per session."""
    __tablename__ = 'chat_history'
 
    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), nullable=False, index=True)
    role       = db.Column(db.String(20), nullable=False)   # 'user' | 'assistant'
    content    = db.Column(db.Text, nullable=False)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)
 
    def __repr__(self):
        return f"<ChatHistory {self.session_id} [{self.role}]>"

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    verification_code = db.Column(db.String(6), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password = generate_password_hash(password).decode('utf-8')
    def check_password(self, password):
        return check_password_hash(self.password, password)