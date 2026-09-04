import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, Clock3, Copy, Pencil, SkipForward, Timer, Undo2 } from 'lucide-react'
import type { Chore } from '../../types'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/Toast'
import { todayISO } from '../../lib/date'
import { effectiveDueDate, isCompletedOn } from '../../lib/occurrence'

export function ChoreActionsMenu({
  chore,
  open,
  onClose,
  onEdit,
  onStartTimer,
}: {
  chore: Chore
  open: boolean
  onClose: () => void
  onEdit: () => void
  onStartTimer: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const duplicateChore = useStore((s) => s.duplicateChore)
  const archiveChore = useStore((s) => s.archiveChore)
  const snoozeChore = useStore((s) => s.snoozeChore)
  const skipOccurrence = useStore((s) => s.skipOccurrence)
  const undoCompletion = useStore((s) => s.undoCompletion)
  const { show } = useToast()
  const occurrenceDate = effectiveDueDate(chore, todayISO())
  const doneToday = isCompletedOn(chore, occurrenceDate)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  const items = [
    { label: 'Edit', icon: Pencil, onClick: onEdit },
    { label: 'Start timer', icon: Timer, onClick: onStartTimer, hide: doneToday },
    doneToday
      ? { label: 'Undo completion', icon: Undo2, onClick: () => { undoCompletion(chore.id, occurrenceDate); show('Completion undone') } }
      : {
          label: 'Snooze +1 day',
          icon: Clock3,
          onClick: () => { snoozeChore(chore.id, 1); show('Snoozed to tomorrow') },
          hide: chore.recurrence.frequency !== 'none',
        },
    { label: 'Skip this occurrence', icon: SkipForward, onClick: () => { skipOccurrence(chore.id, occurrenceDate); show('Occurrence skipped') }, hide: chore.recurrence.frequency === 'none' },
    { label: 'Duplicate', icon: Copy, onClick: () => { duplicateChore(chore.id); show('Chore duplicated') } },
    { label: 'Archive', icon: Archive, onClick: () => { archiveChore(chore.id); show('Chore archived', { action: { label: 'Undo', onClick: () => useStore.getState().restoreChore(chore.id) } }) }, danger: true },
  ].filter((i) => !i.hide)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.13 }}
          className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition hover:bg-surface-2 ${
                item.danger ? 'text-danger-500' : 'text-ink'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
