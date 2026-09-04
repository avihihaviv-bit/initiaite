import { useMemo, useState } from 'react'
import { Check, Coffee, Plus } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Pill } from '../components/ui/Pill'
import { EmptyState } from '../components/ui/EmptyState'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { formatTime, friendlyDate, todayISO } from '../lib/date'
import { effectiveDueDate, isDueOn, isOverdue, occurrencesForRange } from '../lib/occurrence'
import { useToast } from '../components/ui/Toast'

export default function Schedule() {
  const users = useStore((s) => s.users)
  const chores = useStore((s) => s.chores)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()

  const [personId, setPersonId] = useState(currentUserId ?? users[0]?.id ?? '')
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const person = users.find((u) => u.id === personId)
  const today = todayISO()
  const myChores = useMemo(() => chores.filter((c) => c.assigneeIds.includes(personId) && !c.archived), [chores, personId])
  const openChore = chores.find((c) => c.id === openChoreId) ?? null

  const todayOccurrences = useMemo(() => occurrencesForRange(myChores, today, today), [myChores, today])
  const timed = todayOccurrences.filter((o) => o.chore.dueTime).sort((a, b) => (a.chore.dueTime ?? '').localeCompare(b.chore.dueTime ?? ''))
  const untimed = todayOccurrences.filter((o) => !o.chore.dueTime)

  const overdue = useMemo(() => myChores.filter((c) => isOverdue(c, today)), [myChores, today])
  const upcoming = useMemo(
    () =>
      myChores
        .filter((c) => !isDueOn(c, today) && !isOverdue(c, today) && effectiveDueDate(c, today) > today)
        .map((c) => ({ chore: c, date: effectiveDueDate(c, today) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .slice(0, 6),
    [myChores, today]
  )

  // Interleave chores with free-time gaps of 20+ minutes between them.
  const items: Array<{ kind: 'chore'; o: (typeof timed)[number] } | { kind: 'gap'; minutes: number }> = []
  timed.forEach((o, i) => {
    items.push({ kind: 'chore', o })
    const next = timed[i + 1]
    if (next && o.chore.dueTime && next.chore.dueTime) {
      const [h1, m1] = o.chore.dueTime.split(':').map(Number)
      const end = h1 * 60 + m1 + o.chore.estimatedMinutes
      const [h2, m2] = next.chore.dueTime.split(':').map(Number)
      const start = h2 * 60 + m2
      const gap = start - end
      if (gap >= 20) items.push({ kind: 'gap', minutes: gap })
    }
  })

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Schedule</h1>
          <p className="mt-0.5 text-sm text-ink-soft">A personal timeline for each family member.</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>Assign chore</Button>
      </div>

      <div className="no-scrollbar scroll-fade-x flex gap-2 overflow-x-auto">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setPersonId(u.id)}
            className={clsx(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition',
              personId === u.id ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft'
            )}
          >
            <Avatar emoji={u.avatarEmoji} color={u.color} size={22} /> {u.name}
          </button>
        ))}
      </div>

      {person && (
        <>
          {overdue.length > 0 && (
            <Card className="border-danger-300/50 bg-danger-100/30 dark:bg-danger-500/10">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-danger-600">⚠️ {overdue.length} overdue</p>
              <div className="space-y-1.5">
                {overdue.map((c) => (
                  <button key={c.id} onClick={() => setOpenChoreId(c.id)} className="focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm hover:bg-surface-2">
                    <span>{c.emoji}</span>
                    <span className="flex-1 truncate font-semibold text-ink">{c.title}</span>
                    <span className="text-xs text-danger-500">{friendlyDate(effectiveDueDate(c, today))}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-3 font-display text-base font-bold text-ink">{person.name}'s schedule — Today</h2>
            {items.length === 0 && untimed.length === 0 ? (
              <EmptyState emoji="🌤" title="Nothing scheduled today" description={`${person.name} has a free day.`} action={<Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Assign a chore</Button>} />
            ) : (
              <div className="relative space-y-0 pl-6">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
                {items.map((item, i) =>
                  item.kind === 'chore' ? (
                    <div key={item.o.chore.id} className="relative flex w-full items-center gap-3 py-2.5">
                      <span
                        className={clsx(
                          'absolute -left-6 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-canvas',
                          item.o.status === 'completed' ? 'bg-success-500' : 'bg-primary-500'
                        )}
                      />
                      <span className="w-14 shrink-0 text-xs font-bold text-ink-faint">{formatTime(item.o.chore.dueTime)}</span>
                      <span className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                        <button
                          onClick={() => setOpenChoreId(item.o.chore.id)}
                          className="focus-ring flex flex-1 items-center gap-2 text-left"
                        >
                          <span className="text-lg">{item.o.chore.emoji}</span>
                          <span className={clsx('flex-1 truncate text-sm font-bold text-ink', item.o.status === 'completed' && 'text-ink-faint line-through')}>
                            {item.o.chore.title}
                          </span>
                          <span className="shrink-0 text-xs text-ink-faint">{item.o.chore.estimatedMinutes} min</span>
                        </button>
                        {item.o.status === 'completed' ? (
                          <Check size={16} className="shrink-0 text-success-500" />
                        ) : (
                          <button
                            onClick={() => {
                              completeChore(item.o.chore.id, today)
                              show(`${item.o.chore.title} complete!`)
                            }}
                            className="focus-ring shrink-0 rounded-lg border border-border px-2 py-1 text-[11px] font-bold text-ink-soft hover:bg-surface-2"
                          >
                            Complete
                          </button>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div key={`gap-${i}`} className="relative flex items-center gap-3 py-1.5 pl-[3.75rem] text-xs text-ink-faint">
                      <Coffee size={12} /> {Math.round(item.minutes / 60) >= 1 ? `${(item.minutes / 60).toFixed(1)}h` : `${item.minutes}m`} free
                    </div>
                  )
                )}
                {untimed.map((o) => (
                  <button key={o.chore.id} onClick={() => setOpenChoreId(o.chore.id)} className="focus-ring relative flex w-full items-center gap-3 py-2.5 text-left">
                    <span className="absolute -left-6 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink-faint/50 ring-4 ring-canvas" />
                    <span className="w-14 shrink-0 text-xs font-bold text-ink-faint">Anytime</span>
                    <span className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
                      <span className="text-lg">{o.chore.emoji}</span>
                      <span className={clsx('flex-1 truncate text-sm font-bold text-ink', o.status === 'completed' && 'text-ink-faint line-through')}>{o.chore.title}</span>
                      <span className="shrink-0 text-xs text-ink-faint">{o.chore.estimatedMinutes} min</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-base font-bold text-ink">Upcoming</h2>
              <div className="space-y-1.5">
                {upcoming.map(({ chore, date }) => (
                  <button key={chore.id} onClick={() => setOpenChoreId(chore.id)} className="focus-ring flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left">
                    <span className="text-lg">{chore.emoji}</span>
                    <span className="flex-1 truncate text-sm font-bold text-ink">{chore.title}</span>
                    <Pill tone="info">{friendlyDate(date)}</Pill>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ChoreDetailModal chore={openChore} onClose={() => setOpenChoreId(null)} onEdit={() => setOpenChoreId(null)} />
      <ChoreFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaultUserId={personId} />
    </div>
  )
}
