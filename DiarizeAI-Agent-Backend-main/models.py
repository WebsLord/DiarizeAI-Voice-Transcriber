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
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
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
    
    # Detected language by Whisper
    language = db.Column(db.Text, nullable=True)
    clean_transcript = db.Column(db.Text, nullable=True)
    keypoints_json = db.Column(db.Text, nullable=True)
    
    # --- NEW: Segments JSON for Karaoke Mode ---
    # --- YENİ: Karaoke Modu için Segment JSON'ı ---
    # Stores detailed list: [{start, end, speaker, text}, ...]
    # Detaylı listeyi saklar: [{start, end, speaker, text}, ...]
    segments_json = db.Column(db.Text, nullable=True)

    status = db.Column(db.Text, nullable=False, default='uploaded')
    error_message = db.Column(db.Text, nullable=True)
    run_count = db.Column(db.Integer, nullable=False, default=0) 

    # --- NEW FIELDS FOR PROMPT ENGINEERING ---
    # --- PROMPT MÜHENDİSLİĞİ İÇİN YENİ ALANLAR ---
    summary_lang = db.Column(db.String(10), default="original") # tr, en, original
    transcript_lang = db.Column(db.String(10), default="original")
    input_keywords = db.Column(db.Text, nullable=True) # "Exam // Final"
    focus_exclusive = db.Column(db.Boolean, default=False) # Only focus on keywords?

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
                
                # Return segments to frontend / Segmentleri frontend'e döndür
                "segments": None if not self.segments_json else json.loads(self.segments_json),
                
                "status": self.status,
                "error_message": self.error_message,
                "run_count": self.run_count,
                "summary_lang": self.summary_lang,
                "transcript_lang": self.transcript_lang,
                "input_keywords": self.input_keywords,
                "focus_exclusive": self.focus_exclusive,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }