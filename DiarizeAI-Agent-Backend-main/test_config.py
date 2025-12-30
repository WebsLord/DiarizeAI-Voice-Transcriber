import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

INSTANCE_FOLDER = os.getenv(
    "INSTANCE_FOLDER",
    str((BASE_DIR / "instance").resolve())
)



print("INSTANCE_FOLDER:", INSTANCE_FOLDER)