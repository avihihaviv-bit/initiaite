interface Segment {
  label: string
  value: number
  color: string
  emoji?: string
}

export function DonutChart({ data, size = 140, strokeWidth = 20 }: { data: Segment[]; size?: number; strokeWidth?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r

  const segments = data.reduce<Array<Segment & { dash: number; offset: number }>>((acc, d) => {
    const dash = (d.value / total) * c
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
    acc.push({ ...d, dash, offset })
    return acc
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={strokeWidth} fill="none" />
          {segments.map((d) => (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={d.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${d.dash} ${c - d.dash}`}
              strokeDashoffset={-d.offset}
              style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-extrabold text-ink">{total}</span>
          <span className="text-[10px] font-semibold text-ink-faint">chores</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate font-semibold text-ink">{d.emoji} {d.label}</span>
            <span className="font-bold text-ink-faint">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
