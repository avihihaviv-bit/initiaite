import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Select, TextInput } from '../ui/Select'
import { useStore } from '../../store/useStore'
import type { Role } from '../../types'
import { suggestAvatarEmoji, type Gender } from '../../lib/avatar'
import { useToast } from '../ui/Toast'

const AVATAR_OPTIONS = ['👦', '👧', '👩', '👨', '🧑', '👵', '👴', '🐱', '🐶', '🦄']
const COLOR_OPTIONS = ['#7c5cff', '#ff6bd6', '#2f8fef', '#ff9f0a', '#33c17a', '#f0403f']

export function MemberFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addMember = useStore((s) => s.addMember)
  const { show } = useToast()
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [avatar, setAvatar] = useState(suggestAvatarEmoji('male'))
  const [avatarTouched, setAvatarTouched] = useState(false)
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [role, setRole] = useState<Role>('member')

  const applyGender = (g: Gender) => {
    setGender(g)
    if (!avatarTouched) setAvatar(suggestAvatarEmoji(g, age ? Number(age) : undefined))
  }
  const applyAge = (value: string) => {
    setAge(value)
    if (!avatarTouched) setAvatar(suggestAvatarEmoji(gender, value ? Number(value) : undefined))
  }

  const reset = () => {
    setName('')
    setGender('male')
    setAge('')
    setAvatar(suggestAvatarEmoji('male'))
    setAvatarTouched(false)
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
              addMember(name.trim(), avatar, color, role, gender, age ? Number(age) : undefined)
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
        <div className="flex flex-col items-center gap-1.5 py-1">
          <span className="text-sm font-bold text-ink">{name.trim() || 'New member'}</span>
          <Avatar emoji={avatar} color={color} size={56} />
        </div>

        <TextInput label="Name" placeholder="e.g. Grandma" value={name} onChange={(e) => setName(e.target.value)} autoFocus />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Gender</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyGender('male')}
                className={`h-10 flex-1 rounded-xl border text-sm font-bold transition ${gender === 'male' ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'}`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => applyGender('female')}
                className={`h-10 flex-1 rounded-xl border text-sm font-bold transition ${gender === 'female' ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'}`}
              >
                Female
              </button>
            </div>
          </div>
          <TextInput
            label="Age"
            type="number"
            min={0}
            max={120}
            placeholder="e.g. 9"
            value={age}
            onChange={(e) => applyAge(e.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Avatar</span>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAvatar(a)
                  setAvatarTouched(true)
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${avatar === a ? 'border-primary-400 bg-primary-50' : 'border-border bg-surface hover:bg-surface-2'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">Auto-suggested from gender and age — pick a different one anytime.</p>
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
