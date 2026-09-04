import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Pill } from '../components/ui/Pill'
import { EmptyState } from '../components/ui/EmptyState'
import { RewardCard } from '../components/rewards/RewardCard'
import { RewardFormModal } from '../components/rewards/RewardFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { timeAgo } from '../lib/date'
import type { Reward } from '../types'

export default function Rewards() {
  const rewards = useStore((s) => s.rewards)
  const users = useStore((s) => s.users)
  const redemptions = useStore((s) => s.redemptions)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const redeemReward = useStore((s) => s.redeemReward)
  const deleteReward = useStore((s) => s.deleteReward)
  const resolveRedemption = useStore((s) => s.resolveRedemption)
  const { show } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editReward, setEditReward] = useState<Reward | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null)

  const currentUser = users.find((u) => u.id === currentUserId)
  const isAdmin = currentUser?.role === 'admin'
  const pending = redemptions.filter((r) => r.status === 'pending')
  const myHistory = redemptions.filter((r) => r.userId === currentUserId).slice().reverse().slice(0, 6)

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Rewards</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Spend what you've earned on things worth earning.</p>
        </div>
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2">
              <span className="text-lg">⭐</span>
              <span className="font-display text-base font-extrabold text-ink">{currentUser.points}</span>
              <span className="text-xs font-semibold text-ink-faint">points</span>
            </div>
          )}
          {isAdmin && <Button icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>New reward</Button>}
        </div>
      </div>

      {isAdmin && pending.length > 0 && (
        <Card>
          <p className="mb-3 font-display text-sm font-bold text-ink">🕐 Awaiting your approval</p>
          <div className="space-y-2">
            {pending.map((r) => {
              const reward = rewards.find((rw) => rw.id === r.rewardId)
              const user = users.find((u) => u.id === r.userId)
              if (!reward || !user) return null
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                  <Avatar emoji={user.avatarEmoji} color={user.color} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{user.name} wants "{reward.emoji} {reward.name}"</p>
                    <p className="text-xs text-ink-faint">{timeAgo(r.requestedAt)} · {reward.cost} pts</p>
                  </div>
                  <Button size="sm" variant="success" icon={<Check size={14} />} onClick={() => { resolveRedemption(r.id, true); show('Approved!') }}>Approve</Button>
                  <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => { resolveRedemption(r.id, false); show('Denied', { tone: 'info' }) }}>Deny</Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div>
        <p className="mb-3 font-display text-base font-bold text-ink">Reward shop</p>
        {rewards.length === 0 ? (
          <EmptyState emoji="🎁" title="No rewards yet" description="Add something worth working toward." action={isAdmin ? <Button icon={<Plus size={15} />} onClick={() => setFormOpen(true)}>Add a reward</Button> : undefined} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => (
              <RewardCard
                key={r.id}
                reward={r}
                currentUser={currentUser}
                isAdmin={!!isAdmin}
                onEdit={() => setEditReward(r)}
                onDelete={() => setDeleteTarget(r)}
                onRedeem={() => {
                  if (!currentUserId) return
                  const res = redeemReward(r.id, currentUserId)
                  show(res.message, { tone: res.ok ? 'success' : 'error' })
                }}
              />
            ))}
          </div>
        )}
      </div>

      {myHistory.length > 0 && (
        <div>
          <p className="mb-3 font-display text-base font-bold text-ink">Your redemptions</p>
          <div className="space-y-2">
            {myHistory.map((r) => {
              const reward = rewards.find((rw) => rw.id === r.rewardId)
              if (!reward) return null
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span>{reward.emoji}</span> {reward.name}
                  </span>
                  <Pill tone={r.status === 'denied' ? 'danger' : r.status === 'pending' ? 'warning' : 'success'}>{r.status}</Pill>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <RewardFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <RewardFormModal open={!!editReward} onClose={() => setEditReward(null)} editReward={editReward} />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This reward will be removed from the shop."
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteReward(deleteTarget.id)}
      />
    </div>
  )
}
