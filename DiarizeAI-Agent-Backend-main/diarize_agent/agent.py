# agent.py

import os
import json
import re
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
    speaker: str = Field(..., description="Speaker label (e.g., Speaker01, Ahmet Hoca)")
    text: str = Field(..., description="Corrected/Translated text content")

class StructuredSummary(BaseModel):
    # KORKMA: Buradaki 'conversation_type' senin ekrandaki 'Tür' kutucuğun. SİLİNMEDİ.
    conversation_type: str = Field(
        ...,
        description="meeting | university_lecture | phone_call | interview | other"
    )
    summary: str = Field(..., description="Overall summary")
    keypoints: List[str] = Field(default_factory=list, description="3–10 key bullet points")
    
    # --- YENİ: Karaoke için Segment Listesi ---
    segments: List[SegmentItem] = Field(
        default_factory=list, 
        description="List of detailed segments with timestamps and speaker labels"
    )
    
    # KORKMA: 'metadata' içindeki 'language', senin ekrandaki 'Dil' kutucuğun. SİLİNMEDİ.
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
# 3) AGGRESSIVE PROMPT ENGINEERING
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
            f"*** CRITICAL INSTRUCTION ***\n"
            f"You MUST write the 'summary' and 'keypoints' ONLY in {target_sum_lang_name}.\n"
            f"Even if the audio is in Turkish or another language, you MUST TRANSLATE your output to {target_sum_lang_name}."
        )
    else:
        summary_instruction = "Write the summary and keypoints in the SAME language as the audio."

    # 2. Transkript Dili
    if transcript_lang and transcript_lang.lower() != "original":
        transcript_instruction = (
            f"Translate the 'text' field of each segment AND the 'clean_transcript' fully into {target_trans_lang_name}."
        )
    else:
        transcript_instruction = "Keep the 'text' fields in original language, fixing grammar/spelling."

    # 3. Odak
    focus_instruction = ""
    if keywords:
        focus_instruction = f"\nFOCUS KEYWORDS: {keywords}\n"
        if focus_exclusive:
            focus_instruction += "IGNORE all topics unrelated to the keywords in the SUMMARY. However, KEEP ALL SEGMENTS in the transcript.\n"
        else:
            focus_instruction += "Highlight these keywords in the summary.\n"

    
    # --- PROMPT ---
    task = f"""
You are an advanced AI Audio Analyst and TRANSLATOR.

INPUT DATA (Whisper Segments):
{segments_json}

--- SYSTEM RULES (FOLLOW STRICTLY) ---
1. {summary_instruction}
2. {transcript_instruction}
3. {focus_instruction}
4. **IMPORTANT DIARIZATION RULES**:
   - You MUST identify speakers (e.g., "Speaker 1", "Speaker 2") based on the flow.
   - In the 'segments' list, fill the "speaker" field.
   - In the 'clean_transcript' string, YOU MUST PREPEND THE SPEAKER NAME to every turn.
     Example: "Speaker 1: Hello how are you?\\nSpeaker 2: I am fine."

--- REQUIRED JSON OUTPUT FORMAT ---
{{
  "conversation_type": "meeting | lecture | call | interview | other",
  "summary": "Summary in target language",
  "keypoints": ["Point 1", "Point 2"],
  "segments": [
    {{ "start": 0.0, "end": 2.5, "speaker": "Speaker 1", "text": "Text..." }}
  ],
  "metadata": {{
    "language": "Detected language",
    "clean_transcript": "Full transcript WITH SPEAKER NAMES (e.g. 'Speaker 1: ...') at the start of each line."
  }}
}}

Take a deep breath. Ensure 'clean_transcript' has speaker labels.
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
    model_name: str = "gemini-2.5-flash", 
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

    print(f"\n🚀 PROMPT SETTINGS SENT TO AI:")
    print(f"   Summary Target: {summary_lang}")
    print(f"   Transcript Target: {transcript_lang}")
    print(f"   Keywords: {keywords}\n")

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
            if attempt < max_retries:
                payload["contents"][0]["parts"][0]["text"] = (
                    prompt + 
                    "\n\nERROR: Invalid JSON. Return ONLY valid JSON."
                )
                continue
            break

    raise RuntimeError(f"Analysis failed: {last_error}")

if __name__ == "__main__":
    print("--- Running Test ---")
    test_segments = [
        {"start": 0.0, "end": 2.0, "text": "Merhaba nasılsın?"},
        {"start": 2.0, "end": 4.0, "text": "İyiyim sen nasılsın?"},
    ]
    result = analyze_audio_segments_with_gemini(
        test_segments, 
        summary_lang="original", 
        keywords="",
        focus_exclusive=False
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))