"""
main.py

FastAPI service for the Voice Matching & Similarity engine.

Endpoints
---------
GET    /api/health            -> liveness check
GET    /api/voices             -> list enrolled speakers
POST   /api/voices             -> enroll a speaker (label + one or more audio files)
DELETE /api/voices/{voice_id}  -> remove an enrolled speaker
POST   /api/verify             -> upload one test clip, get ranked similarity results

Run with:
    uvicorn main:app --reload --port 8000
"""

import shutil
import tempfile
from pathlib import Path
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from voice_engine import engine

app = FastAPI(title="Voice Matching & Similarity API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _save_upload(upload: UploadFile) -> str:
    suffix = Path(upload.filename or "audio.wav").suffix or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    shutil.copyfileobj(upload.file, tmp)
    tmp.close()
    return tmp.name


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/voices")
def list_voices():
    return engine.list_voices()


@app.post("/api/voices")
def enroll_voice(label: str = Form(...), files: List[UploadFile] = File(...)):
    if not label.strip():
        raise HTTPException(400, "A label / name is required.")
    if not files:
        raise HTTPException(400, "At least one audio sample is required.")

    paths: List[str] = []
    try:
        paths = [_save_upload(f) for f in files]
        voice_id = engine.enroll(label.strip(), paths)
    except Exception as exc:
        raise HTTPException(400, f"Could not enroll voice: {exc}")
    finally:
        for p in paths:
            Path(p).unlink(missing_ok=True)

    return {"id": voice_id, "label": label.strip()}


@app.delete("/api/voices/{voice_id}")
def delete_voice(voice_id: str):
    if not engine.delete(voice_id):
        raise HTTPException(404, "Voice not found.")
    return {"deleted": voice_id}


@app.post("/api/verify")
def verify_voice(file: UploadFile = File(...)):
    path = _save_upload(file)
    try:
        result = engine.verify(path)
    except Exception as exc:
        raise HTTPException(400, f"Could not analyze audio: {exc}")
    finally:
        Path(path).unlink(missing_ok=True)

    if result["best_match"] is None:
        raise HTTPException(
            400, "No enrolled voices yet. Enroll at least one voice first."
        )
    return result
