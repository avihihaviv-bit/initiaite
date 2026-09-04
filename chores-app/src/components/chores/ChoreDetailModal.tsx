import { useState } from 'react'
import { Camera, Check, MessageCircle, Plus, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Pill } from '../ui/Pill'
import { Avatar } from '../ui/Avatar'
import { Select } from '../ui/Select'
import { ProgressBar } from '../ui/ProgressBar'
import type { Chore } from '../../types'
import { useStore } from '../../store/useStore'
import { describeRecurrence } from '../../lib/recurrence'
import { formatTime, friendlyDate, timeAgo, todayISO } from '../../lib/date'
import { effectiveDueDate, isCompletedOn } from '../../lib/occurrence'
import { useToast } from '../ui/Toast'

const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' } as const
const EMOJI_BEFORE = ['🌪', '🧦', '📦', '🍕']
const EMOJI_AFTER = ['✨', '🌟', '🧼', '💎']

export function ChoreDetailModal({ chore, onClose, onEdit }: { chore: Chore | null; onClose: () => void; onEdit: () => void }) {
  const [commentText, setCommentText] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const chores = useStore((s) => s.chores)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const toggleSubtask = useStore((s) => s.toggleSubtask)
  const addSubtask = useStore((s) => s.addSubtask)
  const removeSubtask = useStore((s) => s.removeSubtask)
  const addComment = useStore((s) => s.addComment)
  const addPhoto = useStore((s) => s.addPhoto)
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()

  const [completeAs, setCompleteAs] = useState<string>('')

  if (!chore) return null

  const assignees = users.filter((u) => chore.assigneeIds.includes(u.id))
  const category = categories.find((c) => c.id === chore.categoryId)
  const today = todayISO()
  const dueDate = effectiveDueDate(chore, today)
  const doneToday = isCompletedOn(chore, dueDate)
  const defaultCompleter =
    (currentUserId && chore.assigneeIds.includes(currentUserId) ? currentUserId : chore.assigneeIds[0]) ?? currentUserId ?? ''
  const subtaskDone = chore.subtasks.filter((s) => s.done).length
  const deps = chore.dependsOn.map((id) => chores.find((c) => c.id === id)).filter(Boolean) as Chore[]
  const before = chore.photos.filter((p) => p.kind === 'before')
  const after = chore.photos.filter((p) => p.kind === 'after')

  return (
    <Modal
      open={!!chore}
      onClose={onClose}
      size="lg"
      title={`${chore.emoji} ${chore.title}`}
      subtitle={category ? `${category.emoji} ${category.name}` : undefined}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={onEdit}>Edit chore</Button>
          {!doneToday ? (
            <div className="flex items-center gap-2">
              {assignees.length > 1 && (
                <div className="w-36">
                  <Select value={completeAs || defaultCompleter} onChange={(e) => setCompleteAs(e.target.value)} className="!h-9 !text-xs" aria-label="Complete as">
                    {assignees.map((u) => (
                      <option key={u.id} value={u.id}>{u.avatarEmoji} {u.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              <Button
                variant="success"
                icon={<Check size={16} />}
                onClick={() => {
                  completeChore(chore.id, undefined, undefined, completeAs || defaultCompleter || undefined)
                  show('Marked complete!')
                }}
              >
                Mark complete
              </Button>
            </div>
          ) : (
            <Pill tone="success">✓ Completed today</Pill>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={PRIORITY_TONE[chore.priority]}>{chore.priority} priority</Pill>
          <Pill tone="neutral">{chore.estimatedMinutes} min</Pill>
          <Pill tone="neutral">{describeRecurrence(chore.recurrence)}</Pill>
          {chore.dueTime && <Pill tone="neutral">Due {formatTime(chore.dueTime)}</Pill>}
          <Pill tone="neutral">+{chore.xp} XP · +{chore.points} pts</Pill>
          {assignees.length > 1 && <Pill tone="primary">🤝 Shared</Pill>}
        </div>

        {chore.description && <p className="text-sm leading-relaxed text-ink-soft">{chore.description}</p>}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Assigned to</p>
            {assignees.length > 0 ? (
              <div className="mt-1.5 space-y-1.5">
                {assignees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Avatar emoji={a.avatarEmoji} color={a.color} size={26} />
                    <span className="font-semibold text-ink">{a.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 font-semibold text-ink-faint">Unassigned</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Next due</p>
            <p className="mt-1.5 font-semibold text-ink">{friendlyDate(dueDate)}</p>
          </div>
        </div>

        {deps.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Depends on</p>
            <div className="flex flex-wrap gap-1.5">
              {deps.map((d) => {
                const done = d.history.some((h) => h.occurrenceDate === today)
                return (
                  <Pill key={d.id} tone={done ? 'success' : 'neutral'}>
                    {done ? '✓' : '○'} {d.emoji} {d.title}
                  </Pill>
                )
              })}
            </div>
          </div>
        )}

        {chore.subtasks.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Subtasks</p>
              <span className="text-xs font-semibold text-ink-faint">{subtaskDone}/{chore.subtasks.length} completed</span>
            </div>
            <ProgressBar value={(subtaskDone / chore.subtasks.length) * 100} className="mb-3" height={6} />
            <div className="space-y-1.5">
              {chore.subtasks.map((st) => (
                <div key={st.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-surface-2">
                  <button
                    onClick={() => toggleSubtask(chore.id, st.id)}
                    className={clsx(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
                      st.done ? 'border-success-500 bg-success-500 text-white' : 'border-border text-transparent'
                    )}
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className={clsx('flex-1 text-sm text-ink', st.done && 'text-ink-faint line-through')}>{st.title}</span>
                  <button onClick={() => removeSubtask(chore.id, st.id)} className="opacity-0 transition group-hover:opacity-100">
                    <Trash2 size={13} className="text-ink-faint hover:text-danger-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSubtask.trim()) {
                addSubtask(chore.id, newSubtask.trim())
                setNewSubtask('')
              }
            }}
            placeholder="Add a subtask…"
            className="focus-ring h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              if (!newSubtask.trim()) return
              addSubtask(chore.id, newSubtask.trim())
              setNewSubtask('')
            }}
          >
            Add
          </Button>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <Camera size={13} /> Before / After
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-ink-faint">Before</p>
              <div className="flex flex-wrap gap-1.5">
                {before.map((p) => (
                  <span key={p.id} className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-2 text-2xl">{p.emoji}</span>
                ))}
                <button
                  onClick={() => addPhoto(chore.id, 'before', EMOJI_BEFORE[before.length % EMOJI_BEFORE.length])}
                  className="focus-ring flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border text-ink-faint transition hover:border-primary-400 hover:text-primary-500"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-ink-faint">After</p>
              <div className="flex flex-wrap gap-1.5">
                {after.map((p) => (
                  <span key={p.id} className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-2 text-2xl">{p.emoji}</span>
                ))}
                <button
                  onClick={() => addPhoto(chore.id, 'after', EMOJI_AFTER[after.length % EMOJI_AFTER.length])}
                  className="focus-ring flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border text-ink-faint transition hover:border-primary-400 hover:text-primary-500"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <MessageCircle size={13} /> Comments
          </p>
          <div className="space-y-2.5">
            {chore.comments.map((c) => {
              const author = users.find((u) => u.id === c.authorId)
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  {author && <Avatar emoji={author.avatarEmoji} color={author.color} size={26} />}
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2">
                    <p className="text-[13px] font-bold text-ink">{author?.name ?? 'Someone'} <span className="ml-1 text-[11px] font-normal text-ink-faint">{timeAgo(c.createdAt)}</span></p>
                    <p className="text-sm text-ink-soft">{c.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-2.5 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim() && currentUserId) {
                  addComment(chore.id, commentText.trim(), currentUserId)
                  setCommentText('')
                }
              }}
              placeholder="Leave a note for the family…"
              className="focus-ring h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-sm"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!commentText.trim() || !currentUserId) return
                addComment(chore.id, commentText.trim(), currentUserId)
                setCommentText('')
              }}
            >
              Send
            </Button>
          </div>
        </div>

        {chore.history.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Completion history</p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {[...chore.history].reverse().slice(0, 10).map((h) => {
                const who = users.find((u) => u.id === h.completedBy)
                return (
                  <div key={h.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2">
                    <span className="flex items-center gap-2 font-medium text-ink-soft">
                      {who && <Avatar emoji={who.avatarEmoji} color={who.color} size={20} />}
                      {friendlyDate(h.occurrenceDate)} · {who?.name ?? 'Someone'}
                    </span>
                    <span className="font-bold text-success-500">+{h.xpEarned} XP</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
