import { ProgressRing } from '../ui/ProgressRing'

export function FairnessGauge({ score }: { score: number }) {
  const color = score >= 85 ? 'var(--color-success-500)' : score >= 65 ? 'var(--color-accent-500)' : 'var(--color-danger-500)'
  const label = score >= 85 ? 'Excellent balance' : score >= 65 ? 'Pretty fair' : 'Could use rebalancing'

  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={score} size={84} strokeWidth={9} color={color}>
        <span className="font-display text-xl font-extrabold text-ink">{score}</span>
      </ProgressRing>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">⚖️ Household Fairness</p>
        <p className="font-display text-lg font-extrabold text-ink">{score}/100</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </div>
  )
}
