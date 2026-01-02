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
# 1) Şema Tanımı
# -----------------------------
class StructuredSummary(BaseModel):
    conversation_type: str = Field(
        ...,
        description="meeting | university_lecture | phone_call | interview | other"
    )
    summary: str = Field(..., description="Overall summary")
    keypoints: List[str] = Field(default_factory=list, description="3–10 key bullet points")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extra info, includes language, clean_transcript")


# -----------------------------
# 2) Helpers: JSON cleaning/extraction
# 2) Yardımcılar: JSON temizleme/çıkarma
# -----------------------------
def _strip_code_fences(text: str) -> str:
    """
    Removes Markdown code fences from the text.
    Metindeki Markdown kod bloklarını temizler.
    """
    text = text.strip()
    m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return text


def _extract_first_json_object(text: str) -> str:
    """
    Extracts the first valid JSON object from the string.
    Dizeden ilk geçerli JSON nesnesini çıkarır.
    """
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1].strip()
    return text


def _safe_json_loads(raw_text: str) -> Dict[str, Any]:
    """
    Safely parses JSON string.
    JSON dizesini güvenli bir şekilde ayrıştırır.
    """
    cleaned = _strip_code_fences(raw_text)
    cleaned = _extract_first_json_object(cleaned)
    return json.loads(cleaned)


