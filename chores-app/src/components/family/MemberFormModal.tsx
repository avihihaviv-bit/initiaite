import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select, TextInput } from '../ui/Select'
import { useStore } from '../../store/useStore'
import type { Role } from '../../types'
import { useToast } from '../ui/Toast'

const AVATAR_OPTIONS = ['👦', '👧', '👩', '👨', '🧑', '👵', '👴', '🐱', '🐶', '🦄']
const COLOR_OPTIONS = ['#7c5cff', '#ff6bd6', '#2f8fef', '#ff9f0a', '#33c17a', '#f0403f']

export function MemberFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMember = useStore((s) => s.addMember)
  const { show } = useToast()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0])
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [role, setRole] = useState<Role>('member')

  const reset = () => {
    setName('')
    setAvatar(AVATAR_OPTIONS[0])
    setColor(COLOR_OPTIONS[0])
    setRole('member')
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Add family member"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              addMember(name.trim(), avatar, color, role)
              show(`${name.trim()} joined the household 🎉`)
              onClose()
              reset()
            }}
          >
            Add member
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <TextInput label="Name" placeholder="e.g. Grandma" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Avatar</span>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${avatar === a ? 'border-primary-400 bg-primary-50' : 'border-border bg-surface hover:bg-surface-2'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Color</span>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full border-2 transition"
                style={{ background: c, borderColor: color === c ? c : 'transparent', boxShadow: color === c ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${c}` : 'none' }}
              />
            ))}
          </div>
        </div>
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="admin">Admin / Parent</option>
          <option value="member">Member</option>
          <option value="child">Child</option>
          <option value="guest">Guest</option>
        </Select>
      </div>
    </Modal>
  )
}
