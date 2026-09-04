import { useState } from 'react'
import { Bell, Palette, Plus, RotateCcw, Tag, Trash2, Users2, Sparkles as SparklesIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Switch } from '../components/ui/Switch'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { MemberFormModal } from '../components/family/MemberFormModal'
import { EmojiPicker } from '../components/chores/EmojiPicker'
import { Select, TextInput } from '../components/ui/Select'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import type { Role } from '../types'

export default function Settings() {
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const settings = useStore((s) => s.settings)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const updateSettings = useStore((s) => s.updateSettings)
  const updateNotificationSettings = useStore((s) => s.updateNotificationSettings)
  const updateMember = useStore((s) => s.updateMember)
  const removeMember = useStore((s) => s.removeMember)
  const addCategory = useStore((s) => s.addCategory)
  const resetDemoData = useStore((s) => s.resetDemoData)
  const { show } = useToast()

  const [memberModal, setMemberModal] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📦')

  const currentUser = users.find((u) => u.id === currentUserId)
  const isAdmin = currentUser?.role === 'admin'
  const n = settings.notifications

  return (
    <div className="max-w-2xl space-y-6 animate-[var(--animate-in)]">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-soft">Make Homebase feel like yours.</p>
      </div>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 font-display text-sm font-bold text-ink"><Palette size={15} /> Appearance</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Theme</p>
            <p className="text-xs text-ink-faint">Light, dark, or match your system</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-1 divide-y divide-border">
          <Switch checked={settings.confetti} onChange={(v) => updateSettings({ confetti: v })} label="Confetti celebrations" description="Show confetti on level ups and badges" />
          <Switch checked={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Haptic feedback" description="Vibrate on completions (supported devices)" />
        </div>
      </Card>

      <Card>
        <p className="mb-1 flex items-center gap-1.5 font-display text-sm font-bold text-ink"><Bell size={15} /> Notifications</p>
        <p className="mb-2 text-xs text-ink-faint">Smart reminders, without the spam.</p>
        <div className="divide-y divide-border">
          <Switch checked={n.choreReminders} onChange={(v) => updateNotificationSettings({ choreReminders: v })} label="Chore reminders" description="Before something is due" />
          <Switch checked={n.overdueAlerts} onChange={(v) => updateNotificationSettings({ overdueAlerts: v })} label="Overdue alerts" />
          <Switch checked={n.streakNudges} onChange={(v) => updateNotificationSettings({ streakNudges: v })} label="Streak nudges" description="A gentle push to protect your streak" />
          <Switch checked={n.levelUps} onChange={(v) => updateNotificationSettings({ levelUps: v })} label="Level ups" />
          <Switch checked={n.rewardUpdates} onChange={(v) => updateNotificationSettings({ rewardUpdates: v })} label="Reward updates" />
          <Switch checked={n.balanceSuggestions} onChange={(v) => updateNotificationSettings({ balanceSuggestions: v })} label="Balance suggestions" description="Smart chore rebalancing tips" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <TextInput label="Quiet hours start" type="time" value={n.quietHoursStart} onChange={(e) => updateNotificationSettings({ quietHoursStart: e.target.value })} />
          <TextInput label="Quiet hours end" type="time" value={n.quietHoursEnd} onChange={(e) => updateNotificationSettings({ quietHoursEnd: e.target.value })} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-ink"><Users2 size={15} /> Household members</p>
          <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => setMemberModal(true)}>Add</Button>
        </div>
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <Avatar emoji={u.avatarEmoji} color={u.color} size={32} />
              <span className="flex-1 text-sm font-semibold text-ink">
                {u.name} {u.id === currentUserId && <span className="text-xs font-normal text-ink-faint">(you)</span>}
              </span>
              <div className="w-32">
                <Select value={u.role} onChange={(e) => updateMember(u.id, { role: e.target.value as Role })} disabled={!isAdmin} className="!h-8 !text-xs">
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="child">Child</option>
                  <option value="guest">Guest</option>
                </Select>
              </div>
              {isAdmin && (
                <button onClick={() => setRemoveTarget(u.id)} className="focus-ring rounded-lg p-1.5 text-ink-faint hover:bg-danger-100 hover:text-danger-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!isAdmin && <p className="mt-2 text-xs text-ink-faint">Only admins can change roles or remove members.</p>}
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 font-display text-sm font-bold text-ink"><Tag size={15} /> Categories</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink">
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <EmojiPicker value={newCatEmoji} onChange={setNewCatEmoji} />
          <div className="flex-1">
            <TextInput label="New category" placeholder="e.g. Homework" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          </div>
          <Button
            variant="secondary"
            disabled={!newCatName.trim()}
            onClick={() => {
              addCategory(newCatName.trim(), newCatEmoji, '#7c5cff')
              show('Category added')
              setNewCatName('')
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <Card>
        <p className="mb-1 flex items-center gap-1.5 font-display text-sm font-bold text-ink"><SparklesIcon size={15} /> Demo data</p>
        <p className="mb-3 text-xs text-ink-faint">Reset everything back to the sample household — useful for exploring from scratch.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={() => setResetConfirm(true)}>Reset demo data</Button>
          <Button variant="ghost" onClick={() => updateSettings({ onboardingComplete: false })}>Redo setup wizard</Button>
        </div>
      </Card>

      <MemberFormModal open={memberModal} onClose={() => setMemberModal(false)} />
      <ConfirmDialog
        open={!!removeTarget}
        title="Remove member?"
        description="Their chores will become unassigned."
        confirmLabel="Remove"
        danger
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMember(removeTarget)}
      />
      <ConfirmDialog
        open={resetConfirm}
        title="Reset all data?"
        description="This replaces your chores, family, and progress with the sample household. This can't be undone."
        confirmLabel="Reset"
        danger
        onClose={() => setResetConfirm(false)}
        onConfirm={() => {
          resetDemoData()
          show('Demo data reset', { tone: 'info' })
        }}
      />
    </div>
  )
}
