import { useMemo, useState } from 'react'
import { Flame, Shield } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Pill'
import { BADGES } from '../lib/gamification'
import { useToast } from '../components/ui/Toast'

export default function Streaks() {
  const users = useStore((s) => s.users)
  const streaks = useStore((s) => s.streaks)
  const earnedBadges = useStore((s) => s.earnedBadges)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const activateStreakFreeze = useStore((s) => s.activateStreakFreeze)
  const { show } = useToast()
  const [viewUserId, setViewUserId] = useState<string | null>(currentUserId)

  const viewUser = users.find((u) => u.id === viewUserId) ?? users[0]
  const streak = streaks.find((s) => s.userId === viewUser?.id)
  const myBadgeIds = useMemo(
    () => new Set(earnedBadges.filter((b) => b.userId === viewUser?.id).map((b) => b.badgeId)),
    [earnedBadges, viewUser]
  )

  const sortedStreaks = [...streaks].sort((a, b) => b.current - a.current)

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Streaks & Badges</h1>
        <p className="mt-0.5 text-sm text-ink-soft">Consistency, celebrated.</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setViewUserId(u.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
              viewUser?.id === u.id ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft'
            }`}
          >
            <Avatar emoji={u.avatarEmoji} color={u.color} size={22} /> {u.name}
          </button>
        ))}
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-accent-50 via-surface to-surface text-center dark:from-accent-500/10">
        <div className="flex flex-col items-center py-4">
          <span className="animate-[var(--animate-float)] text-6xl">🔥</span>
          <p className="mt-3 font-display text-4xl font-extrabold text-ink">{streak?.current ?? 0} days</p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {(streak?.current ?? 0) >= 7 ? "You're on fire!" : (streak?.current ?? 0) > 0 ? 'Keep the momentum going' : 'Complete a chore today to start your streak'}
          </p>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div>
              <p className="font-display text-lg font-extrabold text-ink">{streak?.longest ?? 0}</p>
              <p className="text-xs text-ink-faint">Longest streak</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="font-display text-lg font-extrabold text-ink">{myBadgeIds.size}</p>
              <p className="text-xs text-ink-faint">Badges earned</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Shield size={14} />}
            className="mt-4"
            disabled={!streak?.freezeAvailable}
            onClick={() => {
              if (!viewUser) return
              activateStreakFreeze(viewUser.id)
              show('Streak freeze activated — miss a day worry-free 🧊', { tone: 'info' })
            }}
          >
            {streak?.freezeAvailable ? 'Use streak freeze' : 'Freeze used this month'}
          </Button>
        </div>
      </Card>

      <div>
        <p className="mb-3 font-display text-base font-bold text-ink">Household streaks</p>
        <Card padding="sm">
          <div className="divide-y divide-border">
            {sortedStreaks.map((s) => {
              const u = users.find((usr) => usr.id === s.userId)
              if (!u) return null
              return (
                <div key={s.userId} className="flex items-center gap-3 px-2 py-2.5">
                  <Avatar emoji={u.avatarEmoji} color={u.color} size={30} />
                  <span className="flex-1 text-sm font-semibold text-ink">{u.name}</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-accent-600">
                    <Flame size={14} /> {s.current}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-bold text-ink">Badges</p>
          <span className="text-xs font-semibold text-ink-faint">{myBadgeIds.size}/{BADGES.length} unlocked</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b) => {
            const earned = myBadgeIds.has(b.id)
            return (
              <Card key={b.id} padding="sm" className={`flex flex-col items-center gap-2 text-center ${!earned && 'opacity-50 grayscale'}`}>
                <span className="text-4xl">{b.emoji}</span>
                <p className="text-xs font-bold text-ink">{b.name}</p>
                <p className="text-[11px] text-ink-faint">{b.description}</p>
                {earned ? <Pill tone="success">Unlocked</Pill> : <Pill tone="neutral">Locked</Pill>}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
