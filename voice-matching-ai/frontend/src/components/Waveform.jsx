export default function Waveform({ bars = 28 }) {
  return (
    <div className="flex items-end h-8 overflow-hidden" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar"
          style={{
            height: `${8 + ((i * 7) % 24)}px`,
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}
