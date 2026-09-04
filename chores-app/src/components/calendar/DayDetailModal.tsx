import { useState } from 'react'
import { Check, Plus, UserCog } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AvatarStack } from '../ui/AvatarStack'
import { Pill } from '../ui/Pill'
import type { Occurrence } from '../../lib/occurrence'
import { useStore } from '../../store/useStore'
import { friendlyDate, todayISO } from '../../lib/date'
import { useToast } from '../ui/Toast'

const STATUS_TONE = { completed: 'success', overdue: 'danger', today: 'primary', upcoming: 'info' } as const

export function DayDetailModal({
  date,
  occurrences,
  onClose,
  onOpenChore,
  onAddForDay,
}: {
  date: string | null
  occurrences: Occurrence[]
  onClose: () => void
  onOpenChore: (choreId: string) => void
  onAddForDay?: (date: string) => void
}) {
  const users = useStore((s) => s.users)
  const completeChore = useStore((s) => s.completeChore)
  const updateChore = useStore((s) => s.updateChore)
  const { show } = useToast()
  const today = todayISO()
  const [reassigningId, setReassigningId] = useState<string | null>(null)

  return (
    <Modal
      open={!!date}
      onClose={onClose}
      title={date ? friendlyDate(date) : ''}
      size="sm"
      footer={
        date && onAddForDay ? (
          <Button variant="secondary" icon={<Plus size={15} />} className="w-full" onClick={() => onAddForDay(date)}>
            Add chore for this day
          </Button>
        ) : undefined
      }
    >
      {occurrences.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nothing scheduled this day.</p>
      ) : (
        <div className="space-y-2">
          {occurrences.map((o) => {
            const assignees = users.filter((u) => o.chore.assigneeIds.includes(u.id))
            const reassigning = reassigningId === o.chore.id
            return (
              <div key={o.chore.id} className="rounded-xl border border-border p-2.5">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      if (o.status === 'completed') return
                      completeChore(o.chore.id, date ?? today)
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
                  <button onClick={() => onOpenChore(o.chore.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="text-lg">{o.chore.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{o.chore.title}</span>
                  </button>
                  <button
                    onClick={() => setReassigningId(reassigning ? null : o.chore.id)}
                    aria-label="Reassign"
                    className="focus-ring rounded-lg p-1 text-ink-faint transition hover:bg-surface-2 hover:text-ink"
                  >
                    <UserCog size={15} />
                  </button>
                  <AvatarStack users={assignees} size={24} />
                  <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
                </div>
                {reassigning && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                    {users.map((u) => {
                      const active = o.chore.assigneeIds.includes(u.id)
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            const next = active
                              ? o.chore.assigneeIds.filter((id) => id !== u.id)
                              : [...o.chore.assigneeIds, u.id]
                            updateChore(o.chore.id, { assigneeIds: next })
                          }}
                          className={clsx(
                            'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold transition',
                            active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft'
                          )}
                        >
                          {u.avatarEmoji} {u.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
