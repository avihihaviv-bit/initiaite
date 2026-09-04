import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles, Users } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { TextArea, TextInput } from '../ui/Select'
import { EmojiPicker } from './EmojiPicker'
import { RecurrencePicker } from './RecurrencePicker'
import { useStore } from '../../store/useStore'
import type { Priority, RecurrenceRule } from '../../types'
import { suggestedPoints } from '../../lib/gamification'
import { addDays, formatTime, friendlyDate, todayISO, WEEKDAY_LABELS } from '../../lib/date'
import { describeRecurrence } from '../../lib/recurrence'
import { suggestTime } from '../../lib/scheduling'
import { useToast } from '../ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultUserId?: string
}

const STEPS = ['What', 'Who', 'When', 'Repeat', 'Reward', 'Confirm']

const DURATIONS = [5, 10, 15, 20, 30, 45, 60]
const XP_OPTIONS = [5, 10, 20, 30, 50, 100]
const PRIORITIES: { id: Priority; label: string; emoji: string }[] = [
  { id: 'low', label: 'Low', emoji: '🟢' },
  { id: 'medium', label: 'Medium', emoji: '🟡' },
  { id: 'high', label: 'High', emoji: '🟠' },
  { id: 'urgent', label: 'Urgent', emoji: '🔴' },
]

function emptyRecurrence(startDate: string): RecurrenceRule {
  return { frequency: 'none', startDate, daysOfWeek: [] }
}