# -----------------------------
# 3) AGGRESSIVE PROMPT ENGINEERING
# 3) AGRESİF PROMPT MÜHENDİSLİĞİ
# -----------------------------
def _build_prompt(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False
) -> str:
    """
    Builds a strict prompt to force the AI to respect language and focus settings.
    AI'ı dil ve odak ayarlarına uymaya zorlamak için katı bir prompt oluşturur.
    """
    
    segments_json = json.dumps(segments, ensure_ascii=False)

    # --- Language Mapper (To ensure AI understands 'en' as 'ENGLISH') ---
    # --- Dil Eşleştirici (AI'ın 'en' kodunu 'ENGLISH' olarak anlaması için) ---
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

    # Get full language name or default to original (Uppercase for emphasis)
    # Tam dil adını al veya varsayılan olarak original kullan (Vurgu için büyük harf)
    target_sum_lang_name = lang_map.get(summary_lang.lower(), summary_lang.upper()) if summary_lang else "ORIGINAL LANGUAGE"
    target_trans_lang_name = lang_map.get(transcript_lang.lower(), transcript_lang.upper()) if transcript_lang else "ORIGINAL LANGUAGE"

    # --- DYNAMIC INSTRUCTIONS (AGGRESSIVE MODE) ---
    # --- DİNAMİK TALİMATLAR (AGRESİF MOD) ---
    
    # 1. Summary Language Logic (Strict Rules)
    # 1. Özet Dili Mantığı (Katı Kurallar)
    if summary_lang and summary_lang.lower() != "original":
        summary_instruction = (
            f"*** CRITICAL INSTRUCTION ***\n"
            f"You MUST write the 'summary' and 'keypoints' ONLY in {target_sum_lang_name}.\n"
            f"Even if the input audio is in Turkish or another language, you MUST TRANSLATE your output to {target_sum_lang_name}.\n"
            f"DO NOT OUTPUT IN THE ORIGINAL AUDIO LANGUAGE UNLESS IT IS {target_sum_lang_name}."
        )
    else:
        summary_instruction = "Write the summary and keypoints in the SAME language as the audio."

    # 2. Transcript Language Logic
    # 2. Transkript Dili Mantığı
    if transcript_lang and transcript_lang.lower() != "original":
        transcript_instruction = (
            f"Translate the 'clean_transcript' fully into {target_trans_lang_name}."
        )
    else:
        transcript_instruction = "Keep the 'clean_transcript' in its original audio language, fixing only grammar."

    # 3. Focus/Keywords Logic
    # 3. Odak/Anahtar Kelime Mantığı
    focus_instruction = ""
    if keywords:
        focus_instruction = f"\nFOCUS KEYWORDS: {keywords}\n"
        if focus_exclusive:
            focus_instruction += "IGNORE all topics unrelated to the keywords. Summary must be ONLY about these keywords.\n"
        else:
            focus_instruction += "Highlight these keywords in the summary.\n"

    
    # --- FINAL PROMPT CONSTRUCTION ---
    # --- NİHAİ PROMPT OLUŞTURMA ---
    task = f"""
You are an advanced AI Audio Analyst and TRANSLATOR.

INPUT DATA:
{segments_json}

--- SYSTEM RULES (FOLLOW STRICTLY) ---
1. {summary_instruction}
2. {transcript_instruction}
3. {focus_instruction}

--- REQUIRED JSON OUTPUT FORMAT ---
{{
  "conversation_type": "meeting | lecture | call | interview | other",
  "summary": "The summary text in the target language defined above",
  "keypoints": ["Point 1 in target language", "Point 2 in target language"],
  "metadata": {{
    "language": "Detected language code of the AUDIO (e.g. 'tr')",
    "clean_transcript": "The full transcript text (translated if requested)"
  }}
}}

Take a deep breath and ensure you follow the LANGUAGE constraints perfectly.
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
    # Kept 2.5-flash as per your request. If unstable, switch back to "gemini-1.5-flash".
    # İsteğiniz üzerine 2.5-flash tutuldu. Kararsızlaşırsa "gemini-1.5-flash"a dönün.
    model_name: str = "gemini-2.5-flash", 
    temperature: float = 0.1,
    max_retries: int = 2,
    timeout_sec: int = 240,
) -> Dict[str, Any]:
    
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY didn't found.")

    # Using v1beta API endpoint
    # v1beta API uç noktasını kullanma
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    # Pass dynamic settings to prompt builder
    # Dinamik ayarları prompt oluşturucuya ilet
    prompt = _build_prompt(
        segments, 
        summary_lang=summary_lang, 
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )

    # --- DEBUG LOGS (To verify Frontend -> Backend communication) ---
    # --- DEBUG LOGLARI (Frontend -> Backend iletişimini doğrulamak için) ---
    print(f"\n🚀 PROMPT SETTINGS SENT TO AI:")
    print(f"   Summary Target: {summary_lang}")
    print(f"   Transcript Target: {transcript_lang}")
    print(f"   Keywords: {keywords}")
    print(f"   Exclusive Mode: {focus_exclusive}\n")
    # ----------------------------------------------------------------

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
                raise RuntimeError("No candidates returned from Gemini")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                raise RuntimeError("No text in response content")

            raw_text = parts[0]["text"]
            parsed = _safe_json_loads(raw_text)

            validated = StructuredSummary.model_validate(parsed)
            return validated.model_dump()

        except (json.JSONDecodeError, ValidationError, requests.RequestException, RuntimeError) as e:
            last_error = e
            print(f"Attempt {attempt+1} failed: {str(e)}")
            
            if attempt < max_retries:
                # Retry with an error hint prompt
                # Hata ipucu istemiyle yeniden dene
                payload["contents"][0]["parts"][0]["text"] = (
                    prompt + 
                    "\n\nERROR: Your previous output was not valid JSON. Return ONLY valid JSON."
                )
                continue
            break

    raise RuntimeError(f"Gemini analysis failed. Final error: {last_error}")


if __name__ == "__main__":
    # Test with dummy data
    # Sahte verilerle test et
    test_segments = [
        {"start": 7.0, "end": 8.0, "text": "Well, can't afford to know him."},
        {"start": 8.0, "end": 10.0, "text": "teacher today we learn about flask and corse."},
    ]
    # Test specific instruction
    # Özel talimatı test et
    print("--- Running Test ---")
    result = analyze_audio_segments_with_gemini(
        test_segments, 
        summary_lang="tr", 
        keywords="flask // corse",
        focus_exclusive=False
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))