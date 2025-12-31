# models.py

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import json
# Import security functions for password hashing
# Şifre hashleme için güvenlik fonksiyonlarını içe aktar
from werkzeug.security import generate_password_hash, check_password_hash
try:
    from zoneinfo import ZoneInfo
except ImportError:
    # Fallback for Python < 3.9
    # Python < 3.9 için geri dönüş
    from backports.zoneinfo import ZoneInfo

db = SQLAlchemy()
TR_TZ = ZoneInfo("Europe/Istanbul")

class User(db.Model):
    """
    User table: Stores user credentials securely.
    Kullanıcı tablosu: Kullanıcı kimlik bilgilerini güvenli bir şekilde saklar.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    
    # Email must be unique and is used for login
    # Email benzersiz olmalı ve giriş için kullanılır
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # Username with Tag (e.g., Efe#1234) for display
    # Görüntüleme için Etiketli Kullanıcı Adı (örn. Efe#1234)
    username = db.Column(db.String(80), unique=True, nullable=False)
    
    # Store the hashed password, never the plain text
    # Şifrelenmiş (hash) şifreyi sakla, asla düz metni saklama
    password_hash = db.Column(db.String(256), nullable=False)
    
    def set_password(self, password):
        """
        Hashes the password and stores it.
        Şifreyi hashler ve saklar.
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Checks if the provided password matches the hash.
        Sağlanan şifrenin hash ile eşleşip eşleşmediğini kontrol eder.
        """
        return check_password_hash(self.password_hash, password)

class Job(db.Model): 
    """
    Job table: Records for each task (Audio -> Whisper -> Agent).
    Job tablosu: Her bir iş için kayıt tutar (Ses -> Whisper -> Agent).
    """
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    audio_path = db.Column(db.Text, nullable=False)
    conversation_type = db.Column(db.Text, nullable=True)
    summary = db.Column(db.Text, nullable=True)
    
    language = db.Column(db.Text, nullable=True)
    clean_transcript = db.Column(db.Text, nullable=True)
    keypoints_json = db.Column(db.Text, nullable=True)   # list -> json string
    status = db.Column(db.Text, nullable=False, default='uploaded')  # uploaded|processing|done|error
    error_message = db.Column(db.Text, nullable=True)
    
    # Counter for how many times the pipeline ran for this job
    # Bu iş için pipeline'ın kaç kez çalıştığını gösteren sayaç
    run_count = db.Column(db.Integer, nullable=False, default=0) 

    created_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(TR_TZ).replace(tzinfo=None)
    )

    updated_at = db.Column(
        db.DateTime, nullable=False,
        default=lambda: datetime.now(TR_TZ).replace(tzinfo=None),
        onupdate=lambda: datetime.now(TR_TZ).replace(tzinfo=None)
    )

    def to_dict(self):
            return {
                "id": self.id,
                "audio_path": self.audio_path,
                "conversation_type": self.conversation_type,
                "summary": self.summary,
                "keypoints": None if not self.keypoints_json else json.loads(self.keypoints_json),
                "language": self.language,
                "clean_transcript": self.clean_transcript,
                "status": self.status,
                "error_message": self.error_message,
                "run_count": self.run_count,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }