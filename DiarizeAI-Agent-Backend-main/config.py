#config.py
import os
from pathlib import Path
from dotenv import load_dotenv


# -------------------------------------------------
# 1) Proje ana dizinini bul
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"



# -------------------------------------------------
# 2) .env dosyasını yükle
# -------------------------------------------------
load_dotenv(BASE_DIR / ".env")


# -------------------------------------------------
# 3) Config sınıfı
# Flask, database, uploads, LLM ayarlarını burada topluyoruz.
# -------------------------------------------------
class Config:
    """
    Tüm backend ayarlarını tek noktadan yöneten sınıf.
    Flask uygulaması app.config.from_object(Config) ile burayı yükler.
    """

    # ---------------------------------------------
    # 🔐 Flask Secret Key
    # ---------------------------------------------
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "CHANGE_ME_IN_PRODUCTION"
    )
    # .env içindeki SECRET_KEY buraya yüklenir.
    # Flask session güvenliği için zorunludur.

    # ---------------------------------------------
    # 🛠 Debug Mode
    # ---------------------------------------------
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    # .env'de DEBUG=true ise → True olur.

    # ---------------------------------------------
    # 📁 Uploads Folder
    # ---------------------------------------------
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        str(BASE_DIR / "uploads")
    )
    # Upload klasörü yoksa Flask'ta ilk çalıştırmada oluşturacağız.

    INSTANCE_FOLDER = os.getenv(
    "INSTANCE_FOLDER",
    str((BASE_DIR / "instance").resolve())
    )


    #Upload dosyası limiti (bytes)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(200 * 1024 * 1024)))
    # .env örneği: ALLOWED_EXTENSIONS=wav,mp3,m4a,ogg,webm
    _exts = os.getenv("ALLOWED_EXTENSIONS", "wav,mp3,m4a,ogg,webm")
    ALLOWED_EXTENSIONS = {e.strip().lower() for e in _exts.split(",") if e.strip()} # Küçük harfe çevir ve boşlukları temizle set yap




    # ---------------------------------------------
    # 🗄 Database URL
    # ---------------------------------------------
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'diarize_ai_agent.db'}"
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ---------------------------------------------
    # 🤖 LLM Model Settings (LiteLLM)
    # ---------------------------------------------
    # Default to Gemini 2.0 Flash; override with LLM_MODEL in .env
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-2.0-flash")

    # Provider API keys (LiteLLM reads provider-specific env vars too)
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

    # Pick a key for LiteLLM when we pass api_key explicitly.
    LLM_API_KEY = GOOGLE_API_KEY 

    # ---------------------------------------------
    # 🔊 (İleride) Whisper, diarization ayarları buraya eklenebilir
    # ---------------------------------------------
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
    HF_TOKEN = os.getenv("HF_TOKEN", "")
