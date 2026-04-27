class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///document_extraction.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class UploadConfig:
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 16 MB
    UPLOAD_FOLDER = "uploads"