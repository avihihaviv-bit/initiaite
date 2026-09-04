import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select, TextArea, TextInput } from '../ui/Select'
import { SegmentedControl } from '../ui/Tabs'
import { EmojiPicker } from './EmojiPicker'
import { RecurrencePicker } from './RecurrencePicker'
import { useStore } from '../../store/useStore'
import type { Chore, Difficulty, Priority, RecurrenceRule } from '../../types'
import { suggestedPoints, suggestedXP } from '../../lib/gamification'
import { todayISO } from '../../lib/date'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
  editChore?: Chore | null
  defaultDate?: string
}

const PRIORITIES: { id: Priority; label: string; emoji: string }[] = [
  { id: 'low', label: 'Low', emoji: '🟢' },
  { id: 'medium', label: 'Medium', emoji: '🟡' },
  { id: 'high', label: 'High', emoji: '🟠' },
  { id: 'urgent', label: 'Urgent', emoji: '🔴' },
]
const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

function emptyRecurrence(): RecurrenceRule {
  return { frequency: 'none', startDate: todayISO(), daysOfWeek: [] }
}

export function ChoreFormModal({ open, onClose, editChore, defaultDate }: Props) {
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const chores = useStore((s) => s.chores)
  const addChore = useStore((s) => s.addChore)
  const updateChore = useStore((s) => s.updateChore)
  const { show } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🧹')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [xp, setXp] = useState(20)
  const [points, setPoints] = useState(16)
  const [xpTouched, setXpTouched] = useState(false)
  const [dueDate, setDueDate] = useState(defaultDate ?? todayISO())
  const [dueTime, setDueTime] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(emptyRecurrence())
  const [reminder, setReminder] = useState<Chore['reminder']>('30-before')
  const [dependsOn, setDependsOn] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    if (editChore) {
      setTitle(editChore.title)
      setDescription(editChore.description ?? '')
      setEmoji(editChore.emoji)
      setCategoryId(editChore.categoryId)
      setAssigneeId(editChore.assigneeId ?? '')
      setPriority(editChore.priority)
      setDifficulty(editChore.difficulty)
      setEstimatedMinutes(editChore.estimatedMinutes)
      setXp(editChore.xp)
      setPoints(editChore.points)
      setXpTouched(true)
      setDueDate(editChore.dueDate)
      setDueTime(editChore.dueTime ?? '')
      setRecurrence(editChore.recurrence)
      setReminder(editChore.reminder ?? 'none')
      setDependsOn(editChore.dependsOn)
    } else {
      setTitle('')
      setDescription('')
      setEmoji('🧹')
      setCategoryId(categories[0]?.id ?? '')
      setAssigneeId('')
      setPriority('medium')
      setDifficulty('medium')
      setEstimatedMinutes(15)
      setXpTouched(false)
      setDueDate(defaultDate ?? todayISO())
      setDueTime('')
      setRecurrence({ ...emptyRecurrence(), startDate: defaultDate ?? todayISO() })
      setReminder('30-before')
      setDependsOn([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editChore])

  useEffect(() => {
    if (xpTouched) return
    const nextXp = suggestedXP(difficulty, estimatedMinutes)
    setXp(nextXp)
    setPoints(suggestedPoints(nextXp))
  }, [difficulty, estimatedMinutes, xpTouched])

  const canSubmit = title.trim().length > 0 && categoryId

  const handleSubmit = () => {
    if (!canSubmit) return
    const payload = {
      title: title.trim(),
      description: description.trim(),
      emoji,
      categoryId,
      assigneeId: assigneeId || null,
      priority,
      difficulty,
      estimatedMinutes,
      points,
      xp,
      dueDate,
      dueTime: dueTime || undefined,
      recurrence: { ...recurrence, startDate: recurrence.startDate || dueDate },
      reminder,
      subtasks: editChore?.subtasks ?? [],
      dependsOn,
      color: categories.find((c) => c.id === categoryId)?.color ?? '#7c5cff',
    }
    if (editChore) {
      updateChore(editChore.id, payload)
      show('Chore updated')
    } else {
      addChore(payload)
      show('Chore created 🎉')
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editChore ? 'Edit chore' : 'New chore'}
      subtitle={editChore ? undefined : 'Add a chore and the app will keep it fair & on track.'}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-ink-faint">+{xp} XP · +{points} pts on completion</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>{editChore ? 'Save changes' : 'Create chore'}</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="flex-1">
            <TextInput label="Name" placeholder="Clean the bathroom" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
        </div>

        <TextArea label="Description / notes" placeholder="Any details worth remembering…" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </Select>
          <Select label="Assigned to" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.avatarEmoji} {u.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Priority</span>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  priority === p.id ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                }`}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <TextInput label="Due time (optional)" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Estimated duration (min)"
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Math.max(1, Number(e.target.value) || 1))}
          />
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Difficulty</span>
            <SegmentedControl options={DIFFICULTIES.map((d) => ({ id: d.id, label: d.label }))} value={difficulty} onChange={(v) => setDifficulty(v as Difficulty)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="XP reward"
            type="number"
            min={1}
            value={xp}
            onChange={(e) => {
              setXpTouched(true)
              const v = Math.max(1, Number(e.target.value) || 1)
              setXp(v)
              setPoints(suggestedPoints(v))
            }}
          />
          <TextInput
            label="Points reward"
            type="number"
            min={1}
            value={points}
            onChange={(e) => {
              setXpTouched(true)
              setPoints(Math.max(1, Number(e.target.value) || 1))
            }}
          />
        </div>

        <RecurrencePicker value={recurrence} onChange={setRecurrence} />

        <Select label="Reminder" value={reminder} onChange={(e) => setReminder(e.target.value as Chore['reminder'])}>
          <option value="none">No reminder</option>
          <option value="at-time">At due time</option>
          <option value="15-before">15 min before</option>
          <option value="30-before">30 min before</option>
          <option value="1h-before">1 hour before</option>
        </Select>

        {chores.length > 0 && (
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Depends on (optional)</span>
            <div className="flex flex-wrap gap-1.5">
              {chores
                .filter((c) => c.id !== editChore?.id && !c.archived)
                .slice(0, 12)
                .map((c) => {
                  const active = dependsOn.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setDependsOn((prev) => (active ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                      }
                      className={`focus-ring rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        active ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      {c.emoji} {c.title}
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
