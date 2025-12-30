import os
import json
import re
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError


# -----------------------------
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
# 3) Prompt (genel kullanım + diarization + whisper düzeltme)
# -----------------------------
def _build_prompt(
    segments: List[Dict[str, Any]],
    
) -> str:
    """
    segments input örneği:
    [
      {"start": 7.0, "end": 8.0, "text": "Well, can't afford to know him."},
      {"start": 8.1, "end": 10.2, "text": "I think he said ..."},
    ]
    """

    # Segmentleri modele kısa/temiz bir şekilde verelim
    # (Çok uzunsa ileride "windowing/chunking" ekleriz)
    segments_json = json.dumps(segments, ensure_ascii=False)

    # Etiketleme kuralları:
    # - "Öğretmen/Öğrenci" sadece bağlamdan GERÇEKTEN eminsen (yüksek güven).
    # - Emin değilsen Speaker00/Speaker01 kullan.
    # - Eğer segmentlerden konuşmacı ayrımı çıkarmak mümkün değilse tek konuşmacı Speaker00 kullanabilirsin.
    label_rules = """
DİARIZATION & ETİKETLEME:
- Segmentlerin text alanının başına bir konuşmacı etiketi ekle.
- Eğer bağlam güçlü biçimde anlıyor  ve rolleri ayırt edebiliyorsan:
  * "Öğretmen:" ve "Öğrenci:"  "Patron:" ve "Çalışan:"  "Candidate ve Interviewer" gibi kullan.
- Eğer bağlam "toplantı/telefon görüşmesi" ve isim/rol net değilse:
  * "Speaker00:", "Speaker01:", "Speaker02:" şeklinde kullan.
- ASLA uydurma isim yazma. Sadece Konsepten çıkartığın rolleri  veya SpeakerXX kullan.
- Konseptten emin değilsen Teacher/Student veya başka bir rol kullanma, SpeakerXX kullan.
"""

    correction_rules = """
WHISPER DÜZELTME:
- segments[].text içine yazdığın metin "düzeltilmiş" olmalı.
- Whisper’ın yanlış çevirdiği kelimeleri, bağlam ve dil bilgisi ile düzelt:
  * bariz yazım/kelime hatalarını düzelt
  * dil bilgisi hatalarını düzelt
  * anlamı bozan hataları düzelt
  * Değişimleri yaparken cümle anlamını koruduğuna dikkat et
  * emin olmadığın yerde minimum müdahale yap
- Düzeltme yaparken Türkçe/İngilizce karışık olabilir; metnin doğal dilini koru.
"""

    output_schema = """
ÇIKTI SADECE GEÇERLİ JSON OLMALI. Ek açıklama yok.

ŞEMA:
{
  "conversation_type": "meeting | university_lecture | phone_call | interview | other",
  "summary": "string",
  "keypoints": ["string", "..."],
  "metadata": {
    "language": "string (tahmin)",
    "clean_transcript": "string (segmentlerden birleştirilmiş, düzeltilmiş transcript)",
  }
}

KURALLAR:
- keypoints: 3–10 madde
- metadata.clean_transcript: Aynı konuşmacı arka arkaya konuşuyorsa label’ı sadece ilk satırda yaz.Konuşmacı değişince yeni label ile devam et.Her segmenti alt satırdan yaz, ama aynı konuşmacıda label tekrarlama
"""

    task = f"""
Sen bir "Audio Transcript Analyzer" agentsin.
Kullanım alanı: toplantı, ders, telefon görüşmesi, röportaj gibi ortamlardan gelen konuşma kayıtlarının analizi.

Görevlerin:
1) conversation_type tahmini yap.
2) summary üret.
3) keypoints üret (3–10).

4) metadata.clean_transcript üret (düzeltilmiş segmentleri birleştir).

{label_rules}

{correction_rules}

{output_schema}

INPUT SEGMENTS (JSON):
{segments_json}
""".strip()

    # locale kullanılacaksa ileride yönerge eklenebilir, şimdilik basit bıraktım
    return task


# -----------------------------
# 4) Gemini çağrısı (JSON MIME + retry + schema validate)
# -----------------------------
def analyze_audio_segments_with_gemini(
    segments: List[Dict[str, Any]],
    model_name: str = "gemini-2.5-flash",
    temperature: float = 0.1,
    max_retries: int = 2,
    timeout_sec: int = 240,
) -> Dict[str, Any]:
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY bulunamadı.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    prompt = _build_prompt(segments)

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": temperature,
        },
    }

    last_error: Optional[Exception] = None
    # Retry mekanizması çok önemli: Bazen model geçerli JSON döndürmeyebiliyor ve/veya şemaya uymayan veri döndürebiliyor modelin tekrar denemesini sağlıyoruz
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

            # Pydantic doğrulama
            validated = StructuredSummary.model_validate(parsed)

            # # Ek: metadata.segments şemasını da garanti altına alalım
            # md = validated.metadata or {}
            # segs = md.get("segments", [])
            # # Segment listesi doğrulaması (opsiyonel ama iyi)
            # _ = [Segment.model_validate(s) for s in segs]

            return validated.model_dump()

        except (json.JSONDecodeError, ValidationError, requests.RequestException, RuntimeError) as e:
            last_error = e
            if attempt < max_retries:
                # Retry: “sadece JSON, ek metin yok” baskısını artır
                payload["contents"][0]["parts"][0]["text"] = (
                    prompt
                    + "\n\nHATA: Önceki çıktın geçerli JSON değildi veya şemaya uymadı. "
                      "Lütfen SADECE geçerli JSON döndür. Hiçbir ek metin yazma."
                )
                continue
            break

    raise RuntimeError(f"Gemini analizi başarısız. Son hata: {last_error}")


# -----------------------------
# 5) Test
# -----------------------------
if __name__ == "__main__":
    test_segments = [
        {"start": 7.0, "end": 8.0, "text": "Well, can't afford to know him."},
        {"start": 8.0, "end": 10.0, "text": "teacher today we learn about flask and corse."},
        {"start": 10.0, "end": 12.0, "text": "okey hocam anladim but how to install."},
    ]

    result = analyze_audio_segments_with_gemini(test_segments)
    print(json.dumps(result, indent=2, ensure_ascii=False))
