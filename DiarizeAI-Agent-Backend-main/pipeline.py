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
        keywords (str): Focus keywords separated by //.
        focus_exclusive (bool): If True, only focus on keywords.

    Returns:
        Dict[str, Any]: The analysis result from Gemini.
    """
    # 1. Transcribe the audio file
    # 1. Ses dosyasını transkribe et
    transcription = transcribe_audio_with_whisper(audio_path)
    
    # 2. Analyze with Gemini, passing user preferences
    # 2. Kullanıcı tercihlerini ileterek Gemini ile analiz et
    # Note: agent.py needs to be updated to accept these args too!
    # Not: agent.py dosyasının da bu argümanları kabul edecek şekilde güncellenmesi gerekiyor!
    analysis_result = analyze_audio_segments_with_gemini(
        transcription,
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )
    
    return analysis_result