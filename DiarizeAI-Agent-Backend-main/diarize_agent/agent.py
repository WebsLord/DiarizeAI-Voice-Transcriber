# src/diarize_agent/agent.py

import os
import json
import re
import time  # Bekleme modülü
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError


# -----------------------------
# 1) Schema Definition
# -----------------------------
class SegmentItem(BaseModel):
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    speaker: str = Field(..., description="Real Name (e.g. Efe) if detected, otherwise Speaker Label")
    text: str = Field(..., description="Corrected/Translated text content")

class StructuredSummary(BaseModel):
    conversation_type: str = Field(
        ...,
        description="meeting | university_lecture | phone_call | interview | other"
    )
    summary: str = Field(..., description="Overall summary")
    keypoints: List[str] = Field(default_factory=list, description="3–10 key bullet points")
    
    # Karaoke Modu için Segment Listesi
    segments: List[SegmentItem] = Field(
        default_factory=list, 
        description="List of segments with REAL NAMES and corrected text"
    )
    
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extra info, includes language, clean_transcript")


# -----------------------------
# 2) Helpers
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
# 3) AGGRESSIVE PROMPT ENGINEERING (CONTEXT-AWARE NAMING)
# -----------------------------
def _build_prompt(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False
) -> str:
    
    segments_json = json.dumps(segments, ensure_ascii=False)

    # Dil Haritası
    lang_map = {
        "en": "ENGLISH",
        "tr": "TURKISH",
        "fr": "FRENCH",
        "de": "GERMAN",
        "es": "SPANISH",
        "it": "ITALIAN",
        "ru": "RUSSIAN",
        "ja": "JAPANESE",
        "ko": "KOREAN",
        "zh": "CHINESE",
        "pt": "PORTUGUESE"
    }

    target_sum_lang_name = lang_map.get(summary_lang.lower(), summary_lang.upper()) if summary_lang else "ORIGINAL LANGUAGE"
    target_trans_lang_name = lang_map.get(transcript_lang.lower(), transcript_lang.upper()) if transcript_lang else "ORIGINAL LANGUAGE"

    # --- DİNAMİK KURALLAR ---
    
    # 1. Özet Dili
    if summary_lang and summary_lang.lower() != "original":
        summary_instruction = (
            f"*** CRITICAL LANGUAGE RULE ***\n"
            f"You MUST write the 'summary' and 'keypoints' ONLY in {target_sum_lang_name}.\n"
            f"Translate the summary to {target_sum_lang_name} even if the audio is different."
        )
    else:
        summary_instruction = "Write the summary and keypoints in the SAME language as the audio."

    # 2. Transkript Dili
    if transcript_lang and transcript_lang.lower() != "original":
        transcript_instruction = (
            f"Translate the 'text' field of segments AND the 'clean_transcript' fully into {target_trans_lang_name}."
        )
    else:
        transcript_instruction = "Keep the 'text' fields in original language, fixing grammar/spelling."

    # 3. Odak
    focus_instruction = ""
    if keywords:
        focus_instruction = f"\nFOCUS KEYWORDS: {keywords}\n"
        if focus_exclusive:
            focus_instruction += "IGNORE topics unrelated to keywords in the SUMMARY. But KEEP ALL SEGMENTS in transcript.\n"
        else:
            focus_instruction += "Highlight these keywords in the summary.\n"

    
    # --- PROMPT (The Brain) ---
    task = f"""
You are an expert AI Audio Analyst.

INPUT DATA (Segments with timestamps and generic Speaker Labels):
{segments_json}

--- YOUR CORE TASKS ---
1. {summary_instruction}
2. {transcript_instruction}
3. {focus_instruction}

4. **AGGRESSIVE SPEAKER RENAMING (MANDATORY)**:
   - **GOAL**: Replace generic labels (e.g., "SPEAKER_01") with REAL NAMES (e.g., "Ali", "Ayşe") derived from context.
   - **RULE 1**: If a speaker says "My name is Ali" or "I am Ali", you MUST change "SPEAKER_XX" to "Ali" for **ALL** segments belonging to that speaker ID.
   - **RULE 2**: Be aggressive. If the context implies a name (e.g., someone says "Hey Ali" and the other person responds), rename the responder.
   - **RULE 3**: If you rename a speaker, use the Real Name in the `segments` list and `clean_transcript`.

   **EXAMPLE OF DESIRED BEHAVIOR**:
   Input Segment: {{ "speaker": "SPEAKER_00", "text": "Merhaba, benim adım Efe." }}
   Output Segment: {{ "speaker": "Efe", "text": "Merhaba, benim adım Efe." }}

5. **CLEAN TRANSCRIPT FORMAT**:
   - In 'metadata.clean_transcript', merge consecutive segments from the same speaker.
   - Use the REAL NAME if detected.

--- REQUIRED JSON OUTPUT FORMAT ---
{{
  "conversation_type": "meeting | lecture | interview | other",
  "summary": "Summary string...",
  "keypoints": ["Point 1", "Point 2"],
  "segments": [
    {{ "start": 0.0, "end": 2.5, "speaker": "DETECTED_NAME_OR_LABEL", "text": "Text..." }}
  ],
  "metadata": {{
    "language": "Detected language code",
    "clean_transcript": "Merged transcript text..."
  }}
}}

Take a deep breath. Use context to rename speakers aggressively in the 'segments' array.
""".strip()

    return task


