const VERDICT_COPY = {
  match: { label: 'MATCH', color: '#7FD9A8' },
  possible: { label: 'POSSIBLE MATCH', color: '#E8A33D' },
  no_match: { label: 'NO MATCH', color: '#E8654A' },
}

export default function MatchMeter({ score = 0, verdict = 'no_match' }) {
  const pct = Math.round(score * 100)
  const rotation = -90 + Math.max(0, Math.min(1, score)) * 180
  const verdictInfo = VERDICT_COPY[verdict] ?? VERDICT_COPY.no_match

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 115" className="w-56">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8654A" />
            <stop offset="55%" stopColor="#E8A33D" />
            <stop offset="100%" stopColor="#7FD9A8" />
          </linearGradient>
        </defs>

        {/* track */}
        <path
          d="M10,100 A90,90 0 0 1 190,100"
          fill="none"
          stroke="#1B2023"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* gradient arc */}
        <path
          d="M10,100 A90,90 0 0 1 190,100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* needle */}
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px', transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)' }}>
          <line x1="100" y1="100" x2="100" y2="28" stroke="#F4F1EA" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="5" fill="#F4F1EA" />
      </svg>

      <div className="-mt-3 text-center">
        <div className="font-mono text-3xl font-medium text-gray-100">{pct}%</div>
        <div
          className="font-mono text-xs uppercase tracking-widest mt-1"
          style={{ color: verdictInfo.color }}
        >
          {verdictInfo.label}
        </div>
      </div>
    </div>
  )
}
