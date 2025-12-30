import sys
import os
import asyncio # Asenkron çalıştırma için gerekli
from diarize_agent.agent import analyze_audio_segments_with_gemini
from diarize_agent.tools.tools import transcribe_audio_with_whisper
import json





   
if __name__ == "__main__":
    test_metni=transcribe_audio_with_whisper("uploads/alfred-batman.wav")
    #print(test_metni)
    result = analyze_audio_segments_with_gemini(test_metni)
    print(result)