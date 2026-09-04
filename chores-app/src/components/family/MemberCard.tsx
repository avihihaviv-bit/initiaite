import { useMemo } from 'react'
import { ChevronRight, Flame, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { Pill } from '../ui/Pill'
import type { StreakInfo, User } from '../../types'
import { levelFromXP, badgeDef } from '../../lib/gamification'
import { useStore } from '../../store/useStore'

const ROLE_LABEL: Record<User['role'], string> = { admin: 'Admin', member: 'Member', child: 'Child', guest: 'Guest' }

export function MemberCard({
  user,
  streak,
  sharePct,
  weeklyCount,
  onRemove,
  onView,
}: {
  user: User
  streak?: StreakInfo
  sharePct: number
  weeklyCount: number
  onRemove: () => void
  onView: () => void
}) {
  const allEarnedBadges = useStore((s) => s.earnedBadges)
  const earnedBadges = useMemo(() => allEarnedBadges.filter((b) => b.userId === user.id), [allEarnedBadges, user.id])
  const chores = useStore((s) => s.chores)

  const { totalCompleted, weeklyCompleted } = useMemo(() => {
    const weekAgoISO = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
    let total = 0
    let completed = 0
    chores.forEach((c) => {
      const mine = c.history.filter((h) => h.completedBy === user.id)
      total += mine.length
      completed += mine.filter((h) => h.occurrenceDate >= weekAgoISO).length
    })
    return { totalCompleted: total, weeklyCompleted: completed }
  }, [chores, user.id])

  const completionRate = weeklyCount > 0 ? Math.min(100, Math.round((weeklyCompleted / weeklyCount) * 100)) : 100
  const { level, intoLevel, forNext } = levelFromXP(user.xp)

  return (
    <Card className="group flex flex-col gap-4" interactive>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onView} className="focus-ring flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar emoji={user.avatarEmoji} color={user.color} size={48} />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold text-ink">{user.name}</p>
            <p className="text-xs font-semibold text-ink-faint">{ROLE_LABEL[user.role]} · Level {level}</p>
          </div>
        </button>
        <button
          onClick={onRemove}
          className="focus-ring shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-100 hover:text-danger-500"
          aria-label={`Remove ${user.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={6} />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface-2 py-2.5">
          <p className="font-display text-lg font-extrabold text-ink">{weeklyCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">This week</p>
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
          <span>{completionRate}% completed this week</span>
          <span>{sharePct}% of household load</span>
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

      <p className="text-center text-xs text-ink-faint">{totalCompleted} chores completed all-time</p>

      <Button variant="secondary" size="sm" iconRight={<ChevronRight size={14} />} onClick={onView} className="w-full">
        <span className="w-full text-center">View Chores</span>
      </Button>
    </Card>
  )
}
