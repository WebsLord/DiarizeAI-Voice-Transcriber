from diarize_agent.tools.tools import transcribe_audio_with_whisper
from config import BASE_DIR

audio_path = str(BASE_DIR / "uploads" / "alfred-batman.wav")
print(transcribe_audio_with_whisper(audio_path))
