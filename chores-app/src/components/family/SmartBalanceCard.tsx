import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import type { BalanceSuggestion } from '../../lib/balance'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/Toast'

export function SmartBalanceCard({ suggestion, onReject }: { suggestion: BalanceSuggestion; onReject: () => void }) {
  const users = useStore((s) => s.users)
  const acceptBalanceSuggestion = useStore((s) => s.acceptBalanceSuggestion)
  const { show } = useToast()
  const from = users.find((u) => u.id === suggestion.fromUserId)
  const to = users.find((u) => u.id === suggestion.toUserId)

  return (
    <Card className="border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-surface dark:border-primary-800 dark:from-primary-900/20">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white shadow-[var(--shadow-glow)]">
          <Sparkles size={18} />
        </span>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-ink">🤖 Smart Balance</p>
          <p className="mt-1 text-sm text-ink-soft">{suggestion.reasoning}</p>
          <div className="mt-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
            {from && <Avatar emoji={from.avatarEmoji} color={from.color} size={26} />}
            <span>{suggestion.choreTitle}</span>
            <span className="text-ink-faint">→</span>
            {to && <Avatar emoji={to.avatarEmoji} color={to.color} size={26} />}
            <span>{to?.name}</span>
          </div>
          <p className="mt-2 text-xs font-bold text-success-500">Fairness: current → {suggestion.projectedFairness}/100</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="success"
              icon={<ThumbsUp size={14} />}
              onClick={() => {
                acceptBalanceSuggestion()
                show('Chore reassigned — fairness improved!')
              }}
            >
              Accept
            </Button>
            <Button size="sm" variant="ghost" icon={<ThumbsDown size={14} />} onClick={onReject}>Not now</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
