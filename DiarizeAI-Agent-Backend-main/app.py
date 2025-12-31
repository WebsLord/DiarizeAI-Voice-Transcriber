# app.py

import os
import uuid
import json
import random # Imported for generating random tags / Rastgele etiket üretimi için eklendi
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from models import db, Job, User
from pipeline import run_whisper_and_agent

# Function to check allowed file extensions
# İzin verilen dosya uzantılarını kontrol eden fonksiyon
def allowed_file(filename: str, allowed: set[str]) -> bool:
    if "." not in filename:
        return False
    ext = filename.split(".")[-1]
    ext = ext.lower()
    if ext in allowed:
        return True
    else:
        return False

# Function to create the Flask app instance
# Flask uygulama örneğini oluşturan fonksiyon
def create_app():
    app = Flask(__name__) 
    app.config.from_object(Config) 
    
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True) 
    os.makedirs(app.config["INSTANCE_FOLDER"], exist_ok=True)

    db.init_app(app) 
    
    with app.app_context():
        # WARNING: Since we changed the User model (added email), 
        # existing tables might conflict. Ideally, delete the old .db file or migrate.
        # UYARI: User modelini değiştirdiğimiz için (email eklendi),
        # mevcut tablolar çakışabilir. İdeal olarak eski .db dosyasını silin.
        db.create_all() 
    
    # ---------------------------------------------------------
    # AUTH ROUTES (Login & Register)
    # ---------------------------------------------------------

    @app.route("/auth/register", methods=["POST"])
    def register():
        """
        Register a new user with Email and generate unique Username#Tag.
        Email ile yeni kullanıcı kaydet ve benzersiz KullanıcıAdı#Etiket oluştur.
        """
        data = request.get_json()
        
        # We need email, password and a base username (display name)
        # Email, şifre ve temel kullanıcı adına (görünen ad) ihtiyacımız var
        if not data or "email" not in data or "password" not in data or "username" not in data:
            return jsonify({"error": "Email, Kullanıcı Adı ve Şifre gereklidir."}), 400
        
        email = data["email"]
        base_username = data["username"] # e.g. "Efe"
        password = data["password"]

        # 1. Check if email already exists
        # 1. Email'in zaten kayıtlı olup olmadığını kontrol et
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Bu email adresi zaten kayıtlı."}), 400
        
        # 2. Generate unique username with tag (e.g. Efe#1234)
        # 2. Etiketli benzersiz kullanıcı adı oluştur (örn. Efe#1234)
        # Try 5 times to find a unique tag
        final_username = None
        for _ in range(5):
            tag = f"{random.randint(1000, 9999)}" # Random 4 digit number / Rastgele 4 haneli sayı
            candidate = f"{base_username}#{tag}"
            if not User.query.filter_by(username=candidate).first():
                final_username = candidate
                break
        
        if not final_username:
            # Fallback if 5 attempts fail (rare)
            final_username = f"{base_username}#{uuid.uuid4().hex[:4]}"

        # 3. Create user
        # 3. Kullanıcıyı oluştur
        new_user = User(email=email, username=final_username)
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            return jsonify({
                "message": "Kayıt başarılı", 
                "user_id": new_user.id,
                "display_name": final_username 
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Veritabanı hatası: {str(e)}"}), 500

    @app.route("/auth/login", methods=["POST"])
    def login():
        """
        Login with Email and Password.
        Email ve Şifre ile giriş yap.
        """
        data = request.get_json()

        if not data or "email" not in data or "password" not in data:
            return jsonify({"error": "Email ve şifre gereklidir."}), 400

        email = data["email"]
        password = data["password"]

        # Find user by EMAIL (not username)
        # Kullanıcıyı EMAIL ile bul (kullanıcı adı ile değil)
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            return jsonify({
                "access_token": f"token_{user.id}_{uuid.uuid4().hex[:10]}",
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "username": user.username, # Returns "Efe#1234" / "Efe#1234" döner
                    "email": user.email
                }
            }), 200
        else:
            return jsonify({"error": "Email veya şifre hatalı."}), 401

    # ---------------------------------------------------------
    # JOB ROUTES (UNCHANGED - DEĞİŞMEDİ)
    # ---------------------------------------------------------
    # (Existing Job routes remain the same...)
    # (Mevcut Job yolları aynı kalır...)
    
    # ... (Include the rest of your Job routes here exactly as they were) ...
    # ... (Kalan Job yollarını aynen buraya dahil et) ...
    # Kodu kısaltmak için Job route'larını buraya tekrar yapıştırmıyorum,
    # önceki Job kodları aynen geçerli. Sadece üst kısmı değiştirmen yeterli.
    
    # --- JOB ROUTE KOPYALAMA ALANI BAŞLANGICI (Mevcut kodunu koru) ---
    @app.post("/api/jobs")
    def upload_audio():
        if "file" not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        f = request.files["file"]
        if not f.filename:
            return jsonify({"error": "Filename is blank"}), 400
        if not allowed_file(f.filename, app.config["ALLOWED_EXTENSIONS"]):
            return jsonify({"error": "Not allowed file type"}), 400
        original = secure_filename(f.filename)
        ext = original.rsplit(".", 1)[1].lower()
        new_name = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], new_name)
        f.save(save_path)
        job = Job(audio_path=save_path, status="uploaded")
        db.session.add(job)
        db.session.commit()
        return jsonify(job.to_dict()), 201

    @app.post("/api/jobs/<int:job_id>/run")
    def run_job(job_id: int):
        job = Job.query.get_or_404(job_id) 
        try:
            job.status = "processing"
            job.error_message = None
            db.session.commit()
            out = run_whisper_and_agent(job.audio_path)
            job.conversation_type = out.get("conversation_type", "unknown")
            job.summary = out.get("summary", "unknown")
            job.keypoints_json = json.dumps(out.get("keypoints", []), ensure_ascii=False)
            md = out.get("metadata") or {}
            job.language = md.get("language")
            job.clean_transcript = md.get("clean_transcript")
            job.status = "done"
            job.run_count += 1
            db.session.commit()
            return jsonify(job.to_dict())
        except Exception as e:
            job.status = "error"
            job.error_message = str(e)
            job.run_count += 1
            db.session.commit()
            return jsonify(job.to_dict()), 500
        
    @app.post("/api/jobs/<int:job_id>/rerun")
    def rerun_job(job_id: int):
        return run_job(job_id)

    @app.get("/api/jobs/<int:job_id>")
    def get_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict())
    
    @app.get("/api/jobs")
    def list_jobs():
        jobs = Job.query.order_by(Job.id.desc()).all()
        return jsonify([j.to_dict() for j in jobs])
    
    @app.put("/api/jobs/<int:job_id>")
    def update_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        data = request.get_json(silent=True) or {}  
        if data.get("conversation_type"): job.conversation_type = data.get("conversation_type")
        if data.get("summary"): job.summary = data.get("summary")
        if data.get("keypoints"): job.keypoints_json = json.dumps(data.get("keypoints"), ensure_ascii=False)
        if data.get("language"): job.language = data.get("language")
        if data.get("clean_transcript"): job.clean_transcript = data.get("clean_transcript")            
        db.session.commit()
        return jsonify(job.to_dict())

    @app.delete("/api/jobs/<int:job_id>")
    def delete_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        try:
            if os.path.exists(job.audio_path):
                os.remove(job.audio_path)
        except Exception:
            pass
        db.session.delete(job)
        db.session.commit()
        return jsonify({"deleted": job_id})
    
    @app.delete("/api/jobs")
    def delete_all():
        delete_files = request.args.get("delete_files", "true").lower() == "true"
        jobs = Job.query.all()
        for job in jobs:
            if delete_files:
                try:
                    if os.path.exists(job.audio_path):
                        os.remove(job.audio_path)
                except Exception:
                    pass
            db.session.delete(job)
        db.session.commit()
        return jsonify({"deleted_all": True, "count": len(jobs)})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001, debug=True)