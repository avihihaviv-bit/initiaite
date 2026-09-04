import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Gift, Plus, User, X, Zap } from 'lucide-react'
import { ChoreFormModal } from '../chores/ChoreFormModal'
import { MemberFormModal } from '../family/MemberFormModal'
import { RewardFormModal } from '../rewards/RewardFormModal'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Select'
import { useStore } from '../../store/useStore'
import { todayISO } from '../../lib/date'
import { useToast } from '../ui/Toast'

const ACTIONS = [
  { id: 'chore', label: 'Chore', icon: Plus, color: '#7c5cff' },
  { id: 'quick', label: 'Quick chore', icon: Zap, color: '#ff9f0a' },
  { id: 'member', label: 'Family member', icon: User, color: '#2f8fef' },
  { id: 'reward', label: 'Reward', icon: Gift, color: '#33c17a' },
  { id: 'schedule', label: 'Schedule', icon: Calendar, color: '#ff6bd6' },
] as const

export function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [choreModal, setChoreModal] = useState<'full' | 'quick' | null>(null)
  const [memberModal, setMemberModal] = useState(false)
  const [rewardModal, setRewardModal] = useState(false)
  const navigate = useNavigate()

  const handle = (id: (typeof ACTIONS)[number]['id']) => {
    setOpen(false)
    if (id === 'chore') setChoreModal('full')
    if (id === 'quick') setChoreModal('quick')
    if (id === 'member') setMemberModal(true)
    if (id === 'reward') setRewardModal(true)
    if (id === 'schedule') navigate('/calendar')
  }

  return (
    <>
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-40 lg:bottom-8 lg:right-8">
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5">
              {ACTIONS.map((a, i) => (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handle(a.id)}
                  className="focus-ring flex items-center gap-2.5 rounded-full border border-border bg-surface py-2 pl-3.5 pr-2 shadow-[var(--shadow-lift)]"
                >
                  <span className="text-sm font-bold text-ink">{a.label}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: a.color }}>
                    <a.icon size={15} />
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setOpen((o) => !o)}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: open ? 45 : 0 }}
          className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-[var(--shadow-glow)] transition-colors hover:bg-primary-600"
          aria-label="Quick add"
        >
          {open ? <X size={24} /> : <Plus size={24} />}
        </motion.button>
      </div>

      <ChoreFormModal open={choreModal === 'full'} onClose={() => setChoreModal(null)} />
      {choreModal === 'quick' && <QuickChoreModal onClose={() => setChoreModal(null)} />}
      <MemberFormModal open={memberModal} onClose={() => setMemberModal(false)} />
      <RewardFormModal open={rewardModal} onClose={() => setRewardModal(false)} />
    </>
  )
}

function QuickChoreModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const addChore = useStore((s) => s.addChore)
  const categories = useStore((s) => s.categories)
  const { show } = useToast()

  const submit = () => {
    if (!title.trim()) return
    addChore({
      title: title.trim(),
      description: '',
      emoji: '⚡',
      categoryId: categories[0]?.id ?? 'cat-cleaning',
      assigneeIds: [],
      priority: 'medium',
      difficulty: 'easy',
      estimatedMinutes: 10,
      points: 12,
      xp: 15,
      dueDate: todayISO(),
      recurrence: { frequency: 'none', startDate: todayISO() },
      reminder: 'none',
      subtasks: [],
      dependsOn: [],
      color: '#ff9f0a',
    })
    show('Quick chore added ⚡')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Quick chore"
      subtitle="Just the essentials — add details later if you want."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!title.trim()} onClick={submit}>Add</Button>
        </div>
      }
    >
      <TextInput
        label="What needs doing?"
        placeholder="e.g. Wipe kitchen counter"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </Modal>
  )
}
