# config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# -------------------------------------------------
# 1) Find project root directory
# 1) Proje ana dizinini bul
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"

# -------------------------------------------------
# 2) Load .env file
# 2) .env dosyasını yükle
# -------------------------------------------------
load_dotenv(BASE_DIR / ".env")

# -------------------------------------------------
# 3) Config Class
# Flask, database, uploads, and LLM settings are collected here.
# 3) Config Sınıfı
# Flask, veritabanı, yüklemeler ve LLM ayarları burada toplanır.
# -------------------------------------------------
class Config:
    """
    Central class to manage all backend configurations.
    Loaded by Flask app via app.config.from_object(Config).
    
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
    # SECRET_KEY is loaded from .env.
    # Mandatory for Flask session security.
    # .env içindeki SECRET_KEY buraya yüklenir.
    # Flask session güvenliği için zorunludur.

    # ---------------------------------------------
    # 🛠 Debug Mode
    # ---------------------------------------------
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    # If DEBUG=true in .env -> becomes True here.
    # .env'de DEBUG=true ise → True olur.

    # ---------------------------------------------
    # 📁 Uploads Folder
    # ---------------------------------------------
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        str(BASE_DIR / "uploads")
    )
    # Backend creates this folder on first run if missing.
    # Upload klasörü yoksa Flask ilk çalıştırmada oluşturur.

    INSTANCE_FOLDER = os.getenv(
        "INSTANCE_FOLDER",
        str((BASE_DIR / "instance").resolve())
    )

    # ---------------------------------------------
    # 📏 File Upload Limits & Extensions
    # ---------------------------------------------
    
    # Upload file size limit (bytes) - 200 MB
    # Yükleme dosyası boyutu limiti (byte) - 200 MB
    MAX_CONTENT_LENGTH = 200 * 1024 * 1024

    # Allowed audio extensions only
    # Sadece izin verilen ses uzantıları
    ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'webm'}

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
    # Varsayılan Gemini 2.0 Flash; .env içinde LLM_MODEL ile değiştirilebilir
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-2.0-flash")

    # Provider API keys (LiteLLM reads provider-specific env vars too)
    # Sağlayıcı API anahtarları (LiteLLM sağlayıcıya özel env değişkenlerini de okur)
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

    # Pick a key for LiteLLM when we pass api_key explicitly.
    # LiteLLM'e açıkça api_key geçirdiğimizde kullanılacak anahtar.
    LLM_API_KEY = GOOGLE_API_KEY 

    # ---------------------------------------------
    # 🔊 Whisper Settings (Optional/Future)
    # ---------------------------------------------
    WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
    HF_TOKEN = os.getenv("HF_TOKEN", "")