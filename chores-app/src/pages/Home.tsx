import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Play, Plus, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ChoreCard } from '../components/chores/ChoreCard'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { ChoreTimerModal } from '../components/chores/ChoreTimerModal'
import { levelFromXP } from '../lib/gamification'
import { rankChores, bestNextChore } from '../lib/priority'
import { addDays, friendlyDate, formatTime, todayISO } from '../lib/date'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue } from '../lib/occurrence'
import { useToast } from '../components/ui/Toast'

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
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [editChoreId, setEditChoreId] = useState<string | null>(null)
  const [timerChoreId, setTimerChoreId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [createOpen, setCreateOpen] = useState(false)

  const user = users.find((u) => u.id === currentUserId) ?? users[0]
  const openChore = chores.find((c) => c.id === openChoreId) ?? null
  const editChore = chores.find((c) => c.id === editChoreId) ?? null
  const timerChore = chores.find((c) => c.id === timerChoreId) ?? null
  const today = todayISO()

  // Only chores explicitly assigned to this person show up as "mine" — an
  // unassigned chore isn't anyone's yet, so a new member starts with a clean
  // list instead of inheriting whatever's still up for grabs.
  const myChoresToday = useMemo(
    () => chores.filter((c) => !c.archived && !!user && c.assigneeIds.includes(user.id) && (isDueOn(c, today) || isOverdue(c, today))),
    [chores, today, user]
  )
  const completedToday = myChoresToday.filter((c) => isCompletedOn(c, effectiveDueDate(c, today)))
  const overdueToday = myChoresToday.filter((c) => !isCompletedOn(c, effectiveDueDate(c, today)) && isOverdue(c, today))
  const remaining = myChoresToday.length - completedToday.length
  const pct = myChoresToday.length ? Math.round((completedToday.length / myChoresToday.length) * 100) : 0

  const streak = streaks.find((s) => s.userId === user?.id)
  const { level, intoLevel, forNext } = user ? levelFromXP(user.xp) : { level: 1, intoLevel: 0, forNext: 100 }

  // The list below the overview can browse other days, independent of the
  // (always-today) stats above.
  const myChoresForDay = useMemo(
    () =>
      chores.filter(
        (c) =>
          !c.archived &&
          !!user &&
          c.assigneeIds.includes(user.id) &&
          (isDueOn(c, selectedDate) || (selectedDate === today && isOverdue(c, today)))
      ),
    [chores, selectedDate, today, user]
  )
  const rankedForDay = useMemo(() => rankChores(myChoresForDay), [myChoresForDay])
  const dayLabel = friendlyDate(selectedDate)

  const bestNext = useMemo(() => bestNextChore(chores, user?.id ?? null, chores), [chores, user])

  if (!user) return null

  return (
    <div className="space-y-6 pb-4 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {greeting()}, {user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Here's what needs to be done.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/streaks"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            🔥 <AnimatedNumber value={streak?.current ?? 0} /> day streak
          </Link>
          <Link
            to="/streaks"
            className="focus-ring flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink transition hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            🏆 Level {level}
          </Link>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-sm font-bold text-ink">📊 Today's overview</p>
          <span className="font-display text-sm font-extrabold text-primary-500">{pct}%</span>
        </div>
        <ProgressBar value={pct} height={10} className="mb-5" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-2 py-3 text-center">
            <p className="font-display text-xl font-extrabold text-ink"><AnimatedNumber value={myChoresToday.length} /></p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Total today</p>
          </div>
          <div className="rounded-xl bg-surface-2 py-3 text-center">
            <p className="font-display text-xl font-extrabold text-success-500"><AnimatedNumber value={completedToday.length} /></p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Completed</p>
          </div>
          <div className="rounded-xl bg-surface-2 py-3 text-center">
            <p className="font-display text-xl font-extrabold text-ink"><AnimatedNumber value={remaining} /></p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Remaining</p>
          </div>
          <div className="rounded-xl bg-surface-2 py-3 text-center">
            <p className="font-display text-xl font-extrabold text-danger-500"><AnimatedNumber value={overdueToday.length} /></p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Overdue</p>
          </div>
        </div>
        <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={5} className="mt-5" />
        <p className="mt-1.5 text-center text-[11px] font-semibold text-ink-faint">{intoLevel} / {forNext} XP to Level {level + 1}</p>
      </Card>

      {bestNext && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-surface dark:border-primary-800 dark:from-primary-900/20">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300">
              <Sparkles size={13} /> Next chore
            </p>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-2xl text-white shadow-[var(--shadow-glow)]">
                  {bestNext.chore.emoji}
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold text-ink">{bestNext.chore.title}</p>
                  <p className="text-sm text-ink-soft">
                    {user.name} · {bestNext.chore.dueTime ? `Today · ${formatTime(bestNext.chore.dueTime)}` : 'Today'} · {bestNext.chore.estimatedMinutes} min · +{bestNext.chore.xp} XP
                  </p>
                </div>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button variant="secondary" icon={<Play size={15} />} onClick={() => setTimerChoreId(bestNext.chore.id)} className="flex-1 sm:flex-none">
                  Start
                </Button>
                <Button
                  icon={<Check size={15} />}
                  onClick={() => {
                    completeChore(bestNext.chore.id)
                    show('Nice! Marked complete.')
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Complete
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-ink">📋 My chores — {dayLabel}</h2>
          <div className="flex items-center gap-1.5">
            {rankedForDay.length > 0 && <span className="mr-1 text-xs font-semibold text-ink-faint">{rankedForDay.length} chore{rankedForDay.length === 1 ? '' : 's'}</span>}
            <Button variant="secondary" size="icon" onClick={() => setSelectedDate((d) => addDays(d, -1))} aria-label="Previous day">
              <ChevronLeft size={15} />
            </Button>
            {selectedDate !== today && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>Today</Button>
            )}
            <Button variant="secondary" size="icon" onClick={() => setSelectedDate((d) => addDays(d, 1))} aria-label="Next day">
              <ChevronRight size={15} />
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>Add</Button>
          </div>
        </div>
        {rankedForDay.length === 0 ? (
          <EmptyState
            emoji="🌿"
            title={`Nothing for ${dayLabel.toLowerCase()}`}
            description="Nothing scheduled yet — add a chore to get started."
            action={<Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Add a chore</Button>}
          />
        ) : (
          <div className="space-y-2.5">
            {rankedForDay.map((r) => (
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
      <ChoreFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaultDate={selectedDate} defaultUserId={user.id} />
      <ChoreTimerModal chore={timerChore} onClose={() => setTimerChoreId(null)} />
    </div>
  )
}
