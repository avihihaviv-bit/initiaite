import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { getMonthGrid, MONTH_LABELS, todayISO, WEEKDAY_LABELS } from '../../lib/date'
import { occurrencesForRange, type Occurrence } from '../../lib/occurrence'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/Toast'

const STATUS_DOT: Record<Occurrence['status'], string> = {
  completed: 'bg-success-500',
  overdue: 'bg-danger-500',
  today: 'bg-primary-500',
  upcoming: 'bg-info-400',
}

export function MonthView({ anchor, onOpenDay }: { anchor: string; onOpenDay: (dateISO: string) => void }) {
  const chores = useStore((s) => s.chores)
  const moveChoreDate = useStore((s) => s.moveChoreDate)
  const { show } = useToast()
  const today = todayISO()
  const days = useMemo(() => getMonthGrid(anchor), [anchor])
  const monthIndex = new Date(anchor).getMonth()
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

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
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wide text-ink-faint">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const inMonth = new Date(d).getMonth() === monthIndex
          const occ = byDate.get(d) ?? []
          const isToday = d === today
          return (
            <button
              key={d}
              onClick={() => onOpenDay(d)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverDate(d)
              }}
              onDragLeave={() => setDragOverDate((v) => (v === d ? null : v))}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverDate(null)
                const choreId = e.dataTransfer.getData('text/chore-id')
                const chore = chores.find((c) => c.id === choreId)
                if (!chore) return
                if (chore.recurrence.frequency !== 'none') {
                  show('Recurring chores follow their schedule — edit it to reschedule.', { tone: 'info' })
                  return
                }
                moveChoreDate(choreId, d)
                show(`Moved "${chore.title}" to ${d}`)
              }}
              className={clsx(
                'relative flex min-h-[86px] flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition sm:min-h-[104px] sm:p-2',
                !inMonth && 'bg-surface-2/40 text-ink-faint',
                dragOverDate === d && 'bg-primary-50 ring-2 ring-inset ring-primary-300 dark:bg-primary-900/20'
              )}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  isToday ? 'bg-primary-500 text-white' : inMonth ? 'text-ink' : 'text-ink-faint'
                )}
              >
                {new Date(d).getDate()}
              </span>
              <div className="flex w-full flex-1 flex-col gap-0.5 overflow-hidden">
                {occ.slice(0, 3).map((o) => (
                  <div
                    key={o.chore.id}
                    draggable={o.chore.recurrence.frequency === 'none'}
                    onDragStart={(e) => {
                      e.stopPropagation()
                      e.dataTransfer.setData('text/chore-id', o.chore.id)
                    }}
                    className="flex items-center gap-1 truncate rounded-md bg-surface px-1 py-0.5 text-[10px] font-semibold text-ink shadow-sm sm:text-[11px]"
                  >
                    <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[o.status])} />
                    <span className="truncate">{o.chore.emoji} {o.chore.title}</span>
                  </div>
                ))}
                {occ.length > 3 && <span className="text-[10px] font-bold text-ink-faint">+{occ.length - 3} more</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function monthLabel(anchor: string): string {
  const d = new Date(anchor)
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}
