import { Laptop, Moon, Sun } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/useStore'
import type { ThemeMode } from '../../types'

const OPTIONS: { id: ThemeMode; icon: typeof Sun; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Laptop, label: 'System' },
]

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const themeMode = useStore((s) => s.settings.themeMode)
  const update = useStore((s) => s.updateSettings)

  return (
    <div className={clsx('inline-flex rounded-xl border border-border bg-surface-2 p-1', compact && 'gap-0')}>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => update({ themeMode: o.id })}
          aria-label={o.label}
          aria-pressed={themeMode === o.id}
          className={clsx(
            'focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
            themeMode === o.id ? 'bg-surface text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint hover:text-ink'
          )}
        >
          <o.icon size={14} />
          {!compact && o.label}
        </button>
      ))}
    </div>
  )
}