# -----------------------------
# 4) Gemini Call
# -----------------------------
def analyze_audio_segments_with_gemini(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False,
    model_name: str = "gemini-2.5-flash", # <--- GERİ ALINDI: Çalışan model (2.0)
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

    prompt = _build_prompt(
        segments, 
        summary_lang=summary_lang, 
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )

    print(f"\n🚀 PROMPT SENT TO AI (Aggressive Renaming Active):")
    print(f"   Target Summary Lang: {summary_lang}")
    print(f"   Target Transcript Lang: {transcript_lang}")
    print(f"   Using Model: {model_name}")

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
            
            # --- 429 HATASI YÖNETİMİ (GÜNCELLENDİ: 60 SANİYE) ---
            if resp.status_code == 429:
                print(f"⚠️ Hız Sınırı (429) - {attempt+1}. deneme başarısız. 60 saniye bekleniyor...")
                time.sleep(60) # <--- Google'ın istediği süre kadar bekle (1 dk)
                if attempt == max_retries:
                     raise RuntimeError(f"HTTP 429: Rate Limit Exceeded after waiting")
                continue # Döngüye devam et, tekrar dene

            if resp.status_code != 200:
                print(f"Gemini API Error: {resp.text}")
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text}")

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("No candidates returned")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                raise RuntimeError("No text in response")

            raw_text = parts[0]["text"]
            parsed = _safe_json_loads(raw_text)

            validated = StructuredSummary.model_validate(parsed)
            return validated.model_dump()

        except Exception as e:
            last_error = e
            print(f"Attempt {attempt+1} failed: {str(e)}")
            
            # 429 hatası değilse (örn json hatasıysa) promptu düzeltip hemen dene
            if "429" not in str(e) and attempt < max_retries: 
                payload["contents"][0]["parts"][0]["text"] = (
                    prompt + 
                    "\n\nERROR: Invalid JSON. Return ONLY valid JSON."
                )
                continue
            
            # 429 hatasıysa ve yukarıdaki if'e girmediyse (yani request kütüphanesinden exception fırlattıysa)
            if "429" in str(e) and attempt < max_retries:
                 print(f"⚠️ 429 Exception detected. Waiting 60s...")
                 time.sleep(60)
                 continue

            break

    raise RuntimeError(f"Analysis failed after retries: {last_error}")

if __name__ == "__main__":
    print("--- Running Smart Naming & Merging Test ---")
    test_segments = [
        {"start": 0.0, "end": 2.0, "speaker": "SPEAKER_00", "text": "Evet yanımızda şu an Osman var."},
        {"start": 2.0, "end": 4.0, "speaker": "SPEAKER_00", "text": "Projemin mobil kısmını bitirdim."},
        {"start": 4.0, "end": 6.0, "speaker": "SPEAKER_01", "text": "Harika Efe abi!"},
    ]
    result = analyze_audio_segments_with_gemini(
        test_segments, 
        summary_lang="tr", 
        keywords="",
        focus_exclusive=False
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))