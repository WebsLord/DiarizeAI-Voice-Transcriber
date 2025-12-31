
# Diarize AI Agent Backend (Flask + SQLite)

A lightweight Flask REST API that:
1) Accepts an audio file upload over HTTP
2) Saves the file to `uploads/`
3) Runs a **Whisper transcription** step that returns **segments**
4) Runs an **Agent/LLM analysis** step (e.g., Gemini) to extract:
   - `conversation_type`
   - `summary`
   - `keypoints`
   - `language`
   - `clean_transcript`
5) Stores everything in a **SQLite** database (`jobs` table)

> You already have the Whisper + Agent code. This backend just connects the pieces and exposes REST endpoints.

---

## Tech Stack

- **Python 3.x**
- **Flask**
- **Flask-SQLAlchemy**
- **SQLite**
- Whisper (your implementation)
- Gemini/Agent (your implementation)
- `python-dotenv` for `.env`

---

## Project Structure (suggested)

```

diarize-ai-agent-backend/
├─ app.py                # Flask app + routes
├─ config.py             # Config class (loads .env)
├─ models.py             # SQLAlchemy db + Job model
├─ pipeline.py           # run_whisper_and_agent(audio_path)
├─ uploads/              # saved audio files
├─ instance/             # instance folder (optional)
├─ diarize_ai_agent.db   # sqlite db file (created at runtime)
├─ .env                  # secrets (NOT committed)
├─ .env.example          # example env file (committed)
└─ requirements.txt

````

---

## Setup

### 1) Create and activate a virtual environment

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
````

**Windows (PowerShell)**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

---

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

If you don’t have `requirements.txt` yet, you can generate it after installing:

```bash
pip freeze > requirements.txt
```

---

### 3) Create `.env`

Copy the example file:

```bash
cp .env.example .env
```

Fill in the required keys in `.env`.

---

## Environment Variables

Create a `.env` file in the project root.

Example (`.env.example`):

```env
SECRET_KEY=
DEBUG=true
UPLOAD_FOLDER=uploads
INSTANCE_FOLDER=instance
DATABASE_URL=sqlite:///diarize_ai_agent.db

LLM_MODEL=gemini-2.5-flash
GEMINI_API_KEY=

WHISPER_MODEL=small
HF_TOKEN=

MAX_CONTENT_LENGTH=209715200
ALLOWED_EXTENSIONS=wav,mp3,m4a,ogg,webm
```

### Notes

* `DATABASE_URL=sqlite:///diarize_ai_agent.db` creates the DB file in the project root.
* `MAX_CONTENT_LENGTH` is in **bytes** (200MB = 209715200).
* Do not commit `.env` (keep it secret).

---

## Running the Server

```bash
python3 app.py
```

By default you should see:

* `http://127.0.0.1:5000`

---

## Database

This project uses **SQLite** via SQLAlchemy.

* Table: `jobs`
* A `Job` represents one pipeline run request (one uploaded file).

### Typical status flow

* `uploaded` → file saved
* `processing` → pipeline started
* `done` → analysis stored successfully
* `error` → pipeline failed, see `error_message`

---

## API Endpoints

### 1) Create Job (Upload audio)

**POST** `/api/jobs`

* Content-Type: `multipart/form-data`
* Form field name must be: `file`

**Postman**

* Method: `POST`
* Body → `form-data`
* Key: `file` (type: File)
* Choose an audio file: `.wav`, `.mp3`, etc.

**cURL**

```bash
curl -X POST http://127.0.0.1:5000/api/jobs \
  -F "file=@/absolute/path/to/audio.wav"
```

**Response (201) example**

```json
{
  "id": 1,
  "audio_path": "uploads/8f1c2a0d...wav",
  "status": "uploaded",
  "summary": null,
  "keypoints": null,
  "language": null,
  "clean_transcript": null,
  "created_at": "2025-12-26T20:57:00",
  "updated_at": "2025-12-26T20:57:00"
}
```

---

### 2) List Jobs

**GET** `/api/jobs`

Returns an array of jobs ordered by newest first.

**Response (200)**

```json
[
  { "id": 3, "status": "done", ... },
  { "id": 2, "status": "processing", ... },
  { "id": 1, "status": "uploaded", ... }
]
```

---

### 3) Get One Job

**GET** `/api/jobs/<job_id>`

Example:

```bash
curl http://127.0.0.1:5000/api/jobs/1
```

---

### 4) Update Job Fields (manual update)

**PUT** `/api/jobs/<job_id>`

JSON body (any subset is allowed):

```json
{
  "conversation_type": "meeting",
  "summary": "Short summary...",
  "keypoints": ["a", "b", "c"],
  "language": "tr",
  "clean_transcript": "Speaker00: ..."
}
```

**cURL**

```bash
curl -X PUT http://127.0.0.1:5000/api/jobs/1 \
  -H "Content-Type: application/json" \
  -d '{"summary":"Updated summary"}'
```

---

### 5) Run Pipeline (Whisper + Agent)

**POST** `/api/jobs/<job_id>/run`

What it does:

* sets `status=processing`
* runs `run_whispeand_agent(audio_path)`
* writes results into DB
* sets `status=done` or `status=error`

**cURL**

```bash
curl -X POST http://127.0.0.1:5000/api/jobs/1/run
```

---

### 6) Delete All Jobs (dangerous)

**DELETE** `/api/jobs`

Deletes all records (optionally you can also delete files in uploads/ depending on your implementation).

---

## Common Errors & Fixes

### 405 Method Not Allowed

You opened a POST-only endpoint in the browser (browser sends GET).
Use Postman/cURL with the correct method.

### `AttributeError: 'Job' object has no attribute 'to_dict'`

Ensure `to_dict()` is indented inside the `Job` class.

### `TypeError: Object of type method is not JSON serializable`

You returned `job.to_dict` instead of `job.to_dict()`.
Call the method.

### Upload is rejected

Check:

* `ALLOWED_EXTENSIONS`
* file extension
* `MAX_CONTENT_LENGTH`

---

## Security Notes (Important)

* This is a development server. Do not deploy Flask dev server in production.
* Do not commit `.env` or API keys.
* `secure_filename()` is used to sanitize file names.
* Consider scanning or validating uploaded files in production.

---

## Next Improvements (Optional)

* Pagination for `GET /api/jobs`
* Background processing (Celery/RQ) so requests don’t block
* File cleanup / retention policy
* Authentication (JWT)
* Store `segments` in DB if needed

---


