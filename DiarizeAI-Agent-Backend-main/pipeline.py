from typing import Dict, Any, List
from diarize_agent.agent import analyze_audio_segments_with_gemini
from diarize_agent.tools.tools import transcribe_audio_with_whisper




def run_whisper_and_agent(auidio_path: str) -> Dict[str, Any]:
    """
    Transcribes the audio file and analyzes the segments using Gemini.

    Args:
        audio_path (str): The path to the audio file.

    Returns:
        Dict[str, Any]: The analysis result from Gemini.
    """
    # Transcribe the audio file
    transcription = transcribe_audio_with_whisper(auidio_path)
    
    # Analyze the transcribed segments with Gemini
    analysis_result = analyze_audio_segments_with_gemini(transcription)
    
    return analysis_result