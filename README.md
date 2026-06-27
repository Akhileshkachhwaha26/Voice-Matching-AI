# Voiceprint — Speaker Verification

A full-stack speaker verification system. Enroll reference voices, upload an
unknown clip, and get a ranked similarity score against every voice in your
ledger — powered by a deep speaker-embedding model and served through a
clean, audio-engineering-styled web interface.

## What it does

Voiceprint lets you build a small voice "ledger" of known speakers and then
check any new audio clip against it. Under the hood, every clip — enrolled
or unknown — is converted into a 192-dimensional embedding vector that
captures the unique characteristics of a person's voice (pitch, timbre,
speaking style). Comparing two embeddings with cosine similarity tells you
how likely they are to belong to the same speaker.

Typical use cases:
- **Voice-based identity checks** — confirm a recording matches a known speaker
- **Speaker diarization helpers** — figure out who's talking in a set of clips
- **Voice authentication prototypes** — a foundation for "log in with your voice" flows
- **Audio forensics / research demos** — compare unknown recordings against a known set

## How it works

**1. Enrollment.** You provide a name and one or more clean audio samples of
that person. Each clip is:
- loaded and resampled to 16kHz mono
- trimmed of leading/trailing silence
- peak-normalized for consistent volume
- passed through the embedding model to produce a 192-dimensional vector

If you provide multiple samples, their embeddings are **averaged** into a
single voiceprint — this smooths out per-recording noise (background hum,
mic differences, momentary pitch shifts) and produces a more reliable
reference than any single clip alone.

**2. Verification.** An unknown clip goes through the identical
preprocessing and embedding pipeline, then its vector is compared against
every enrolled voiceprint using cosine similarity — a measure from -1 to 1
(in practice, roughly 0 to 1 for voices) of how aligned two vectors are in
embedding space. Closer to 1 means more similar.

**3. Verdict.** Each comparison gets bucketed into a verdict using two
configurable thresholds (set in `backend/voice_engine.py`):

| Score range | Verdict |
|---|---|
| ≥ 0.75 | **Match** |
| 0.60 – 0.75 | **Possible match** |
| < 0.60 | **No match** |

These are sensible starting points for a demo, not a forensically validated
threshold — if you enroll a real dataset and care about precision/recall,
tune `MATCH_THRESHOLD` and `POSSIBLE_THRESHOLD` against your own data.

**4. Persistence.** Enrolled voiceprints are saved to a local JSON file
(`backend/data/voices.json`), so the ledger survives server restarts. You're
not re-enrolling from scratch every time you start the app.

## Tech stack

| Layer | Technology |
|---|---|
| Speaker embedding model | SpeechBrain `spkrec-ecapa-voxceleb` (ECAPA-TDNN, trained on VoxCeleb) |
| Audio processing | librosa, soundfile |
| Backend framework | FastAPI (Python) |
| ML runtime | PyTorch (CPU) |
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Persistence | Flat-file JSON (no database required) |

The model — ECAPA-TDNN — is a widely used architecture for speaker
recognition. It's trained to map any speech clip into an embedding space
where clips from the same speaker land close together and clips from
different speakers land far apart, regardless of what's actually being said.

## Project structure
voice-matching-ai/

├── backend/

│   ├── main.py              FastAPI app: routes for enroll / verify / list / delete

│   ├── voice_engine.py        model loading, audio preprocessing, embedding,

│   │                            cosine-similarity matching, JSON persistence

│   ├── requirements.txt       pinned Python dependencies

│   └── data/

│       ├── voices.json         the enrolled voiceprint ledger (gitignored)

│       └── pretrained_models/  cached ECAPA-TDNN weights (gitignored)

│

├── frontend/

│   ├── index.html

│   ├── vite.config.js          dev server + API proxy config

│   ├── tailwind.config.js      design tokens (colors, fonts, shadows)

│   └── src/

│       ├── App.jsx              page layout, top-level state

