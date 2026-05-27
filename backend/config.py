from dotenv import load_dotenv
import os

load_dotenv()

sender_email = os.getenv('EMAIL')
sender_password = os.getenv('PASSWORD')

class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///document_extraction.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class UploadConfig:
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 16 MB
    UPLOAD_FOLDER = "uploads"

class MailConfig:
    MAIL_SERVER = "mail.tammina.in"
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USE_TLS = False
    MAIL_USERNAME = sender_email
    MAIL_PASSWORD = sender_password
    MAIL_DEFAULT_SENDER = sender_email