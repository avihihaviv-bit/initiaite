import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, Clock, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'
import type { Chore } from '../../types'
import { useStore } from '../../store/useStore'
import { AvatarStack } from '../ui/AvatarStack'
import { Pill } from '../ui/Pill'
import { formatTime, friendlyDate, todayISO } from '../../lib/date'
import { isBlocked } from '../../lib/priority'
import { effectiveDueDate, isCompletedOn, isOverdue } from '../../lib/occurrence'
import { ChoreActionsMenu } from './ChoreActionsMenu'

const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' } as const

interface Props {
  chore: Chore
  onOpen: () => void
  onEdit: () => void
  onStartTimer: () => void
  compact?: boolean
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function ChoreCard({ chore, onOpen, onEdit, onStartTimer, compact, selectable, selected, onToggleSelect }: Props) {
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const chores = useStore((s) => s.chores)
  const completeChore = useStore((s) => s.completeChore)
  const [menuOpen, setMenuOpen] = useState(false)
  const x = useMotionValue(0)
  const completeOpacity = useTransform(x, [10, 90], [0, 1])
  const actionsOpacity = useTransform(x, [-90, -10], [1, 0])

  const assignees = users.filter((u) => chore.assigneeIds.includes(u.id))
  const category = categories.find((c) => c.id === chore.categoryId)
  const today = todayISO()
  const dueDate = effectiveDueDate(chore, today)
  const doneToday = isCompletedOn(chore, dueDate)
  const blocked = isBlocked(chore, chores)
  const overdue = !doneToday && isOverdue(chore, today)
  const subtaskDone = chore.subtasks.filter((s) => s.done).length

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl bg-surface-2 px-5">
        <motion.span style={{ opacity: completeOpacity }} className="flex items-center gap-1.5 text-sm font-bold text-success-500">
          <Check size={16} /> Complete
        </motion.span>
        <motion.span style={{ opacity: actionsOpacity }} className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          Actions <MoreHorizontal size={16} />
        </motion.span>
      </div>
      <motion.div
        drag={doneToday || selectable ? false : 'x'}
        style={{ x }}
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.15}
        dragSnapToOrigin
        onDragEnd={(_e, info) => {
          if (info.offset.x > 90 && !doneToday && !blocked) completeChore(chore.id)
          else if (info.offset.x < -90) setMenuOpen(true)
        }}
        className={clsx(
          'group relative flex items-center gap-3 rounded-2xl border bg-surface p-3.5 transition-shadow sm:p-4',
          doneToday ? 'border-border/60 opacity-60' : 'border-border hover:shadow-[var(--shadow-soft)]',
          overdue && !doneToday && 'border-danger-400/40',
          selected && 'border-primary-400 ring-2 ring-primary-200'
        )}
      >
        {selectable ? (
          <button
            onClick={onToggleSelect}
            aria-label={selected ? 'Deselect' : 'Select'}
            className={clsx(
              'focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90',
              selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-border text-transparent hover:border-primary-400'
            )}
          >
            <Check size={18} strokeWidth={3} />
          </button>
        ) : (
          <button
            onClick={() => !blocked && completeChore(chore.id)}
            disabled={doneToday || blocked}
            aria-label={doneToday ? 'Completed' : 'Mark complete'}
            className={clsx(
              'focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90',
              doneToday
                ? 'border-success-500 bg-success-500 text-white'
                : blocked
                ? 'cursor-not-allowed border-border text-transparent'
                : 'border-border text-transparent hover:border-primary-400 hover:bg-primary-50'
            )}
          >
            <Check size={18} strokeWidth={3} />
          </button>
        )}

        <button onClick={selectable ? onToggleSelect : onOpen} className="focus-ring flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className={clsx('text-2xl', doneToday && 'grayscale')}>{chore.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className={clsx('block truncate text-sm font-bold text-ink sm:text-[15px]', doneToday && 'line-through decoration-2')}>
              {chore.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> {chore.estimatedMinutes} min</span>
              {chore.dueTime && <span>· {formatTime(chore.dueTime)}</span>}
              {!compact && category && <span>· {category.emoji} {category.name}</span>}
              {chore.subtasks.length > 0 && (
                <span>· {subtaskDone}/{chore.subtasks.length} subtasks</span>
              )}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {!compact && (chore.priority === 'high' || chore.priority === 'urgent') && !doneToday && (
            <Pill tone={PRIORITY_TONE[chore.priority]} className="hidden sm:inline-flex">
              {chore.priority === 'urgent' ? '🔴 Urgent' : '🟠 High'}
            </Pill>
          )}
          {overdue && !doneToday && <Pill tone="danger">Overdue</Pill>}
          {blocked && !doneToday && <Pill tone="neutral">Blocked</Pill>}
          <span className="hidden text-xs font-bold text-accent-600 sm:inline">+{chore.xp} XP</span>
          <AvatarStack users={assignees} size={30} />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition hover:bg-surface-2 hover:text-ink"
              aria-label="More actions"
            >
              <MoreHorizontal size={17} />
            </button>
            <ChoreActionsMenu
              chore={chore}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              onEdit={onEdit}
              onStartTimer={onStartTimer}
            />
          </div>
        </div>
      </motion.div>
      {dueDate !== today && !doneToday && (
        <p className="mt-1 pl-[4.2rem] text-[11px] font-medium text-ink-faint">{friendlyDate(dueDate)}</p>
      )}
    </div>
  )
}
