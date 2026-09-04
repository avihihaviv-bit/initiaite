import { useMemo, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { MemberCard } from '../components/family/MemberCard'
import { FairnessGauge } from '../components/family/FairnessGauge'
import { SmartBalanceCard } from '../components/family/SmartBalanceCard'
import { MemberFormModal } from '../components/family/MemberFormModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { weeklyWorkload, fairnessScore, suggestRebalance } from '../lib/balance'

export default function Family() {
  const users = useStore((s) => s.users)
  const chores = useStore((s) => s.chores)
  const streaks = useStore((s) => s.streaks)
  const removeMember = useStore((s) => s.removeMember)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)

  const shares = useMemo(() => weeklyWorkload(chores, users), [chores, users])
  const score = useMemo(() => fairnessScore(shares), [shares])
  const suggestion = useMemo(() => suggestRebalance(chores, users), [chores, users])

  const removeUser = users.find((u) => u.id === removeTarget)

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Family</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{users.length} member{users.length === 1 ? '' : 's'} sharing the household</p>
        </div>
        <Button icon={<UserPlus size={16} />} onClick={() => setAddOpen(true)}>Add member</Button>
      </div>

      <Card>
        <FairnessGauge score={score} />
      </Card>

      {suggestion && !suggestionDismissed && <SmartBalanceCard suggestion={suggestion} onReject={() => setSuggestionDismissed(true)} />}

      <Card>
        <p className="mb-4 font-display text-sm font-bold text-ink">This week's balance</p>
        <div className="space-y-3">
          {shares
            .slice()
            .sort((a, b) => b.sharePct - a.sharePct)
            .map((s) => {
              const user = users.find((u) => u.id === s.userId)
              if (!user) return null
              return (
                <div key={s.userId} className="flex items-center gap-3">
                  <Avatar emoji={user.avatarEmoji} color={user.color} size={30} />
                  <span className="w-16 shrink-0 text-sm font-semibold text-ink">{user.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border/70">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.sharePct}%`, background: user.color }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-ink-faint">{s.sharePct}%</span>
                </div>
              )
            })}
        </div>
        <p className="mt-3 text-xs text-ink-faint">Based on points-weighted chores this week — not a competition, just visibility.</p>
      </Card>

      <div>
        <p className="mb-3 font-display text-base font-bold text-ink">Household members</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const share = shares.find((s) => s.userId === u.id)
            return (
              <MemberCard
                key={u.id}
                user={u}
                streak={streaks.find((s) => s.userId === u.id)}
                sharePct={share?.sharePct ?? 0}
                weeklyCount={Math.round(share?.count ?? 0)}
                onRemove={() => setRemoveTarget(u.id)}
              />
            )
          })}
          <button
            onClick={() => setAddOpen(true)}
            className="focus-ring flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-ink-faint transition hover:border-primary-400 hover:text-primary-500"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2"><Plus size={20} /></span>
            <span className="text-sm font-bold">Add family member</span>
          </button>
        </div>
      </div>

      <MemberFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeUser?.name ?? 'member'}?`}
        description="Their chores will become unassigned. This can't be undone."
        confirmLabel="Remove"
        danger
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMember(removeTarget)}
      />
    </div>
  )
}
