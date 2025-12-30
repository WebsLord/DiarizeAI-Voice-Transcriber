from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
import json
from zoneinfo import ZoneInfo

db = SQLAlchemy()
TR_TZ = ZoneInfo("Europe/Istanbul")

class Job(db.Model): #Job demek agent+whisper pipeline çalıştırdığın her bir iş demek
    """
    Job tablosu: Her bir iş için kayıt tutar.
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
    
    run_count = db.Column(db.Integer, nullable=False, default=0) #bu job için Whisper+agent pipeline’ını kaç kere çalıştırdın sayacı

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
