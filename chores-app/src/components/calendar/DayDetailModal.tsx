import { Check } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Pill } from '../ui/Pill'
import type { Occurrence } from '../../lib/occurrence'
import { useStore } from '../../store/useStore'
import { friendlyDate, todayISO } from '../../lib/date'
import { useToast } from '../ui/Toast'

const STATUS_TONE = { completed: 'success', overdue: 'danger', today: 'primary', upcoming: 'info' } as const

export function DayDetailModal({ date, occurrences, onClose, onOpenChore }: { date: string | null; occurrences: Occurrence[]; onClose: () => void; onOpenChore: (choreId: string) => void }) {
  const users = useStore((s) => s.users)
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()
  const today = todayISO()

  return (
    <Modal open={!!date} onClose={onClose} title={date ? friendlyDate(date) : ''} size="sm">
      {occurrences.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nothing scheduled this day.</p>
      ) : (
        <div className="space-y-2">
          {occurrences.map((o) => {
            const assignee = users.find((u) => u.id === o.chore.assigneeId)
            return (
              <div key={o.chore.id} className="flex items-center gap-2.5 rounded-xl border border-border p-2.5">
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
                {assignee && <Avatar emoji={assignee.avatarEmoji} color={assignee.color} size={24} />}
                <Pill tone={STATUS_TONE[o.status]}>{o.status}</Pill>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
