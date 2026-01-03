# pipeline.py

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
    """
    Transcribes the audio file and analyzes the segments using Gemini with custom settings.
    Ses dosyasını transkribe eder ve segmentleri özel ayarlarla Gemini kullanarak analiz eder.

    Args:
        audio_path (str): The path to the audio file.
        summary_lang (str): Language code for summary (e.g., 'tr', 'en').
        transcript_lang (str): Language code for transcript translation.
        keywords (str): Focus keywords separated by //.\n        focus_exclusive (bool): If True, only focus on keywords.

    Returns:
        Dict[str, Any]: The analysis result from Gemini.
    """
    # 1. Transcribe the audio file
    # 1. Ses dosyasını transkribe et
    transcription = transcribe_audio_with_whisper(audio_path)
    
    # --- CRITICAL FIX: Extract 'segments' list if transcription is a dictionary ---
    # --- KRİTİK DÜZELTME: Eğer transkripsiyon bir sözlükse 'segments' listesini çıkar ---
    if isinstance(transcription, dict) and "segments" in transcription:
        segments_to_process = transcription["segments"]
    else:
        # If it's already a list or other format, use as is
        # Zaten listeyse veya başka bir format ise olduğu gibi kullan
        segments_to_process = transcription

    # 2. Analyze with Gemini, passing user preferences
    # 2. Kullanıcı tercihlerini ileterek Gemini ile analiz et
    
    # Debug log in English
    # İngilizce hata ayıklama logu
    print(f"🤖 AGENT RUNNING -> Lang: {summary_lang}, Keywords: {keywords}, Exclusive: {focus_exclusive}")
    
    analysis_result = analyze_audio_segments_with_gemini(
        segments=segments_to_process, # Sending the correct list / Doğru listeyi gönderiyoruz
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )
    
    return analysis_result