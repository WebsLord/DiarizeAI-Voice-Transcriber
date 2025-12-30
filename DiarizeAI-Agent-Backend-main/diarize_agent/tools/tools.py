from __future__ import annotations

import warnings
from contextlib import contextmanager, redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path

import whisper
from config import Config


@contextmanager
def _suppress_output_and_warnings():
    fake_out, fake_err = StringIO(), StringIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with redirect_stdout(fake_out), redirect_stderr(fake_err):
            yield


def transcribe_audio_with_whisper(audio_file_path: str) -> dict:
    audio_path = Path(audio_file_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    with _suppress_output_and_warnings():
        model = whisper.load_model(Config.WHISPER_MODEL)

        # 1) Dil tespiti (AUTO) + güven skoru
        audio = whisper.load_audio(str(audio_path))
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        _, probs = model.detect_language(mel)

        detected_lang = max(probs, key=probs.get)
        detected_prob = float(probs[detected_lang])

        # 2) Transcribe (dil parametresi vermiyoruz -> auto)
        result = model.transcribe(# result içinde 'text' ve 'segments' var text tüm konuşma segments ise zaman aralıklarıyla parçalara ayrılmış hali
            str(audio_path),
            fp16=False,
            verbose=False,
            temperature=0.0, # daha tutarlı sonuçlar için yaratıcılık yok halüsinasyon azalt
            no_speech_threshold=0.6, # sessizlik algılama eşiği konuşma olasılığı %60 altındaysa sessizlik kabul et ve atla
            logprob_threshold=-1.0,
            compression_ratio_threshold=2.4,
            condition_on_previous_text=True, # bağlamı koru bir cümleyi çevirirken önceki cümleleri de dikkate alır
        )

    clean_text = " ".join((result.get("text") or "").split())
    segments = [
    {
        "start": float(s["start"]),
        "end": float(s["end"]),
        "text": " ".join((s.get("text") or "").split()),
    }
    for s in (result.get("segments") or [])
]

    return {
        
        "segments": segments,
        
    }

    





#--------------------------------------------------------------------------------------------------
#                                   PYNOTE DIARIZATION
#--------------------------------------------------------------------------------------------------
# logging.getLogger("pyannote").setLevel(logging.ERROR)
# warnings.filterwarnings("ignore")


# def load_audio_for_pyannote(path: str, target_sr: int = 16000):
#     audio, sr = sf.read(path, always_2d=True)   # (time, channels)
#     audio = audio.mean(axis=1)                  # mono (time,)
#     waveform = torch.from_numpy(audio).float().unsqueeze(0)  # (1, time)

#     if sr != target_sr:
#         waveform = torchaudio.functional.resample(waveform, sr, target_sr)
#         sr = target_sr

#     return {"waveform": waveform, "sample_rate": sr}

# def _convert_to_wav_if_needed(audio_file_path: str, sr: int = 16000) -> str:
#     """
#     WAV değilse ffmpeg ile mono/16k WAV'a çevirir ve yeni path döndürür.
#     WAV ise aynı path'i döndürür.
#     """
#     in_path = Path(audio_file_path)
#     ext = in_path.suffix.lower()

#     if ext == ".wav":
#         return str(in_path)

#     # Çıktıyı aynı klasöre: originalname_converted_<id>.wav
#     out_path = in_path.with_name(f"{in_path.stem}_converted_{uuid.uuid4().hex[:8]}.wav")

#     cmd = [
#         "ffmpeg",
#         "-y",
#         "-hide_banner",
#         "-loglevel", "error",
#         "-i", str(in_path),
#         "-ac", "1",
#         "-ar", str(sr),
#         "-c:a", "pcm_s16le",
#         str(out_path),
#     ]
#     subprocess.run(cmd, check=True)
#     return str(out_path)    

# def diarize_and_transcribe(audio_file_path):

#     try:

#         # Convert to WAV if needed
#         audio_file_path = _convert_to_wav_if_needed(audio_file_path, sr=16000)
        
#         audio=load_audio_for_pyannote(audio_file_path)
       
#         pipeline = Pipeline.from_pretrained('pyannote/speaker-diarization-community-1', token=Config.HF_TOKEN)

#         # perform speaker diarization locally
#         output = pipeline(audio)

#         # enjoy state-of-the-art speaker diarization
#         for turn, speaker in output.speaker_diarization:
#             print(f"{speaker} speaks between t={turn.start}s and t={turn.end}s")
        
#     except Exception as e:
#         logging.error(f"Diarization error: {e}")
#         return "Diarization failed."    

#--------------------------------------------------------------------------------------------------
#                                   END OF PYNOTE DIARIZATION
#--------------------------------------------------------------------------------------------------


