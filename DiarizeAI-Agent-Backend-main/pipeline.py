# pipeline.py (DEBUG SÜRÜMÜ)

from typing import Dict, Any, List
from diarize_agent.agent import analyze_audio_segments_with_gemini
from diarize_agent.tools.tools import transcribe_audio_with_whisper

def run_whisper_and_agent(
    audio_path: str,
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False
) -> Dict[str, Any]:
    
    print(f"\n--- 🔍 DEBUG BAŞLIYOR: {audio_path} ---")

    # 1. Ses dosyasını transkribe et
    print("🎤 Whisper çalışıyor...")
    transcription = transcribe_audio_with_whisper(audio_path)
    
    # DEBUG: Whisper ne döndürdü?
    print(f"🎤 Whisper Sonucu Tipi: {type(transcription)}")

    # 2. Segmentleri ayıkla
    segments_to_process = []
    
    if isinstance(transcription, dict) and "segments" in transcription:
        segments_to_process = transcription["segments"]
        print("✅ Whisper 'Dictionary' döndürdü ve 'segments' anahtarı var.")
    elif isinstance(transcription, list):
        segments_to_process = transcription
        print("✅ Whisper direkt 'List' döndürdü.")
    else:
        print(f"⚠️ WHISPER SEGMENT BULAMADI! Gelen veri: {transcription}")
        segments_to_process = [] # Patlamaması için boş liste

    # Segment sayısını yazdır
    count = len(segments_to_process) if segments_to_process else 0
    print(f"📊 İşlenecek Segment Sayısı: {count}")

    # 3. Gemini Analizi
    print(f"🤖 Gemini Ajanı Çalışıyor -> Dil: {summary_lang}")
    
    analysis_result = analyze_audio_segments_with_gemini(
        segments=segments_to_process, 
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )
    
    # --- KRİTİK DÜZELTME: SEGMENTLERİ ZORLA EKLE ---
    if isinstance(analysis_result, dict):
        # Eğer segment listesi boşsa bile (None değil) boş liste olarak gönderelim ki 'null' hatası almayalım.
        analysis_result["segments"] = segments_to_process if segments_to_process is not None else []
        print(f"📦 Pakete Segmentler Eklendi. (Uzunluk: {len(analysis_result['segments'])})")
    
    print("--- ✅ DEBUG BİTTİ ---\n")
    return analysis_result