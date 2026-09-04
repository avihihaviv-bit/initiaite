import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { TextArea, TextInput } from '../ui/Select'
import { EmojiPicker } from '../chores/EmojiPicker'
import { useStore } from '../../store/useStore'
import type { Reward } from '../../types'
import { useToast } from '../ui/Toast'

export function RewardFormModal({ open, onClose, editReward }: { open: boolean; onClose: () => void; editReward?: Reward | null }) {
  const addReward = useStore((s) => s.addReward)
  const updateReward = useStore((s) => s.updateReward)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const { show } = useToast()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState(100)
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [limited, setLimited] = useState(false)
  const [stock, setStock] = useState(1)

  useEffect(() => {
    if (!open) return
    if (editReward) {
      setName(editReward.name)
      setEmoji(editReward.emoji)
      setDescription(editReward.description)
      setCost(editReward.cost)
      setRequiresApproval(editReward.requiresApproval)
      setLimited(editReward.availability === 'limited')
      setStock(editReward.stock ?? 1)
    } else {
      setName('')
      setEmoji('🎁')
      setDescription('')
      setCost(100)
      setRequiresApproval(true)
      setLimited(false)
      setStock(1)
    }
  }, [open, editReward])

  const submit = () => {
    if (!name.trim()) return
    const payload = {
      name: name.trim(),
      emoji,
      description: description.trim(),
      cost,
      requiresApproval,
      availability: limited ? ('limited' as const) : ('always' as const),
      stock: limited ? stock : undefined,
      createdBy: currentUserId ?? 'u-mom',
    }
    if (editReward) updateReward(editReward.id, payload)
    else addReward(payload)
    show(editReward ? 'Reward updated' : 'Reward added to the shop 🎁')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editReward ? 'Edit reward' : 'New reward'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={submit}>{editReward ? 'Save changes' : 'Add reward'}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <div className="flex-1">
            <TextInput label="Reward name" placeholder="30 min extra gaming" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
        </div>
        <TextArea label="Description" rows={2} placeholder="What does redeeming this get you?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextInput label="Cost (points)" type="number" min={1} value={cost} onChange={(e) => setCost(Math.max(1, Number(e.target.value) || 1))} />
        <label className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
          <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary-500)]" />
          <span className="text-sm font-medium text-ink">Requires parent/admin approval</span>
        </label>
        <label className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
          <input type="checkbox" checked={limited} onChange={(e) => setLimited(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary-500)]" />
          <span className="text-sm font-medium text-ink">Limited availability</span>
        </label>
        {limited && <TextInput label="Stock" type="number" min={1} value={stock} onChange={(e) => setStock(Math.max(1, Number(e.target.value) || 1))} />}
      </div>
    </Modal>
  )
}
