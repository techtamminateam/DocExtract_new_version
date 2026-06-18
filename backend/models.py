from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash

db = SQLAlchemy()


class ExtractionRecord(db.Model):
    __tablename__ = "extraction_records"

    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    file_name = db.Column(db.String(255))
    data_points = db.Column(db.JSON, nullable=False)
    results = db.Column(db.JSON, nullable=True)
    result_status = db.Column(db.JSON, nullable=False)
    processing_status = db.Column(db.String(20))
    progress = db.Column(db.Integer, default=0)
    processing_message = db.Column(db.Text)

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
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255))
    verification_code = db.Column(db.String(6), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def set_password(self, password):
        self.password = generate_password_hash(password).decode('utf-8')
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('users.id'),
        nullable=False, unique=True, index=True  # unique + indexed
    )
    full_name = db.Column(db.String(255), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    job_title = db.Column(db.String(255), nullable=True)
    company_name = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    timezone = db.Column(db.String(50), nullable=True)
    last_seen_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        index=True,
    )
    __table_args__ = (db.UniqueConstraint('user_id', name='_user_id_uc'),)
    user = db.relationship('User', backref=db.backref('profile', uselist=False))

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        index=True
    )
    filename = db.Column(db.String(255), nullable=False)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    file_size = db.Column(db.Integer, nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=True)
    file_type = db.Column(db.String(120), nullable=False, index=True)
    source_type = db.Column(db.String(50), nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    document_id = db.Column(db.Integer, nullable=False, unique=True)
    template = db.relationship('Template', backref=db.backref('documents', lazy=True))

class UserSession(db.Model):
    __tablename__ = "user_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    device_name = db.Column(db.String(255), nullable=True)
    browser_info = db.Column(db.String(255), nullable=True)
    os_info = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    revoked = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, index=True)

    __table_args__ = (
        db.Index('ix_sessions_user_active', 'user_id', 'is_active'),
    )

class SecurityEvent(db.Model):
    __tablename__ = "security_events"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    event_type = db.Column(db.String(50), nullable=False, index=True)
    severity = db.Column(db.String(20), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    event_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class Integration(db.Model):
    __tablename__ = "integrations"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    provider = db.Column(db.String(50), nullable=False)  # 'google_drive', 'dr1opbox', etc.
    status = db.Column(db.String(20), nullable=False, default='connected')  # 'connected', 'disconnected'
    sync_status = db.Column(db.String(20), nullable=False, default='idle')  # 'idle', 'syncing', 'error'
    external_account_email = db.Column(db.String(255), nullable=True)
    access_token_ref = db.Column(db.String(255), nullable=True)  # Reference to encrypted token storage
    refresh_token_ref = db.Column(db.String(255), nullable=True)  # Reference to encrypted token storage
    config = db.Column(db.JSON, nullable=True)  # Store provider-specific config like folder IDs, sync settings, etc.
    connected_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_synced_at = db.Column(db.DateTime, nullable=True, index=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'provider', name='_user_provider_uc'),
    )

class ExportReports(db.Model):
    __tablename__ = "export_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    export_type = db.Column(db.String(20), nullable=False, index=True)
    extraction_job_id = db.Column(
        db.Integer,
        db.ForeignKey('extraction_jobs.id'),
        nullable=True,
        index=True
    )
    status = db.Column(db.String(20), nullable=False, default='pending', index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class DailyMetrics(db.Model):
    __tablename__ = "daily_metrics"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False,
        index=True
    )
    metric_date = db.Column(db.Date, nullable=False, index=True)
    documents_processed = db.Column(db.Integer, nullable=False, default=0)
    approved_count = db.Column(db.Integer, nullable=False, default=0)
    processing_count = db.Column(db.Integer, nullable=False, default=0)
    flagged_count = db.Column(db.Integer, nullable=False, default=0)
    exported_count = db.Column(db.Integer, nullable=False, default=0)
    average_accuracy = db.Column(db.Float, nullable=True)
    average_processing_time = db.Column(db.Float, nullable=True)
    excels_exported = db.Column(db.Integer, nullable=False, default=0)
    json_exported = db.Column(db.Integer, nullable=False, default=0)
    templates_used = db.Column(db.Integer, nullable=False, default=0)
    active_integrations = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'metric_date', name='_user_date_uc'),
        db.Index('ix_daily_user_date', 'user_id', 'metric_date'),
    )

class Subscriptions(db.Model):
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    plan = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    order_id = db.Column(db.String(255), nullable=True)
    payment_id = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='inactive')
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)

class BillingHistory(db.Model):
    __tablename__ = "billing_history"

    id = db.Column(db.Integer, primary_key=True)
    invoice = db.Column(db.String(255), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    tracking = db.Column(db.JSON, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)