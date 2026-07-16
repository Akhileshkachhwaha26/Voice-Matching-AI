# Voiceprint — AI Speaker Verification System

A full-stack AI-powered speaker verification system that identifies and matches voices using deep learning. Built with SpeechBrain's ECAPA-TDNN model for generating unique voice embeddings, served through a modern React interface with drag-and-drop audio upload, real-time confidence scoring, and a persistent voiceprint ledger.

---

## What It Does

Voiceprint lets you build a ledger of known speakers and verify any unknown audio clip against them. Every clip — enrolled or unknown — is converted into a 192-dimensional embedding vector that captures the unique characteristics of a person's voice. Comparing two embeddings with cosine similarity tells you how likely they are to belong to the same speaker.

**Use cases:**
- Voice-based identity verification
- Speaker diarization helpers
- Voice authentication prototypes
- Audio forensics and research demos

---

## Project Structure

```
voice-matching-ai/
├── backend/
│   ├── main.py              API routes (enroll, verify, list, delete)
│   ├── voice_engine.py      Model loading, embedding, matching, persistence
│   ├── requirements.txt     Python dependencies
│   └── data/
│       ├── voices.json      Enrolled voiceprint ledger (gitignored)
│       └── pretrained_models/  Cached ECAPA-TDNN weights (gitignored)
│
├── frontend/
│   └── src/
│       ├── App.jsx           Page layout and top-level state
│       ├── api.js            Fetch wrappers for all backend endpoints
│       └── components/
│           ├── Dropzone.jsx        Drag-and-drop audio file picker
│           ├── EnrollPanel.jsx     Name input + sample upload + enroll
│           ├── VoiceLedger.jsx     Enrolled speakers list with delete
│           ├── VerifyPanel.jsx     Test clip upload + results display
│           ├── MatchMeter.jsx      Radial gauge for match confidence
│           ├── RankingBars.jsx     LED-style bars for full ranking
│           └── Waveform.jsx        Animated header waveform decoration
│
└── legacy/
    └── original_app.py      Earlier single-file version, kept for reference
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | SpeechBrain `spkrec-ecapa-voxceleb` (ECAPA-TDNN) |
| Audio Processing | librosa, soundfile |
| Backend Framework | FastAPI (Python) |
| ML Runtime | PyTorch (CPU) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Persistence | JSON flat-file (no database required) |

---

## How It Works

### 1. Enrollment
Each uploaded audio clip is:
- Loaded and resampled to **16kHz mono**
- Trimmed of leading/trailing silence
- Peak-normalized for consistent volume
- Passed through the **ECAPA-TDNN encoder** which produces a **192-dimensional voice embedding**

If multiple samples are uploaded for one person, their embeddings are **averaged** into a single, more stable voiceprint — smoothing out per-recording noise like background hum, mic differences, or momentary pitch shifts.

### 2. Verification
The test clip goes through the same preprocessing and embedding pipeline, then its vector is compared against every enrolled voiceprint using **cosine similarity**.

### 3. Verdict
Each score is bucketed using configurable thresholds (defined in `backend/voice_engine.py`):

| Score | Verdict |
|---|---|
| >= 0.75 | Match |
| 0.60 - 0.75 | Possible Match |
| < 0.60 | No Match |

### 4. Persistence
Enrolled voiceprints are saved to `backend/data/voices.json` so the ledger survives server restarts — no re-enrolling from scratch every session.

---

## Running Locally

### Prerequisites
- Python 3.10 – 3.12
- Node.js 18+
- ~1–2 GB free disk space (PyTorch + model weights)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> The first request downloads the pretrained ECAPA-TDNN weights into `backend/data/pretrained_models/` — a one-time download of ~200MB.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the Vite dev server proxies all `/api/*` requests to the backend on port 8000, so both need to be running at the same time.

### 3. Using the App

1. Type a speaker name, drop in one or more clean audio recordings, click **Enroll Voice**
2. Repeat for as many speakers as you want in the ledger
3. Drop an unknown clip into the **Verify** panel and click **Analyze Voice**
4. Get a confidence meter for the best match + a ranked bar for every enrolled voice

---

## API Reference

All endpoints are prefixed with `/api`.

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `GET` | `/voices` | — | List all enrolled speakers |
| `POST` | `/voices` | `label` (text), `files[]` (audio) | Enroll a new speaker |
| `DELETE` | `/voices/{id}` | — | Remove an enrolled speaker |
| `POST` | `/verify` | `file` (audio) | Verify a clip against all enrolled voices |

**Example `/verify` response:**
```json
{
  "best_match": { "id": "a1b2c3d4", "label": "Akhilesh", "score": 0.8421, "verdict": "match" },
  "ranking": [
    { "id": "a1b2c3d4", "label": "Akhilesh", "score": 0.8421, "verdict": "match" },
    { "id": "e5f6g7h8", "label": "Priya",    "score": 0.3127, "verdict": "no_match" }
  ],
  "thresholds": { "match": 0.75, "possible": 0.6 }
}
```

Interactive API docs (Swagger UI) are auto-generated at:
```
http://localhost:8000/docs
```

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://voice-matching-ai.vercel.app |
| Backend API | Render | https://voice-matching-ai-v1bs.onrender.com |

> **Note:** Backend runs on Render free tier — first request after inactivity may take 30–60 seconds (cold start). Upgrade to Render Starter plan for always-on performance.

---

## Limitations

- Runs on **CPU by default** — embedding takes ~1–3 seconds per clip
- Cosine-similarity thresholds are demo defaults, not calibrated biometric standards
- JSON ledger has no access control — suitable for local/demo use only
- Short or noisy clips embed less reliably; use clean speech of a few seconds for best results

---

## Author

**Akhilesh Kachhwaha**
GitHub: [@Akhileshkachhwaha26](https://github.com/Akhileshkachhwaha26)
