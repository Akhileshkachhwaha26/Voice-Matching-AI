import { useState } from 'react'
import Dropzone from './Dropzone.jsx'
import MatchMeter from './MatchMeter.jsx'
import RankingBars from './RankingBars.jsx'
import { verifyVoice } from '../api.js'

export default function VerifyPanel({ hasVoices }) {
  const [files, setFiles] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function analyze() {
    if (files.length === 0) {
      setError('Add a clip to analyze.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await verifyVoice(files[0])
      setResult(data)
    } catch (err) {
      setError(err.message)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold text-gray-100 tracking-wide">
        02 — VERIFY A VOICE
      </h2>
      <p className="text-xs text-mute mt-1 mb-4">
        Upload an unknown clip. It's compared against every enrolled voiceprint and ranked by
        cosine similarity.
      </p>

      <Dropzone files={files} onFiles={setFiles} label="Drop a test clip or click to browse" />

      {error && <p className="mt-3 text-xs font-mono text-warn">{error}</p>}

      <button
        onClick={analyze}
        disabled={busy || !hasVoices}
        className="mt-4 w-full bg-transparent border border-amber text-amber font-mono text-xs uppercase tracking-widest font-medium rounded-md py-2.5 hover:bg-amber hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-amber transition"
      >
        {busy ? 'Analyzing…' : !hasVoices ? 'Enroll a voice first' : 'Analyze Voice'}
      </button>

      {result && (
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex flex-col items-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-mute mb-2">
              Best Match — {result.best_match.label}
            </p>
            <MatchMeter score={result.best_match.score} verdict={result.best_match.verdict} />
          </div>

          <p className="font-mono text-[11px] uppercase tracking-widest text-mute mt-6 mb-3">
            Full Ranking
          </p>
          <RankingBars ranking={result.ranking} />
        </div>
      )}
    </div>
  )
}
