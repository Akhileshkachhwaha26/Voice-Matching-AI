import { useState } from 'react'
import Dropzone from './Dropzone.jsx'
import { enrollVoice } from '../api.js'

export default function EnrollPanel({ onEnrolled }) {
  const [label, setLabel] = useState('')
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState(null) // { type: 'error'|'success', text }
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!label.trim()) {
      setStatus({ type: 'error', text: 'Give this voice a name first.' })
      return
    }
    if (files.length === 0) {
      setStatus({ type: 'error', text: 'Add at least one audio sample.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await enrollVoice(label.trim(), files)
      setStatus({ type: 'success', text: `Enrolled "${label.trim()}" with ${files.length} sample${files.length > 1 ? 's' : ''}.` })
      setLabel('')
      setFiles([])
      onEnrolled?.()
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold text-gray-100 tracking-wide">
        01 — ENROLL A REFERENCE VOICE
      </h2>
      <p className="text-xs text-mute mt-1 mb-4">
        Add one or more clean clips of the same speaker. Multiple samples are averaged into a
        single, more reliable voiceprint.
      </p>

      <label className="block font-mono text-xs uppercase tracking-wider text-mute mb-1.5">
        Speaker name
      </label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Akhilesh"
        className="w-full bg-surface2 border border-line rounded-md px-3 py-2 text-sm text-gray-100 placeholder:text-mute/50 focus:outline-none focus:border-amber mb-4"
      />

      <Dropzone multiple files={files} onFiles={setFiles} label="Drop reference clips or click to browse" />

      {status && (
        <p className={`mt-3 text-xs font-mono ${status.type === 'error' ? 'text-warn' : 'text-signal'}`}>
          {status.text}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-4 w-full bg-amber text-ink font-mono text-xs uppercase tracking-widest font-medium rounded-md py-2.5 hover:brightness-110 disabled:opacity-50 transition"
      >
        {busy ? 'Enrolling…' : 'Enroll Voice'}
      </button>
    </div>
  )
}
