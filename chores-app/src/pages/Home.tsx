import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { ProgressRing } from '../components/ui/ProgressRing'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ChoreCard } from '../components/chores/ChoreCard'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { ChoreTimerModal } from '../components/chores/ChoreTimerModal'
import { levelFromXP } from '../lib/gamification'
import { rankChores, bestNextChore, isBlocked } from '../lib/priority'
import { todayISO } from '../lib/date'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue } from '../lib/occurrence'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export default function Home() {
  const users = useStore((s) => s.users)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const chores = useStore((s) => s.chores)
  const streaks = useStore((s) => s.streaks)
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [editChoreId, setEditChoreId] = useState<string | null>(null)
  const [timerChoreId, setTimerChoreId] = useState<string | null>(null)

  const user = users.find((u) => u.id === currentUserId) ?? users[0]
  const openChore = chores.find((c) => c.id === openChoreId) ?? null
  const editChore = chores.find((c) => c.id === editChoreId) ?? null
  const timerChore = chores.find((c) => c.id === timerChoreId) ?? null
  const today = todayISO()

  const myChoresToday = useMemo(
    () =>
      chores.filter(
        (c) => !c.archived && (isDueOn(c, today) || isOverdue(c, today)) && (c.assigneeId === user?.id || !c.assigneeId)
      ),
    [chores, today, user]
  )
  const completedToday = myChoresToday.filter((c) => isCompletedOn(c, effectiveDueDate(c, today)))
  const pct = myChoresToday.length ? Math.round((completedToday.length / myChoresToday.length) * 100) : 0

  const streak = streaks.find((s) => s.userId === user?.id)
  const { level, intoLevel, forNext } = user ? levelFromXP(user.xp) : { level: 1, intoLevel: 0, forNext: 100 }

  const upNext = useMemo(() => {
    const pending = myChoresToday.filter((c) => !isCompletedOn(c, effectiveDueDate(c, today)) && !isBlocked(c, chores))
    return rankChores(pending).slice(0, 5)
  }, [myChoresToday, chores, today])

  const bestNext = useMemo(() => bestNextChore(chores, user?.id ?? null, chores), [chores, user])

  if (!user) return null

  return (
    <div className="space-y-6 pb-4 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {greeting()}, {user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {myChoresToday.length === 0
              ? "Nothing scheduled today — a great day to get ahead."
              : completedToday.length === myChoresToday.length
              ? "Everything's done. Enjoy the rest of your day!"
              : `${myChoresToday.length - completedToday.length} chore${myChoresToday.length - completedToday.length === 1 ? '' : 's'} left today.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="col-span-1 flex items-center gap-4 sm:col-span-1">
          <ProgressRing value={pct} size={72} color="var(--color-primary-500)">
            <span className="font-display text-base font-extrabold text-ink">{pct}%</span>
          </ProgressRing>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Today's progress</p>
            <p className="mt-1 font-display text-xl font-extrabold text-ink">
              <AnimatedNumber value={completedToday.length} /> / {myChoresToday.length}
            </p>
            <p className="text-xs text-ink-soft">chores completed</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/20 to-accent-500/20 text-3xl">🔥</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Streak</p>
            <p className="font-display text-xl font-extrabold text-ink"><AnimatedNumber value={streak?.current ?? 0} /> days</p>
            <p className="text-xs text-ink-soft">{(streak?.current ?? 0) > 0 ? "You're on fire!" : 'Complete a chore to start one'}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 text-3xl">⭐</span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Level {level}</p>
            <p className="font-display text-xl font-extrabold text-ink"><AnimatedNumber value={user.xp} /> XP</p>
            <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={6} className="mt-1.5" />
          </div>
        </Card>
      </div>

      {bestNext && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-surface dark:border-primary-800 dark:from-primary-900/20">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-2xl text-white shadow-[var(--shadow-glow)]">
                  {bestNext.chore.emoji}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                    <Sparkles size={13} /> Your best next task
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-ink">{bestNext.chore.title}</p>
                  <p className="text-sm text-ink-soft">
                    Only {bestNext.chore.estimatedMinutes} min · +{bestNext.chore.xp} XP
                    {bestNext.reasons[0] ? ` · ${bestNext.reasons[0]}` : ''}
                  </p>
                </div>
              </div>
              <Button onClick={() => setOpenChoreId(bestNext.chore.id)} className="w-full sm:w-auto">Let's do it</Button>
            </div>
          </Card>
        </motion.div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">⚡ Next up</h2>
          {upNext.length > 0 && <span className="text-xs font-semibold text-ink-faint">{upNext.length} chore{upNext.length === 1 ? '' : 's'}</span>}
        </div>
        {upNext.length === 0 ? (
          <EmptyState emoji="🌿" title="You're all clear" description="No pending chores need attention right now. Enjoy the calm." />
        ) : (
          <div className="space-y-2.5">
            {upNext.map((r) => (
              <ChoreCard
                key={r.chore.id}
                chore={r.chore}
                onOpen={() => setOpenChoreId(r.chore.id)}
                onEdit={() => setEditChoreId(r.chore.id)}
                onStartTimer={() => setTimerChoreId(r.chore.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ChoreDetailModal chore={openChore} onClose={() => setOpenChoreId(null)} onEdit={() => { setEditChoreId(openChoreId); setOpenChoreId(null) }} />
      <ChoreFormModal open={!!editChore} onClose={() => setEditChoreId(null)} editChore={editChore} />
      <ChoreTimerModal chore={timerChore} onClose={() => setTimerChoreId(null)} />
    </div>
  )
}
