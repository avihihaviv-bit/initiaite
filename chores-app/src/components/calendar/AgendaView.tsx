import { useMemo } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/useStore'
import { addDays, friendlyDate, todayISO } from '../../lib/date'
import { occurrencesForRange, type Occurrence } from '../../lib/occurrence'
import { AvatarStack } from '../ui/AvatarStack'
import { Pill } from '../ui/Pill'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'

const STATUS_TONE = { completed: 'success', overdue: 'danger', today: 'primary', upcoming: 'info' } as const

export function AgendaView({ onOpenChore, personId, rangeDaysBack = 3, rangeDaysForward = 21 }: { onOpenChore: (choreId: string) => void; personId?: string; rangeDaysBack?: number; rangeDaysForward?: number }) {
  const allChores = useStore((s) => s.chores)
  const chores = useMemo(() => (personId ? allChores.filter((c) => c.assigneeIds.includes(personId)) : allChores), [allChores, personId])
  const users = useStore((s) => s.users)
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()
  const today = todayISO()

  const occurrences = useMemo(
    () => occurrencesForRange(chores, addDays(today, -rangeDaysBack), addDays(today, rangeDaysForward)),
    [chores, today, rangeDaysBack, rangeDaysForward]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    occurrences.forEach((o) => {
      if (!map.has(o.date)) map.set(o.date, [])
      map.get(o.date)!.push(o)
    })
    return Array.from(map.entries())
  }, [occurrences])

  if (grouped.length === 0) {
    return <EmptyState emoji="📅" title="Nothing on the calendar" description="Add a chore to see it here." />
  }

  return (
    <div className="space-y-5">
      {grouped.map(([date, occ]) => (
        <div key={date}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">{friendlyDate(date)}</h3>
          <div className="space-y-2">
            {occ.map((o) => {
              const assignees = users.filter((u) => o.chore.assigneeIds.includes(u.id))
              return (
                <div key={`${o.chore.id}-${o.date}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                  <button
                    onClick={() => {
                      if (o.status === 'completed') return
                      completeChore(o.chore.id, o.date)
                      show(`${o.chore.title} complete!`)
                    }}
                    disabled={o.status === 'completed'}
                    className={clsx(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                      o.status === 'completed' ? 'border-success-500 bg-success-500 text-white' : 'border-border text-transparent hover:border-primary-400'
                    )}
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>
                  <button onClick={() => onOpenChore(o.chore.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span className="text-lg">{o.chore.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{o.chore.title}</span>
                      {o.chore.dueTime && <span className="block text-xs text-ink-faint">{o.chore.dueTime}</span>}
                    </span>
                  </button>
                  <AvatarStack users={assignees} size={26} />
                  <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
