import { useCallback, useEffect, useState } from 'react'
import Waveform from './components/Waveform.jsx'
import EnrollPanel from './components/EnrollPanel.jsx'
import VoiceLedger from './components/VoiceLedger.jsx'
import VerifyPanel from './components/VerifyPanel.jsx'
import { fetchVoices } from './api.js'

export default function App() {
  const [voices, setVoices] = useState([])
  const [apiUp, setApiUp] = useState(true)

  const refresh = useCallback(() => {
    fetchVoices()
      .then((v) => {
        setVoices(v)
        setApiUp(true)
      })
      .catch(() => setApiUp(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="min-h-screen text-gray-100">
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        <header className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber mb-2">
            Speaker Verification Engine
          </p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="font-display text-3xl font-semibold">VOICEPRINT</h1>
            <Waveform />
          </div>
          <p className="text-sm text-mute mt-3 max-w-xl">
            ECAPA-TDNN speaker embeddings, cosine similarity matching, and a persistent voiceprint
            ledger — built on top of speechbrain's <code className="font-mono text-xs">spkrec-ecapa-voxceleb</code> model.
          </p>
          {!apiUp && (
            <p className="mt-3 text-xs font-mono text-warn">
              Can't reach the API. Is the backend running on port 8000?
            </p>
          )}
        </header>

        <main className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <EnrollPanel onEnrolled={refresh} />
            <VoiceLedger voices={voices} onChange={refresh} />
          </div>
          <VerifyPanel hasVoices={voices.length > 0} />
        </main>

        <footer className="mt-16 pt-6 border-t border-line">
          <p className="font-mono text-[11px] text-mute">
            Voice Matching &amp; Similarity — v2.0 · React + FastAPI + SpeechBrain
          </p>
        </footer>
      </div>
    </div>
  )
}
