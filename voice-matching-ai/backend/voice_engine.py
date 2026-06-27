"""
voice_engine.py

Core speaker-verification engine.

This replaces the original one-shot Colab script (load model -> upload two
batches of files -> print one match) with a small reusable service that:

  * loads the ECAPA-TDNN speaker embedding model once and keeps it warm
  * trims silence and normalizes audio before embedding (the original
    script fed raw, untrimmed audio straight into the model)
  * supports enrolling a person from MULTIPLE samples and averaging their
    embeddings, which is far more robust than a single clip
  * persists enrolled voiceprints to disk (data/voices.json) so the API
    can be restarted without losing enrolled speakers
  * returns a full ranked list of similarity scores instead of just the
    single best match, plus a verdict (match / possible / no_match) based
    on configurable thresholds
"""

import json
import time
import uuid
import threading
from pathlib import Path

import numpy as np
import torch
import librosa
from scipy.spatial.distance import cosine
from speechbrain.inference.speaker import EncoderClassifier

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "voices.json"

SAMPLE_RATE = 16000

# Cosine-similarity thresholds for the ECAPA-TDNN voxceleb embedding space.
# These are reasonable defaults for demo/portfolio use, not a calibrated
# biometric threshold -- tune them against your own enrolled data if you
# use this for anything beyond a demo.
MATCH_THRESHOLD = 0.75
POSSIBLE_THRESHOLD = 0.60


class VoiceEngine:
    """Wraps the ECAPA-TDNN speaker embedding model plus a small JSON-backed
    voiceprint database."""

    _model = None
    _model_lock = threading.Lock()

    def __init__(self):
        self.db = self._load_db()

    # ---------------------------------------------------------------- model
    @classmethod
    def _get_model(cls):
        if cls._model is None:
            with cls._model_lock:
                if cls._model is None:
                    cls._model = EncoderClassifier.from_hparams(
                        source="speechbrain/spkrec-ecapa-voxceleb",
                        savedir=str(DATA_DIR / "pretrained_models"),
                        run_opts={"device": "cpu"},
                    )
        return cls._model

    # ---------------------------------------------------------------- audio
    @staticmethod
    def _load_audio(path):
        audio, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True)
        # trim leading/trailing silence so silence doesn't dilute the embedding
        audio, _ = librosa.effects.trim(audio, top_db=25)
        if audio.size == 0:
            raise ValueError("Audio file appears to be silent.")
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak
        return audio

    def embed_file(self, file_path):
        audio = self._load_audio(file_path)
        model = self._get_model()
        with torch.no_grad():
            tensor = torch.tensor(audio, dtype=torch.float32).unsqueeze(0)
            emb = model.encode_batch(tensor).squeeze().cpu().numpy()
        return emb

    # --------------------------------------------------------- persistence
    def _load_db(self):
        if DB_PATH.exists():
            with open(DB_PATH, "r") as f:
                raw = json.load(f)
            for v in raw.values():
                v["embedding"] = np.array(v["embedding"], dtype=np.float32)
            return raw
        return {}

    def _save_db(self):
        serializable = {
            vid: {**v, "embedding": v["embedding"].tolist()}
            for vid, v in self.db.items()
        }
        with open(DB_PATH, "w") as f:
            json.dump(serializable, f)

    # --------------------------------------------------------- public API
    def list_voices(self):
        return [
            {
                "id": vid,
                "label": v["label"],
                "samples": v["samples"],
                "created_at": v["created_at"],
            }
            for vid, v in sorted(self.db.items(), key=lambda kv: kv[1]["created_at"])
        ]

    def enroll(self, label, file_paths):
        embeddings = [self.embed_file(p) for p in file_paths]
        avg_embedding = np.mean(embeddings, axis=0)
        voice_id = str(uuid.uuid4())[:8]
        self.db[voice_id] = {
            "label": label,
            "embedding": avg_embedding,
            "samples": len(file_paths),
            "created_at": time.time(),
        }
        self._save_db()
        return voice_id

    def delete(self, voice_id):
        if voice_id in self.db:
            del self.db[voice_id]
            self._save_db()
            return True
        return False

    @staticmethod
    def _verdict(score):
        if score >= MATCH_THRESHOLD:
            return "match"
        if score >= POSSIBLE_THRESHOLD:
            return "possible"
        return "no_match"

    def verify(self, file_path):
        test_embedding = self.embed_file(file_path)
        ranking = []
        for voice_id, voice in self.db.items():
            score = 1 - cosine(test_embedding, voice["embedding"])
            score = max(0.0, min(1.0, float(score)))
            ranking.append(
                {
                    "id": voice_id,
                    "label": voice["label"],
                    "score": round(score, 4),
                    "verdict": self._verdict(score),
                }
            )
        ranking.sort(key=lambda r: r["score"], reverse=True)
        best_match = ranking[0] if ranking else None
        return {
            "best_match": best_match,
            "ranking": ranking,
            "thresholds": {
                "match": MATCH_THRESHOLD,
                "possible": POSSIBLE_THRESHOLD,
            },
        }


engine = VoiceEngine()
