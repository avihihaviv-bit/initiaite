import { Lock, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Pill } from '../ui/Pill'
import type { Reward, User } from '../../types'

export function RewardCard({
  reward,
  currentUser,
  isAdmin,
  onRedeem,
  onEdit,
  onDelete,
}: {
  reward: Reward
  currentUser?: User
  isAdmin: boolean
  onRedeem: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const affordable = (currentUser?.points ?? 0) >= reward.cost
  const outOfStock = reward.availability === 'limited' && (reward.stock ?? 0) <= 0

  return (
    <Card className="group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-3xl">{reward.emoji}</span>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={onEdit} aria-label={`Edit ${reward.name}`} className="focus-ring rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink"><Pencil size={13} /></button>
            <button onClick={onDelete} aria-label={`Delete ${reward.name}`} className="focus-ring rounded-lg p-1.5 text-ink-faint hover:bg-danger-100 hover:text-danger-500"><Trash2 size={13} /></button>
          </div>
        )}
      </div>
      <div>
        <p className="font-display text-sm font-bold text-ink">{reward.name}</p>
        {reward.description && <p className="mt-0.5 text-xs text-ink-soft">{reward.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {reward.requiresApproval && (
          <Pill tone="neutral"><ShieldCheck size={11} className="mr-0.5" /> Needs approval</Pill>
        )}
        {reward.availability === 'limited' && (
          <Pill tone={outOfStock ? 'danger' : 'warning'}>{outOfStock ? 'Out of stock' : `${reward.stock} left`}</Pill>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="font-display text-lg font-extrabold text-accent-600">{reward.cost} pts</span>
        <Button
          size="sm"
          disabled={!affordable || outOfStock}
          icon={!affordable ? <Lock size={13} /> : undefined}
          onClick={onRedeem}
          className={clsx(!affordable && 'grayscale')}
        >
          {outOfStock ? 'Unavailable' : affordable ? 'Redeem' : 'Locked'}
        </Button>
      </div>
    </Card>
  )
}
