interface Bar {
  label: string
  value: number
  highlight?: boolean
}

export function BarChart({ data, unit }: { data: Bar[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex items-end gap-2.5 sm:gap-4" role="img" aria-label={`Bar chart: ${data.map((d) => `${d.label} ${d.value}${unit ?? ''}`).join(', ')}`}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[11px] font-bold text-ink-faint">{d.value}</span>
          <div className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-surface-2">
            <div
              className="w-full rounded-lg transition-all duration-700 ease-out"
              style={{
                height: `${(d.value / max) * 100}%`,
                minHeight: d.value > 0 ? 6 : 0,
                background: d.highlight ? 'var(--color-primary-500)' : 'var(--color-primary-300)',
              }}
            />
          </div>
          <span className="text-[11px] font-semibold text-ink-faint">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
