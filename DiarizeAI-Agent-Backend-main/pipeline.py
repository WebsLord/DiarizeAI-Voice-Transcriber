# src/pipeline.py

from typing import Dict, Any, List
from diarize_agent.agent import analyze_audio_segments_with_gemini
from diarize_agent.tools.tools import transcribe_audio_with_whisper

def run_whisper_and_agent(
    audio_path: str,
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False,
    flags: List[float] = None
) -> Dict[str, Any]:
    
    print(f"\n--- 🔍 DEBUG STARTED: {audio_path} ---")
    if flags:
        print(f"🚩 Input Flags Received: {flags}")

    # 1. Transcribe the audio file
    print("🎤 Whisper running...")
    transcription = transcribe_audio_with_whisper(audio_path)
    
    print(f"🎤 Whisper Result Type: {type(transcription)}")

    # 2. Extract segments
    segments_to_process = []
    
    if isinstance(transcription, dict) and "segments" in transcription:
        segments_to_process = transcription["segments"]
        print("✅ Whisper returned 'Dictionary' and has 'segments' key.")
    elif isinstance(transcription, list):
        segments_to_process = transcription
        print("✅ Whisper returned 'List' directly.")
    else:
        print(f"⚠️ WHISPER FOUND NO SEGMENTS! Data: {transcription}")
        segments_to_process = [] 

    count = len(segments_to_process) if segments_to_process else 0
    print(f"📊 Segment Count to Process: {count}")

    # 3. Analyze with Gemini
    print(f"🤖 Gemini Agent Running -> Lang: {summary_lang}, Transcript: {transcript_lang}")
    
    analysis_result = analyze_audio_segments_with_gemini(
        segments=segments_to_process, 
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )
    
    # --- SMART MERGE LOGIC ---
    if isinstance(analysis_result, dict):
        gemini_segments = analysis_result.get("segments")
        
        if gemini_segments and isinstance(gemini_segments, list) and len(gemini_segments) > 0:
            print(f"✅ Received {len(gemini_segments)} PROCESSED/TRANSLATED segments from Gemini. Using them.")
        else:
            print("⚠️ Gemini did not return segments! Adding original Whisper segments as fallback.")
            analysis_result["segments"] = segments_to_process if segments_to_process is not None else []
        
        analysis_result["flags"] = flags or []
            
        print(f"📦 Final Package Segment Status: {len(analysis_result.get('segments', []))} items.")
    
    print("--- ✅ DEBUG FINISHED ---\n")
    return analysis_result

# --- NEW FUNCTION FOR RE-ANALYSIS ---
# --- YENİDEN ANALİZ İÇİN YENİ FONKSİYON ---
def run_agent_on_text(
    segments: List[Dict[str, Any]],
    summary_lang: str = "original",
    transcript_lang: str = "original",
    keywords: str = None,
    focus_exclusive: bool = False,
    flags: List[float] = None
) -> Dict[str, Any]:
    """
    Skips Whisper transcription and runs Gemini directly on provided text segments.
    Whisper transkripsiyonunu atlar ve Gemini'yi doğrudan sağlanan metin segmentleri üzerinde çalıştırır.
    """
    print(f"\n--- ♻️ RE-ANALYSIS STARTED (Text Only) ---")
    print(f"📊 Segment Count: {len(segments)}")
    print(f"🌍 Lang Settings -> Summary: {summary_lang}, Transcript: {transcript_lang}")

    # Directly call the agent with provided segments
    # Sağlanan segmentlerle doğrudan ajanı çağır
    analysis_result = analyze_audio_segments_with_gemini(
        segments=segments,
        summary_lang=summary_lang,
        transcript_lang=transcript_lang,
        keywords=keywords,
        focus_exclusive=focus_exclusive
    )

    # --- MERGE LOGIC (Simplified for Re-run) ---
    if isinstance(analysis_result, dict):
        gemini_segments = analysis_result.get("segments")

        # If Gemini returns processed segments (e.g. translation), keep them.
        # Otherwise, ensure we return the input segments so data isn't lost.
        if not gemini_segments or len(gemini_segments) == 0:
             print("⚠️ Gemini returned no segments during re-run. Keeping input segments.")
             analysis_result["segments"] = segments

        analysis_result["flags"] = flags or []

    print("--- ✅ RE-ANALYSIS FINISHED ---\n")
    return analysis_result