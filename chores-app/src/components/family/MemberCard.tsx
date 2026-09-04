import { useMemo } from 'react'
import { Flame, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { ProgressBar } from '../ui/ProgressBar'
import { Pill } from '../ui/Pill'
import type { StreakInfo, User } from '../../types'
import { levelFromXP, badgeDef } from '../../lib/gamification'
import { useStore } from '../../store/useStore'

const ROLE_LABEL: Record<User['role'], string> = { admin: 'Admin', member: 'Member', child: 'Child', guest: 'Guest' }

export function MemberCard({ user, streak, sharePct, weeklyCount, onRemove }: { user: User; streak?: StreakInfo; sharePct: number; weeklyCount: number; onRemove: () => void }) {
  const allEarnedBadges = useStore((s) => s.earnedBadges)
  const earnedBadges = useMemo(() => allEarnedBadges.filter((b) => b.userId === user.id), [allEarnedBadges, user.id])
  const chores = useStore((s) => s.chores)
  const totalCompleted = chores.reduce((sum, c) => sum + c.history.filter((h) => h.completedBy === user.id).length, 0)
  const { level, intoLevel, forNext } = levelFromXP(user.xp)

  return (
    <Card className="group flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar emoji={user.avatarEmoji} color={user.color} size={48} />
          <div>
            <p className="font-display text-base font-extrabold text-ink">{user.name}</p>
            <p className="text-xs font-semibold text-ink-faint">{ROLE_LABEL[user.role]} · Level {level}</p>
          </div>
        </div>
        <button onClick={onRemove} className="focus-ring rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-100 hover:text-danger-500" aria-label={`Remove ${user.name}`}>
          <Trash2 size={14} />
        </button>
      </div>

      <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={6} />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface-2 py-2.5">
          <p className="font-display text-lg font-extrabold text-ink">{totalCompleted}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Done</p>
        </div>
        <div className="rounded-xl bg-surface-2 py-2.5">
          <p className="flex items-center justify-center gap-0.5 font-display text-lg font-extrabold text-ink">
            <Flame size={14} className="text-accent-500" />{streak?.current ?? 0}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Streak</p>
        </div>
        <div className="rounded-xl bg-surface-2 py-2.5">
          <p className="font-display text-lg font-extrabold text-ink">{user.points}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Points</p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-soft">
          <span>This week's share</span>
          <span>{sharePct}% · {weeklyCount} chores</span>
        </div>
        <ProgressBar value={sharePct} height={7} colorClassName="bg-gradient-to-r from-primary-400 to-primary-600" />
      </div>

      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {earnedBadges.slice(0, 5).map((b) => (
            <Pill key={b.badgeId} tone="neutral" className="!px-2">
              <span title={badgeDef(b.badgeId).name}>{badgeDef(b.badgeId).emoji}</span>
            </Pill>
          ))}
          {earnedBadges.length > 5 && <Pill tone="neutral">+{earnedBadges.length - 5}</Pill>}
        </div>
      )}
    </Card>
  )
}
