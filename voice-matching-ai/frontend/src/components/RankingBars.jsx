const VERDICT_COLOR = {
  match: '#7FD9A8',
  possible: '#E8A33D',
  no_match: '#E8654A',
}

export default function RankingBars({ ranking = [] }) {
  return (
    <ul className="space-y-3">
      {ranking.map((r, i) => (
        <li key={r.id}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-gray-300">
              <span className="text-mute mr-2">{String(i + 1).padStart(2, '0')}</span>
              {r.label}
            </span>
            <span className="font-mono text-xs" style={{ color: VERDICT_COLOR[r.verdict] }}>
              {Math.round(r.score * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface2 overflow-hidden">
            <div
              className="led-fill h-full rounded-full"
              style={{
                width: `${Math.round(r.score * 100)}%`,
                backgroundColor: VERDICT_COLOR[r.verdict],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
