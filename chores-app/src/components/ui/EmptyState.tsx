import type { ReactNode } from 'react'

interface Props {
  emoji: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ emoji, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center animate-[var(--animate-in)]">
      <div className="mb-3 text-5xl animate-[var(--animate-float)]">{emoji}</div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