export function ChoreWizard({ open, onClose, defaultDate, defaultUserId }: Props) {
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const chores = useStore((s) => s.chores)
  const addChore = useStore((s) => s.addChore)
  const { show } = useToast()

  const [step, setStep] = useState(0)

  // Step 1 — What
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🧹')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')

  // Step 2 — Who
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(defaultUserId ? [defaultUserId] : [])
  const [assignMode, setAssignMode] = useState<'shared' | 'separate'>('shared')

  // Step 3 — When
  const [dueDate, setDueDate] = useState(defaultDate ?? todayISO())
  const [dueTime, setDueTime] = useState('')
  const [noSpecificTime, setNoSpecificTime] = useState(true)
  const [estimatedMinutes, setEstimatedMinutes] = useState(15)
  const [customDuration, setCustomDuration] = useState('')

  // Step 4 — Repeat
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(emptyRecurrence(defaultDate ?? todayISO()))

  // Step 5 — Priority + Reward
  const [priority, setPriority] = useState<Priority>('medium')
  const [xp, setXp] = useState(20)
  const [customXp, setCustomXp] = useState('')

  useEffect(() => {
    if (!open) return
    const start = defaultDate ?? todayISO()
    setStep(0)
    setTitle('')
    setDescription('')
    setEmoji('🧹')
    setCategoryId(categories[0]?.id ?? '')
    setSelectedUserIds(defaultUserId ? [defaultUserId] : [])
    setAssignMode('shared')
    setDueDate(start)
    setDueTime('')
    setNoSpecificTime(true)
    setEstimatedMinutes(15)
    setCustomDuration('')
    setRecurrence(emptyRecurrence(start))
    setPriority('medium')
    setXp(20)
    setCustomXp('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const category = categories.find((c) => c.id === categoryId)
  const assignees = users.filter((u) => selectedUserIds.includes(u.id))

  const canProceed = [
    title.trim().length > 0 && !!categoryId, // What
    true, // Who — unassigned is allowed
    !!dueDate && (noSpecificTime || !!dueTime), // When
    true, // Repeat
    true, // Reward
    true, // Confirm
  ][step]

  const applySuggestion = () => {
    const suggestion = suggestTime(chores, selectedUserIds, dueDate, estimatedMinutes)
    setDueTime(suggestion.time)
    setNoSpecificTime(false)
    show(`Suggested ${formatTime(suggestion.time)} — ${suggestion.reason}`, { tone: 'info' })
  }

  const handleSubmit = () => {
    const finalXp = customXp ? Math.max(1, Number(customXp) || xp) : xp
    const basePayload = {
      title: title.trim(),
      description: description.trim(),
      emoji,
      categoryId,
      priority,
      difficulty: 'medium' as const,
      estimatedMinutes,
      points: suggestedPoints(finalXp),
      xp: finalXp,
      dueDate,
      dueTime: noSpecificTime ? undefined : dueTime,
      recurrence: { ...recurrence, startDate: recurrence.startDate || dueDate },
      reminder: noSpecificTime ? ('none' as const) : ('30-before' as const),
      subtasks: [],
      dependsOn: [],
      color: category?.color ?? '#7c5cff',
    }

    if (selectedUserIds.length > 1 && assignMode === 'separate') {
      selectedUserIds.forEach((id) => addChore({ ...basePayload, assigneeIds: [id] }))
      show(`Created ${selectedUserIds.length} chores — one per person 🎉`)
    } else {
      addChore({ ...basePayload, assigneeIds: selectedUserIds })
      show('Chore created 🎉')
    }
    onClose()
  }

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New chore"
      subtitle={`Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-5 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-border'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={goBack}>Back</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button iconRight={<ArrowRight size={15} />} disabled={!canProceed} onClick={goNext}>Continue</Button>
            ) : (
              <Button icon={<Check size={15} />} onClick={handleSubmit}>Assign Chore</Button>
            )}
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="min-h-[360px]"
        >
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <EmojiPicker value={emoji} onChange={setEmoji} />
                <div className="flex-1">
                  <TextInput label="Chore name" placeholder="Clean bedroom" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </div>
              </div>
              <TextArea label="Description (optional)" placeholder="Any details worth remembering…" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        categoryId === c.id ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-soft">Who's doing this? Pick one person, several, or leave it open.</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {users.map((u) => {
                  const active = selectedUserIds.includes(u.id)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() =>
                        setSelectedUserIds((prev) => (active ? prev.filter((id) => id !== u.id) : [...prev, u.id]))
                      }
                      className={`focus-ring flex flex-col items-center gap-2 rounded-2xl border p-3.5 transition ${
                        active ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-border bg-surface hover:bg-surface-2'
                      }`}
                    >
                      <Avatar emoji={u.avatarEmoji} color={u.color} size={40} />
                      <span className="text-sm font-bold text-ink">{u.name}</span>
                      {active && <Check size={14} className="text-primary-500" />}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserIds(selectedUserIds.length === users.length ? [] : users.map((u) => u.id))}
                className="focus-ring flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline"
              >
                <Users size={13} /> {selectedUserIds.length === users.length ? 'Clear all' : 'Assign to everyone'}
              </button>

              {selectedUserIds.length > 1 && (
                <div className="rounded-2xl border border-border bg-surface-2 p-3.5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">How should this be split?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignMode('shared')}
                      className={`focus-ring flex-1 rounded-xl border p-2.5 text-left transition ${assignMode === 'shared' ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-border bg-surface'}`}
                    >
                      <span className="block text-sm font-bold text-ink">🤝 Shared responsibility</span>
                      <span className="block text-xs text-ink-faint">One chore — anyone can complete it</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode('separate')}
                      className={`focus-ring flex-1 rounded-xl border p-2.5 text-left transition ${assignMode === 'separate' ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'border-border bg-surface'}`}
                    >
                      <span className="block text-sm font-bold text-ink">📋 Assigned separately</span>
                      <span className="block text-xs text-ink-faint">Each person gets their own copy</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Select day</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Today', date: todayISO() },
                    { label: 'Tomorrow', date: addDays(todayISO(), 1) },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setDueDate(opt.date)}
                      className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        dueDate === opt.date ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {Array.from({ length: 5 }, (_, i) => addDays(todayISO(), i + 2)).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDueDate(d)}
                      className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        dueDate === d ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      {WEEKDAY_LABELS[new Date(d).getDay()]}
                    </button>
                  ))}
                </div>
                <div className="mt-2 w-48">
                  <TextInput label="Or pick an exact date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <p className="mt-1.5 text-xs font-semibold text-ink-faint">{friendlyDate(dueDate)}</p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="block text-xs font-semibold text-ink-soft">Select time</span>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
                    <input type="checkbox" checked={noSpecificTime} onChange={(e) => setNoSpecificTime(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--color-primary-500)]" />
                    No specific time
                  </label>
                </div>
                {!noSpecificTime && (
                  <div className="flex items-end gap-2">
                    <div className="w-36">
                      <TextInput type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                    </div>
                    <Button variant="secondary" size="sm" icon={<Sparkles size={13} />} onClick={applySuggestion}>Suggest best time</Button>
                  </div>
                )}
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Duration</span>
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setEstimatedMinutes(d)
                        setCustomDuration('')
                      }}
                      className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        estimatedMinutes === d && !customDuration ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      {d < 60 ? `${d} min` : '1 hour'}
                    </button>
                  ))}
                  <input
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.value)
                      const n = Number(e.target.value)
                      if (n > 0) setEstimatedMinutes(n)
                    }}
                    placeholder="Custom"
                    className="focus-ring w-20 rounded-xl border border-border bg-surface px-2 text-xs font-bold text-ink placeholder:font-normal placeholder:text-ink-faint"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-ink-soft">How often does this need doing?</p>
              <RecurrencePicker value={recurrence} onChange={setRecurrence} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
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
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-soft">XP reward</span>
                <div className="flex flex-wrap gap-1.5">
                  {XP_OPTIONS.map((x) => (
                    <button
                      key={x}
                      type="button"
                      onClick={() => {
                        setXp(x)
                        setCustomXp('')
                      }}
                      className={`focus-ring rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        xp === x && !customXp ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
                      }`}
                    >
                      ⭐ {x}
                    </button>
                  ))}
                  <input
                    value={customXp}
                    onChange={(e) => setCustomXp(e.target.value)}
                    placeholder="Custom"
                    className="focus-ring w-20 rounded-xl border border-border bg-surface px-2 text-xs font-bold text-ink placeholder:font-normal placeholder:text-ink-faint"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-faint">+{suggestedPoints(customXp ? Number(customXp) || xp : xp)} points on completion</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-faint">Chore summary</p>
              <div className="space-y-3 rounded-2xl border border-border bg-surface-2 p-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <p className="font-display text-lg font-extrabold text-ink">{title || 'Untitled chore'}</p>
                    {category && <p className="text-xs text-ink-faint">{category.emoji} {category.name}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-ink-soft">
                    {assignees.length > 0 ? <Avatar emoji={assignees[0].avatarEmoji} color={assignees[0].color} size={20} /> : null}
                    {assignees.length === 0 ? 'Unassigned' : assignees.map((a) => a.name).join(', ')}
                    {selectedUserIds.length > 1 && assignMode === 'separate' && <span className="text-xs text-ink-faint">(separate)</span>}
                  </div>
                  <div className="text-ink-soft">📅 {friendlyDate(dueDate)}</div>
                  <div className="text-ink-soft">⏰ {noSpecificTime ? 'No specific time' : formatTime(dueTime)}</div>
                  <div className="text-ink-soft">⏱ {estimatedMinutes} minutes</div>
                  <div className="text-ink-soft">⭐ +{customXp ? Number(customXp) || xp : xp} XP</div>
                  <div className="text-ink-soft">🔁 {describeRecurrence(recurrence)}</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  )
}