│       ├── api.js                 fetch wrappers for every backend endpoint

│       ├── index.css              global styles + custom animations

│       └── components/

│           ├── Dropzone.jsx        drag-and-drop audio file picker

│           ├── EnrollPanel.jsx     name input + sample upload + enroll action

│           ├── VoiceLedger.jsx     list of enrolled speakers, with delete

│           ├── VerifyPanel.jsx     test-clip upload + analyze action + results

│           ├── MatchMeter.jsx      radial gauge showing best-match confidence

│           ├── RankingBars.jsx     LED-style bars for the full ranked list

│           └── Waveform.jsx        decorative animated header waveform

│

└── legacy/

└── original_app.py        earlier version of the matching logic, kept for reference
## Getting started

### Prerequisites
- Python 3.10–3.12
- Node.js 18+
- ~1–2 GB free disk space (PyTorch + model weights)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The first call that touches the model downloads the pretrained ECAPA-TDNN
weights into `backend/data/pretrained_models/` — a one-time download of a
few hundred MB.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). The Vite dev
server proxies any `/api/*` request to the backend on port 8000, so both
need to be running at the same time.

### Using the app

1. **Enroll** — type a speaker's name, drop in one or more clean recordings
   of their voice, click **Enroll Voice**.
2. **Build out the ledger** — repeat for as many speakers as you want.
3. **Verify** — drop in an unknown clip, click **Analyze Voice**. You'll see
   a confidence meter for the closest match, plus a ranked bar for every
   enrolled speaker.
4. **Manage** — remove anyone from the ledger at any time from the Voiceprint
   Ledger panel.

## API reference

All endpoints are prefixed with `/api`.

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `GET` | `/voices` | — | List all enrolled speakers |
| `POST` | `/voices` | `label` (text), `files[]` (audio) | Enroll a new speaker from one or more clips |
| `DELETE` | `/voices/{id}` | — | Remove an enrolled speaker |
| `POST` | `/verify` | `file` (audio) | Compare a clip against every enrolled voice |

**Example response from `POST /verify`:**

```json
{
  "best_match": { "id": "a1b2c3d4", "label": "Akhilesh", "score": 0.8421, "verdict": "match" },
  "ranking": [
    { "id": "a1b2c3d4", "label": "Akhilesh", "score": 0.8421, "verdict": "match" },
    { "id": "e5f6g7h8", "label": "Priya", "score": 0.3127, "verdict": "no_match" }
  ],
  "thresholds": { "match": 0.75, "possible": 0.6 }
}
```

## Design notes

The UI leans into an audio-engineering aesthetic rather than a generic SaaS
dashboard look: near-black background, an amber accent borrowed from analog
gear, monospace type for data readouts (scores, IDs), and a radial VU-meter
style gauge for match confidence instead of a plain progress bar. The intent
is for the interface to feel like a piece of studio equipment, since the
underlying task — comparing voiceprints — is inherently an audio-signal
problem.

## Limitations and things to know

- Runs on CPU by default; embedding a clip takes roughly 1–3 seconds depending
  on hardware and clip length.
- Cosine-similarity thresholds are reasonable demo defaults, not a
  calibrated biometric standard — don't use this as-is for high-stakes
  identity verification without your own validation.
- The voice ledger is a single shared JSON file with no user accounts or
  access control — fine for local/demo use, not multi-tenant production use.
- Short or noisy clips embed less reliably; clean speech of a few seconds or
  more gives the most stable voiceprints.

## Possible next steps

- Swap the flat JSON store for a real database if the ledger grows large
- Add waveform/spectrogram visualization of the uploaded clip itself
- Support live microphone recording in the browser instead of file upload only
- Add authentication so the ledger isn't open to anyone with API access
- GPU inference for faster embedding on larger workloads

## License

No license has been set yet — add one (MIT is a common default for personal
projects) if you plan to share or open-source this.