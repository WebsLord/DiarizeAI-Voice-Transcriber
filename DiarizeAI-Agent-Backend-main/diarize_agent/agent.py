# agent.py

import os
import json
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError


# -----------------------------
# 1) New Schema (topics removed)
# 1) Yeni Şema (topics kaldırıldı)
# -----------------------------
class StructuredSummary(BaseModel):
    conversation_type: str = Field(
        ...,
        description="meeting | university_lecture | phone_call | interview | other"
    )
    summary: str = Field(..., description="Overall summary")
    keypoints: List[str] = Field(default_factory=list, description="3–10 key bullet points")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extra info, includes language, clean_transcript with speaker labels")


# -----------------------------
# 2) Helpers: JSON cleaning/extraction
# 2) Yardımcılar: JSON temizleme/çıkarma
# -----------------------------
def _strip_code_fences(text: str) -> str:
    text = text.strip()
    m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return text


def _extract_first_json_object(text: str) -> str:
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1].strip()
    return text


def _safe_json_loads(raw_text: str) -> Dict[str, Any]:
    cleaned = _strip_code_fences(raw_text)
    cleaned = _extract_first_json_object(cleaned)
    return json.loads(cleaned)


# -----------------------------
# 3) Prompt (Dynamic Prompt Engineering)
# 3) Prompt (Dinamik Prompt Mühendisliği)
# -----------------------------
def _build_prompt(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False
) -> str:
    
    segments_json = json.dumps(segments, ensure_ascii=False)

    # --- DYNAMIC INSTRUCTIONS ---
    
    # 1. Summary Language Logic
    summary_instruction = "Generate the summary in the original language of the audio."
    if summary_lang and summary_lang != "original":
        summary_instruction = f"IMPORTANT: Generate the summary STRICTLY in '{summary_lang}' language."

    # 2. Transcript Language Logic
    transcript_instruction = "Correct the transcript preserving its original language."
    if transcript_lang and transcript_lang != "original":
        transcript_instruction = f"IMPORTANT: Translate the corrected transcript STRICTLY into '{transcript_lang}' language."

    # 3. Focus/Keywords Logic
    focus_instruction = ""
    if keywords:
        focus_instruction = f"\nUSER FOCUS KEYWORDS: {keywords}\n"
        if focus_exclusive:
            focus_instruction += "EXCLUSIVE MODE ACTIVE: Ignore all topics NOT related to the keywords above. Only summarize and extract points related to these keywords.\n"
        else:
            focus_instruction += "Please prioritize and highlight information related to these keywords in the summary.\n"


    label_rules = """
DIARIZATION & LABELING:
- Add a speaker label to the beginning of each segment's text.
- If you can infer context and roles clearly: use "Teacher:", "Student:", etc.
- Otherwise use "Speaker00:", "Speaker01:".
"""

    correction_rules = f"""
WHISPER CORRECTION & TRANSLATION:
- segments[].text must be corrected.
- {transcript_instruction}
- Fix errors (spelling, grammar).
"""

    output_schema = """
OUTPUT MUST BE VALID JSON ONLY.
SCHEMA:
{
  "conversation_type": "meeting | university_lecture | phone_call | interview | other",
  "summary": "string",
  "keypoints": ["string", "..."],
  "metadata": {
    "language": "string (detected)",
    "clean_transcript": "string (merged, corrected transcript from segments)",
  }
}
"""

    task = f"""
You are an "Audio Transcript Analyzer" agent.

SPECIAL REQUESTS:
1) {summary_instruction}
2) {focus_instruction}

Your Tasks:
1) Predict conversation_type.
2) Generate summary (in the requested language).
3) Generate keypoints (3–10 bullets).
4) Generate metadata.clean_transcript ({transcript_instruction}).

{label_rules}
{correction_rules}
{output_schema}

INPUT SEGMENTS (JSON):
{segments_json}
""".strip()

    return task


# -----------------------------
# 4) Gemini Call
# 4) Gemini çağrısı
# -----------------------------
def analyze_audio_segments_with_gemini(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False,
    model_name: str = "gemini-2.0-flash",
    temperature: float = 0.1,
    max_retries: int = 2,
    timeout_sec: int = 240,
) -> Dict[str, Any]:
    
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY didn't found.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    # Pass dynamic settings to prompt builder
    prompt = _build_prompt(
        segments, 
        summary_lang=summary_lang, 
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": temperature,
        },
    }

    last_error: Optional[Exception] = None
    
    for attempt in range(max_retries + 1):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=timeout_sec)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text}")

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError(f"Gemini candidates boş döndü: {data}")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                raise RuntimeError(f"Gemini content.parts.text yok: {data}")

            raw_text = parts[0]["text"]
            parsed = _safe_json_loads(raw_text)

            validated = StructuredSummary.model_validate(parsed)
            return validated.model_dump()

        except (json.JSONDecodeError, ValidationError, requests.RequestException, RuntimeError) as e:
            last_error = e
            if attempt < max_retries:
                payload["contents"][0]["parts"][0]["text"] = (
                    prompt
                    + 
                      "\n\nERROR: Your previous output was not valid JSON or did not conform to the schema. "
                      "Please return ONLY valid JSON. Do not write any additional text."
                )
                continue
            break

    raise RuntimeError(f"Gemini analysis failed. Final error: {last_error}")


if __name__ == "__main__":
    # Test with dummy data
    test_segments = [
        {"start": 7.0, "end": 8.0, "text": "Well, can't afford to know him."},
        {"start": 8.0, "end": 10.0, "text": "teacher today we learn about flask and corse."},
    ]
    # Test specific instruction
    result = analyze_audio_segments_with_gemini(
        test_segments, 
        summary_lang="tr", 
        keywords="flask // corse",
        focus_exclusive=False
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))