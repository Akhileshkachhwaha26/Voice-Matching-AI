import { deleteVoice } from '../api.js'

export default function VoiceLedger({ voices, onChange }) {
  async function remove(id) {
    await deleteVoice(id)
    onChange?.()
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold text-gray-100 tracking-wide">
        VOICEPRINT LEDGER
      </h2>
      <p className="text-xs text-mute mt-1 mb-4">
        {voices.length === 0
          ? 'No voices enrolled yet.'
          : `${voices.length} speaker${voices.length > 1 ? 's' : ''} enrolled.`}
      </p>

      {voices.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg py-6 text-center">
          <p className="font-mono text-xs text-mute">Enroll a voice to start matching.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {voices.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between bg-surface2 border border-line rounded-md px-3 py-2"
            >
              <div>
                <p className="text-sm text-gray-100">{v.label}</p>
                <p className="font-mono text-[11px] text-mute">
                  {v.samples} sample{v.samples > 1 ? 's' : ''} · id {v.id}
                </p>
              </div>
              <button
                onClick={() => remove(v.id)}
                className="font-mono text-[11px] uppercase tracking-wider text-mute hover:text-warn"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
