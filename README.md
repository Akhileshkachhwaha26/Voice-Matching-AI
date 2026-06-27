# Voiceprint — Speaker Verification (v2)

An upgrade of the original single-file Colab script into a real, runnable
project: a **FastAPI** backend that wraps SpeechBrain's `ECAPA-TDNN`
speaker-embedding model, and a **React + Tailwind** UI for enrolling
reference voices and verifying unknown clips against them.

```
voice-matching-ai/
├── backend/                 FastAPI service + ML engine
│   ├── main.py               API routes
│   ├── voice_engine.py        model loading, embedding, matching, persistence
│   ├── requirements.txt
│   └── data/                  voices.json + cached model weights (gitignored)
├── frontend/                 React + Vite + Tailwind UI
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/        Dropzone, EnrollPanel, VoiceLedger, VerifyPanel,
│                               MatchMeter, RankingBars, Waveform
└── legacy/
    └── original_app.py        the original Colab script, kept for reference
```

## What changed vs. the original script

The original `app.py` was a one-shot Colab notebook: it loaded the model,
asked you to `files.upload()` a batch of "database" voices and one "test"
voice, embedded everything once, and printed a single best match. It worked,
but it wasn't reusable, had no persistence, and only compared raw,
un-trimmed audio.

| | Original script | This project |
|---|---|---|
| Interface | Colab `files.upload()` prompts | Web UI (drag & drop) + REST API |
| Enrollment | One file per person | Multiple samples per person, averaged into one embedding |
| Audio prep | Raw audio straight into the model | Silence trimmed, amplitude normalized |
| Storage | Nothing persisted — re-run from scratch every time | Voiceprints saved to `backend/data/voices.json` |
| Output | Single best match + raw score | Full ranked list, verdict (match / possible / no match), confidence meter |
| Reuse | Re-run the whole notebook per comparison | Enroll once, verify any number of times via API or UI |

The underlying AI is the same well-regarded model
(`speechbrain/spkrec-ecapa-voxceleb`, an ECAPA-TDNN speaker encoder trained on
VoxCeleb) — the upgrade is in how it's deployed and used, not a different
model. If you want to go further, `backend/voice_engine.py` is the only file
you need to touch to swap in a different embedding model.

## How matching works

1. **Enroll**: each uploaded clip is loaded, trimmed of leading/trailing
   silence, peak-normalized, and embedded into a 192-dimensional vector by
   the ECAPA-TDNN encoder. If you upload several clips for one person, their
   embeddings are averaged into a single, more stable voiceprint.
2. **Verify**: the test clip goes through the same pipeline, then its
   embedding is compared against every enrolled voiceprint using **cosine
   similarity** (the same metric the original script used).
3. **Verdict**: each score is bucketed using two thresholds defined at the
   top of `voice_engine.py`:
   - `score ≥ 0.75` → **match**
   - `0.60 ≤ score < 0.75` → **possible match**
   - `score < 0.60` → **no match**

   These are sensible defaults for a demo, not a calibrated biometric
   threshold — adjust `MATCH_THRESHOLD` / `POSSIBLE_THRESHOLD` if you enroll
   a real dataset and want to tune precision/recall.

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The first request will download the pretrained ECAPA-TDNN weights into
`backend/data/pretrained_models/` (a few hundred MB) — that only happens
once.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server
proxies `/api/*` to the backend on port 8000, so both just need to be running
side by side.

### 3. Use it

1. Type a name, drop in one or more clean recordings of that person, click
   **Enroll Voice**.
2. Repeat for anyone else you want in the ledger.
3. Drop an unknown clip into the **Verify** panel and click **Analyze
   Voice** — you'll get a confidence meter for the best match and a ranked
   bar for every enrolled voice.

## API reference

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/health` | — | liveness check |
| GET | `/api/voices` | — | list enrolled voices |
| POST | `/api/voices` | `label` (form field), `files[]` | enroll a speaker |
| DELETE | `/api/voices/{id}` | — | remove an enrolled speaker |
| POST | `/api/verify` | `file` | verify a clip, get ranked results |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Voiceprint: speaker verification with FastAPI + React"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`backend/data/` and `frontend/node_modules/` are already gitignored so the
model weights and your enrolled voiceprints never get committed.

## Notes on the slide deck

The uploaded `.pptx` is a near-empty title/section template (placeholders +
a couple of pasted screenshots, no body text), so it wasn't something I
could lift content from. If you'd like, I can build you a proper explainer
deck for this v2 project — covering the ECAPA-TDNN model, the embedding →
cosine-similarity pipeline, the architecture diagram, and a demo walkthrough
— just say the word and I'll generate it as a `.pptx` you can present from.