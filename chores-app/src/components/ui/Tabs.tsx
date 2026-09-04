import type { ReactNode } from 'react'
import clsx from 'clsx'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: Props) {
  return (
    <div className={clsx('no-scrollbar scroll-fade-x flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'focus-ring relative flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all',
            active === t.id ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-ink-soft hover:text-ink'
          )}
        >
          {t.icon}
          {t.label}
          {typeof t.count === 'number' && (
            <span className={clsx('rounded-full px-1.5 text-[11px]', active === t.id ? 'bg-primary-100 text-primary-700' : 'bg-border text-ink-faint')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControl({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={clsx(
            'focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
            value === o.id ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-ink-soft hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
