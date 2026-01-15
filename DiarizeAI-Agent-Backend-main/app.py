# src/app.py

import os
import uuid
import json
import random 
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from models import db, Job, User
# IMPORT UPDATED: Added run_agent_on_text
from pipeline import run_whisper_and_agent, run_agent_on_text

def allowed_file(filename: str, allowed: set[str]) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    if ext in allowed:
        return True
    else:
        return False

def create_app():
    app = Flask(__name__) 
    app.config.from_object(Config) 
    
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True) 
    os.makedirs(app.config["INSTANCE_FOLDER"], exist_ok=True)

    db.init_app(app) 
    
    with app.app_context():
        db.create_all() 
    
    # ---------------------------------------------------------
    # AUTH ROUTES
    # ---------------------------------------------------------

    @app.route("/auth/register", methods=["POST"])
    def register():
        data = request.get_json()
        if not data or "email" not in data or "password" not in data or "username" not in data:
            return jsonify({"error": "Email, Username, and Password are required."}), 400
        
        email = data["email"]
        base_username = data["username"] 
        password = data["password"]

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "This email address is already registered."}), 400
        
        final_username = None
        for _ in range(5):
            tag = f"{random.randint(1000, 9999)}" 
            candidate = f"{base_username}#{tag}"
            if not User.query.filter_by(username=candidate).first():
                final_username = candidate
                break
        
        if not final_username:
            final_username = f"{base_username}#{uuid.uuid4().hex[:4]}"

        new_user = User(email=email, username=final_username)
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            return jsonify({
                "message": "Registration successful", 
                "user_id": new_user.id,
                "display_name": final_username 
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    @app.route("/auth/login", methods=["POST"])
    def login():
        data = request.get_json()
        if not data or "email" not in data or "password" not in data:
            return jsonify({"error": "Email and password are required."}), 400

        email = data["email"]
        password = data["password"]

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            return jsonify({
                "access_token": f"token_{user.id}_{uuid.uuid4().hex[:10]}",
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "username": user.username, 
                    "email": user.email
                }
            }), 200
        else:
            return jsonify({"error": "Invalid email or password."}), 401

    # ---------------------------------------------------------
    # JOB ROUTES
    # ---------------------------------------------------------
    
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
        if not original: 
            original = "audio_file"

        if "." in original:
            ext = original.rsplit(".", 1)[1].lower()
        else:
            ext = f.filename.rsplit(".", 1)[1].lower() if "." in f.filename else "m4a"

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
        
        data = request.get_json(silent=True) or request.form.to_dict() or request.args.to_dict() or {}
        print(f"🌍 INCOMING FRONTEND DATA (RAW): {data}")

        val_summary = data.get("summaryLang") or data.get("summary_lang")
        if val_summary: job.summary_lang = val_summary
            
        val_transcript = data.get("transcriptLang") or data.get("transcript_lang")
        if val_transcript: job.transcript_lang = val_transcript
            
        val_keywords = data.get("keywords") or data.get("input_keywords")
        if val_keywords: job.input_keywords = val_keywords
            
        val_exclusive = data.get("focusExclusive") or data.get("focus_exclusive")
        if str(val_exclusive).lower() == "true": job.focus_exclusive = True
        elif str(val_exclusive).lower() == "false": job.focus_exclusive = False

        val_flags = data.get("input_flags")
        if val_flags: 
            job.flags = val_flags
        
        try:
            job.status = "processing"
            job.error_message = None
            db.session.commit()
            
            # RUN FULL PIPELINE (Whisper + Agent)
            out = run_whisper_and_agent(
                audio_path=job.audio_path,
                summary_lang=job.summary_lang,
                transcript_lang=job.transcript_lang,
                keywords=job.input_keywords,
                focus_exclusive=job.focus_exclusive,
                flags=job.flags 
            )
            
            job.conversation_type = out.get("conversation_type", "unknown")
            job.summary = out.get("summary", "unknown")
            job.keypoints_json = json.dumps(out.get("keypoints", []), ensure_ascii=False)
            
            segments_data = out.get("segments", []) or out.get("transcript_segments", [])
            
            try:
                job.segments = segments_data
            except:
                pass 
            
            md = out.get("metadata") or {}
            job.language = md.get("language")
            job.clean_transcript = md.get("clean_transcript")
            
            job.status = "done"
            job.run_count += 1
            db.session.commit()

            response_payload = job.to_dict()
            response_payload['segments'] = segments_data 
            
            return jsonify(response_payload)

        except Exception as e:
            print(f"❌ ERROR DURING PROCESSING: {str(e)}")
            job.status = "error"
            job.error_message = str(e)
            job.run_count += 1
            db.session.commit()
            return jsonify(job.to_dict()), 500

    # --- NEW ENDPOINT: RE-ANALYZE (Text Only) ---
    @app.post("/api/jobs/<int:job_id>/reanalyze")
    def reanalyze_job(job_id: int):
        job = Job.query.get_or_404(job_id)
        
        # Get updated segments from frontend
        data = request.get_json(silent=True) or {}
        updated_segments = data.get("segments")

        if not updated_segments:
            return jsonify({"error": "No segments provided for re-analysis."}), 400

        try:
            print(f"♻️ RE-ANALYZING Job {job_id} with {len(updated_segments)} segments...")
            job.status = "processing"
            db.session.commit()

            # RUN AGENT ONLY (No Whisper)
            out = run_agent_on_text(
                segments=updated_segments,
                summary_lang=job.summary_lang,
                transcript_lang=job.transcript_lang,
                keywords=job.input_keywords,
                focus_exclusive=job.focus_exclusive,
                flags=job.flags
            )

            # Update Fields with New Analysis
            # Yeni analizle alanları güncelle (Özet, Anahtar Noktalar)
            job.summary = out.get("summary", job.summary)
            job.keypoints_json = json.dumps(out.get("keypoints", []), ensure_ascii=False)
            
            # If agent returned processed segments (e.g. translated), update them.
            # Else, trust the user edited segments.
            # Ajan işlenmiş segmentler (örn. çeviri) döndürdüyse güncelle, yoksa kullanıcının düzenlediğine güven.
            gemini_segments = out.get("segments")
            if gemini_segments and len(gemini_segments) > 0:
                job.segments = gemini_segments
            else:
                job.segments = updated_segments

            job.status = "done"
            db.session.commit()

            response_payload = job.to_dict()
            response_payload['segments'] = job.segments
            
            return jsonify(response_payload)

        except Exception as e:
            print(f"❌ ERROR DURING RE-ANALYSIS: {str(e)}")
            job.status = "error"
            job.error_message = str(e)
            db.session.commit()
            return jsonify({"error": str(e)}), 500
        
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
    
    # --- DEBUG: AKTİF ROTALARI LİSTELE ---
    print("\n" + "="*40)
    print("🛣️  ROUTES DEFINED ON THE SERVER:")
    print("="*40)
    # Rotaları düzgünce sıralayıp yazdıralım
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods)
        print(f"👉 {rule.rule} [{methods}]")
    print("="*40 + "\n")
    # -------------------------------------

    app.run(host='0.0.0.0', port=5001, debug=True)