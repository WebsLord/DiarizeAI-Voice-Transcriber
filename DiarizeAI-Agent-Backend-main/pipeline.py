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
    
    print(f"\n--- 🔍 DEBUG STARTED: {audio_path} ---")

    # 1. Transcribe the audio file
    # 1. Ses dosyasını transkribe et
    print("🎤 Whisper running...")
    transcription = transcribe_audio_with_whisper(audio_path)
    
    # DEBUG: What did Whisper return?
    # DEBUG: Whisper ne döndürdü?
    print(f"🎤 Whisper Result Type: {type(transcription)}")

    # 2. Extract segments
    # 2. Segmentleri ayıkla
    segments_to_process = []
    
    if isinstance(transcription, dict) and "segments" in transcription:
        segments_to_process = transcription["segments"]
        print("✅ Whisper returned 'Dictionary' and has 'segments' key.")
    elif isinstance(transcription, list):
        segments_to_process = transcription
        print("✅ Whisper returned 'List' directly.")
    else:
        print(f"⚠️ WHISPER FOUND NO SEGMENTS! Data: {transcription}")
        segments_to_process = [] # Prevent crash with empty list / Boş liste ile çökmesini önle

    # Print segment count
    # Segment sayısını yazdır
    count = len(segments_to_process) if segments_to_process else 0
    print(f"📊 Segment Count to Process: {count}")

    # 3. Analyze with Gemini
    # 3. Gemini ile analiz et
    print(f"🤖 Gemini Agent Running -> Lang: {summary_lang}, Transcript: {transcript_lang}")
    
    analysis_result = analyze_audio_segments_with_gemini(
        segments=segments_to_process, 
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )
    
    # --- SMART MERGE LOGIC ---
    # Gemini might have translated the segments. If Gemini returned segments, use them.
    # If not, use original (Whisper) segments as fallback.
    # Gemini segmentleri çevirmiş olabilir. Eğer Gemini segment döndürdüyse onu kullan.
    # Döndürmediyse yedek olarak orijinal (Whisper) segmentleri kullan.
    
    if isinstance(analysis_result, dict):
        gemini_segments = analysis_result.get("segments")
        
        # Case A: Gemini did its job and returned segments (translated/processed)
        # Durum A: Gemini işini yaptı ve segmentleri (çevrilmiş/işlenmiş) döndürdü
        if gemini_segments and isinstance(gemini_segments, list) and len(gemini_segments) > 0:
            print(f"✅ Received {len(gemini_segments)} PROCESSED/TRANSLATED segments from Gemini. Using them.")
            # Do nothing, keep Gemini's response (Translation preserved)
            # Hiçbir şey yapma, Gemini'nin yanıtını koru (Çeviri korunur)
            
        # Case B: Gemini dropped/forgot segments, use Originals
        # Durum B: Gemini segmentleri düşürdü/unuttu, Orijinalleri kullan
        else:
            print("⚠️ Gemini did not return segments! Adding original Whisper segments as fallback.")
            analysis_result["segments"] = segments_to_process if segments_to_process is not None else []
            
        print(f"📦 Final Package Segment Status: {len(analysis_result.get('segments', []))} items.")
    
    print("--- ✅ DEBUG FINISHED ---\n")
    return analysis_result