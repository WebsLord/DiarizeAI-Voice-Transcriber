# app.py

import os
import uuid
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from models import db, Job
from pipeline import run_whisper_and_agent

# Function to check allowed file extensions
# İzin verilen dosya uzantılarını kontrol eden fonksiyon
def allowed_file(filename: str, allowed: set[str]) -> bool:
    if "." not in filename:
        return False
    # Get the extension after the last dot
    # Son noktadan sonraki uzantıyı al
    ext = filename.split(".")[-1]
    ext = ext.lower()
    
    if ext in allowed:
        return True
    else:
        return False

# Function to create the Flask app instance
# Flask uygulama örneğini oluşturan fonksiyon
def create_app():
    # Create Flask app instance
    # Flask uygulama örneğini oluştur
    app = Flask(__name__) 
    
    # Load config from Config class
    # Config sınıfından yapılandırmayı yükle
    app.config.from_object(Config) 
    
    # Create upload folder if it doesn't exist
    # Yükleme klasörü yoksa oluştur
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True) 
    os.makedirs(app.config["INSTANCE_FOLDER"], exist_ok=True)

    # Initialize database with Flask app
    # Veritabanını Flask uygulamasıyla başlat
    db.init_app(app) 
    
    with app.app_context():
        # Create database tables if they don't exist
        # Veritabanı tabloları yoksa oluştur
        db.create_all() 
    
    # ---------------------------------------------------------
    # AUTH ROUTES (Login & Register) - ADDED FOR MOBILE APP
    # KİMLİK DOĞRULAMA YOLLARI (Giriş & Kayıt) - MOBİL UYGULAMA İÇİN EKLENDİ
    # ---------------------------------------------------------

    @app.route("/auth/register", methods=["POST"])
    def register():
        # Mock registration for demo purposes
        # Demo amaçlı sahte kayıt işlemi
        return jsonify({"message": "Registration successful", "user_id": 1}), 201

    @app.route("/auth/login", methods=["POST"])
    def login():
        # Mock login: Accept any credentials and return a fake token
        # Sahte giriş: Herhangi bir bilgiyi kabul et ve sahte token döndür
        return jsonify({
            "access_token": "demo_token_12345", 
            "token_type": "bearer",
            "user": {"username": "demo_user"}
        }), 200

    # ---------------------------------------------------------
    # JOB ROUTES
    # İŞ YOLLARI
    # ---------------------------------------------------------

    @app.post("/api/jobs")
    def upload_audio():
        if "file" not in request.files:
            return jsonify({"error": "No file part in the request"}), 400

        f = request.files["file"]
        if not f.filename:
            return jsonify({"error": "Filename is blank"}), 400
        
        # Check if file type is allowed
        # Dosya türünün izinli olup olmadığını kontrol et
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
        # Return 404 if job not found
        # İş bulunamazsa 404 döndür
        job = Job.query.get_or_404(job_id) 
        try:
            job.status = "processing"
            job.error_message = None
            db.session.commit()

            # Run the AI pipeline
            # Yapay zeka boru hattını çalıştır
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

    # ---------- Get: GET /api/jobs/<id> ----------
    @app.get("/api/jobs/<int:job_id>")
    def get_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict())
    
    # ---------- Get: GET /api/jobs ----------
    @app.get("/api/jobs")
    def list_jobs():
        jobs = Job.query.order_by(Job.id.desc()).all()
        return jsonify([j.to_dict() for j in jobs])
    

    @app.put("/api/jobs/<int:job_id>")
    def update_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        data = request.get_json(silent=True) or {}  

        conversation_type = data.get("conversation_type")
        if conversation_type is not None:
            job.conversation_type = conversation_type

        summary = data.get("summary")
        if summary is not None:
            job.summary = summary

        keypoints = data.get("keypoints")
        if keypoints is not None:
            job.keypoints_json = json.dumps(keypoints, ensure_ascii=False)

        language = data.get("language")
        if language is not None:
            job.language = language

        clean_transcript = data.get("clean_transcript")
        if clean_transcript is not None:
            job.clean_transcript = clean_transcript            

        db.session.commit()
        return jsonify(job.to_dict())

    # ---------- Delete one: DELETE /api/jobs/<id> ----------
    @app.delete("/api/jobs/<int:job_id>")
    def delete_job(job_id: int):
        job = Job.query.get_or_404(job_id)

        # Delete the file if requested
        # Eğer istenirse dosyayı da sil
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
        """
        Delete all records + files.
        Tüm kayıtları + dosyaları siler.
        Example query: /api/jobs?delete_files=false
        Örnek sorgu: /api/jobs?delete_files=false
        """
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
        return jsonify({"deleted_all": True, "count": len(jobs), "delete_files": delete_files})

    return app

# Main entry point
# Ana giriş noktası
if __name__ == '__main__':
    # Initialize the app using the factory function (Crucial Fix!)
    # Fabrika fonksiyonunu kullanarak uygulamayı başlat (Kritik Düzeltme!)
    app = create_app()
    
    # Run the app on host 0.0.0.0 to make it accessible from mobile devices on the same network
    # Aynı ağdaki mobil cihazlardan erişilebilir olması için uygulamayı 0.0.0.0 hostunda çalıştır
    app.run(host='0.0.0.0', port=5001, debug=True)