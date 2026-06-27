import { useRef, useState } from 'react'

export default function Dropzone({ multiple = false, files, onFiles, label }) {
  const inputRef = useRef(null)
  const [active, setActive] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setActive(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('audio/'),
    )
    if (dropped.length) onFiles(multiple ? [...files, ...dropped] : [dropped[0]])
  }

  function handlePick(e) {
    const picked = Array.from(e.target.files)
    if (picked.length) onFiles(multiple ? [...files, ...picked] : [picked[0]])
    e.target.value = ''
  }

  function removeAt(i) {
    onFiles(files.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div
        className={`dropzone rounded-lg px-4 py-6 text-center cursor-pointer ${active ? 'active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setActive(true)
        }}
        onDragLeave={() => setActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple={multiple}
          className="hidden"
          onChange={handlePick}
        />
        <p className="font-mono text-xs uppercase tracking-wider text-mute">
          {label || 'Drop audio file' + (multiple ? 's' : '') + ' or click to browse'}
        </p>
        <p className="text-[11px] text-mute/70 mt-1">WAV / MP3 / FLAC / M4A</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-surface2 border border-line rounded-md px-3 py-1.5 text-sm"
            >
              <span className="truncate font-mono text-xs text-gray-200">{f.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                className="text-mute hover:text-warn text-xs ml-3 shrink-0"
                aria-label={`Remove ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
