import { useMemo } from 'react'
import clsx from 'clsx'
import { getWeekDays, todayISO, WEEKDAY_LABELS_FULL } from '../../lib/date'
import { occurrencesForRange, type Occurrence } from '../../lib/occurrence'
import { useStore } from '../../store/useStore'

const STATUS_DOT: Record<Occurrence['status'], string> = {
  completed: 'bg-success-500',
  overdue: 'bg-danger-500',
  today: 'bg-primary-500',
  upcoming: 'bg-info-400',
}

export function WeekView({ anchor, onOpenDay }: { anchor: string; onOpenDay: (dateISO: string) => void }) {
  const chores = useStore((s) => s.chores)
  const today = todayISO()
  const days = useMemo(() => getWeekDays(anchor), [anchor])
  const occurrences = useMemo(() => occurrencesForRange(chores, days[0], days[days.length - 1]), [chores, days])

  const byDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    occurrences.forEach((o) => {
      if (!map.has(o.date)) map.set(o.date, [])
      map.get(o.date)!.push(o)
    })
    return map
  }, [occurrences])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((d, i) => {
        const occ = (byDate.get(d) ?? []).sort((a, b) => a.chore.dueTime?.localeCompare(b.chore.dueTime ?? '') ?? 0)
        const isToday = d === today
        return (
          <button
            key={d}
            onClick={() => onOpenDay(d)}
            className={clsx(
              'flex flex-col rounded-2xl border p-3 text-left transition hover:shadow-[var(--shadow-soft)]',
              isToday ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' : 'border-border bg-surface'
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{WEEKDAY_LABELS_FULL[i].slice(0, 3)}</span>
              <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', isToday ? 'bg-primary-500 text-white' : 'text-ink')}>
                {new Date(d).getDate()}
              </span>
            </div>
            <div className="space-y-1">
              {occ.slice(0, 5).map((o) => (
                <div key={o.chore.id} className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-ink">
                  <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[o.status])} />
                  <span className="truncate">{o.chore.emoji} {o.chore.title}</span>
                </div>
              ))}
              {occ.length === 0 && <p className="text-[11px] text-ink-faint">Nothing scheduled</p>}
              {occ.length > 5 && <p className="text-[11px] font-bold text-ink-faint">+{occ.length - 5} more</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
