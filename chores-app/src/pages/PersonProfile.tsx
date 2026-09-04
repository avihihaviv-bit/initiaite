import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Pill } from '../components/ui/Pill'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Tabs, SegmentedControl } from '../components/ui/Tabs'
import { EmptyState } from '../components/ui/EmptyState'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { ChoreCard } from '../components/chores/ChoreCard'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { ChoreTimerModal } from '../components/chores/ChoreTimerModal'
import { MonthView, monthLabel } from '../components/calendar/MonthView'
import { WeekView } from '../components/calendar/WeekView'
import { DayDetailModal } from '../components/calendar/DayDetailModal'
import { BarChart } from '../components/stats/BarChart'
import { DonutChart } from '../components/stats/DonutChart'
import { levelFromXP, badgeDef } from '../lib/gamification'
import { rankChores } from '../lib/priority'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue, occurrencesForRange } from '../lib/occurrence'
import { addDays, todayISO } from '../lib/date'
import { weeklyCompletionCounts, categoryBreakdown, householdStats } from '../lib/stats'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'chores', label: 'Chores' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'stats', label: 'Statistics' },
]

export default function PersonProfile() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const users = useStore((s) => s.users)
  const allChores = useStore((s) => s.chores)
  const streaks = useStore((s) => s.streaks)
  const earnedBadges = useStore((s) => s.earnedBadges)
  const categories = useStore((s) => s.categories)

  const [tab, setTab] = useState('overview')
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [editChoreId, setEditChoreId] = useState<string | null>(null)
  const [timerChoreId, setTimerChoreId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [calView, setCalView] = useState<'month' | 'week'>('month')
  const [anchor, setAnchor] = useState(todayISO())
  const [dayModalDate, setDayModalDate] = useState<string | null>(null)

  const user = users.find((u) => u.id === personId)
  const today = todayISO()

  const myChores = useMemo(() => allChores.filter((c) => c.assigneeIds.includes(personId) && !c.archived), [allChores, personId])
  const openChore = allChores.find((c) => c.id === openChoreId) ?? null
  const editChore = allChores.find((c) => c.id === editChoreId) ?? null
  const timerChore = allChores.find((c) => c.id === timerChoreId) ?? null
  const dayOccurrences = dayModalDate ? occurrencesForRange(myChores, dayModalDate, dayModalDate) : []

  const streak = streaks.find((s) => s.userId === personId)
  const myBadges = earnedBadges.filter((b) => b.userId === personId)

  const dueTodayOrOverdue = useMemo(
    () => myChores.filter((c) => isDueOn(c, today) || isOverdue(c, today)),
    [myChores, today]
  )
  const completedToday = dueTodayOrOverdue.filter((c) => isCompletedOn(c, effectiveDueDate(c, today)))
  const upcoming = useMemo(
    () => myChores.filter((c) => !isDueOn(c, today) && !isOverdue(c, today) && effectiveDueDate(c, today) > today).slice(0, 5),
    [myChores, today]
  )
  const overdue = useMemo(() => myChores.filter((c) => isOverdue(c, today)), [myChores, today])
  const ranked = useMemo(() => rankChores(dueTodayOrOverdue.filter((c) => !isCompletedOn(c, effectiveDueDate(c, today)))), [dueTodayOrOverdue, today])

  // Personal-only view of stats: keep only this person's completion history.
  const myStatsChores = useMemo(
    () =>
      allChores
        .map((c) => ({ ...c, history: c.history.filter((h) => h.completedBy === personId) }))
        .filter((c) => c.assigneeIds.includes(personId) || c.history.length > 0),
    [allChores, personId]
  )
  const stats = useMemo(() => householdStats(myStatsChores), [myStatsChores])
  const daily = useMemo(() => weeklyCompletionCounts(myStatsChores, 7), [myStatsChores])
  const catBreakdown = useMemo(() => categoryBreakdown(myStatsChores, 30), [myStatsChores])
  const donutData = catBreakdown.map((c) => {
    const cat = categories.find((cc) => cc.id === c.categoryId)
    return { label: cat?.name ?? 'Other', value: c.count, color: cat?.color ?? '#999', emoji: cat?.emoji }
  })

  if (!user) {
    return (
      <EmptyState
        emoji="🤷"
        title="Person not found"
        description="They may have been removed from the household."
        action={<Button onClick={() => navigate('/people')}>Back to People</Button>}
      />
    )
  }

  const { level, intoLevel, forNext } = levelFromXP(user.xp)

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <button onClick={() => navigate('/people')} className="focus-ring flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={15} /> People
      </button>

      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar emoji={user.avatarEmoji} color={user.color} size={72} />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-extrabold text-ink">{user.name}</h1>
            <p className="text-sm text-ink-soft">Level {level} · {user.xp} XP</p>
            <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={7} className="mt-2 max-w-xs" />
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 font-display text-xl font-extrabold text-ink"><Flame size={16} className="text-accent-500" />{streak?.current ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Streak</p>
            </div>
            <div>
              <p className="font-display text-xl font-extrabold text-ink"><AnimatedNumber value={user.points} /></p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Points</p>
            </div>
            <div>
              <p className="font-display text-xl font-extrabold text-ink">{myBadges.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Badges</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>Assign chore</Button>
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{dueTodayOrOverdue.length}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Today</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-success-500">{completedToday.length}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Done</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{upcoming.length}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Upcoming</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-danger-500">{overdue.length}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Overdue</p></Card>
          </div>

          <div>
            <h2 className="mb-3 font-display text-base font-bold text-ink">Next up</h2>
            {ranked.length === 0 ? (
              <EmptyState emoji="🌿" title="All clear" description={`${user.name} has nothing pending right now.`} />
            ) : (
              <div className="space-y-2.5">
                {ranked.slice(0, 6).map((r) => (
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

          {myBadges.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-base font-bold text-ink">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {myBadges.map((b) => (
                  <Pill key={b.badgeId} tone="neutral">{badgeDef(b.badgeId).emoji} {badgeDef(b.badgeId).name}</Pill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'chores' && (
        <div className="space-y-2.5">
          {myChores.length === 0 ? (
            <EmptyState emoji="📋" title="No chores yet" description={`Assign the first chore to ${user.name}.`} action={<Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Assign chore</Button>} />
          ) : (
            rankChores(myChores).map((r) => (
              <ChoreCard
                key={r.chore.id}
                chore={r.chore}
                onOpen={() => setOpenChoreId(r.chore.id)}
                onEdit={() => setEditChoreId(r.chore.id)}
                onStartTimer={() => setTimerChoreId(r.chore.id)}
              />
            ))
          )}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SegmentedControl options={[{ id: 'month', label: 'Month' }, { id: 'week', label: 'Week' }]} value={calView} onChange={(v) => setCalView(v as 'month' | 'week')} />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAnchor(todayISO())}>Today</Button>
              <p className="font-display text-sm font-bold text-ink">{monthLabel(anchor)}</p>
            </div>
          </div>
          {calView === 'month' ? (
            <MonthView anchor={anchor} personId={personId} onOpenDay={(d) => setDayModalDate(d)} />
          ) : (
            <WeekView anchor={anchor} personId={personId} onOpenDay={(d) => setDayModalDate(d)} />
          )}
          <div className="flex justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAnchor((a) => addDays(a, calView === 'month' ? -30 : -7))}>← Prev</Button>
            <Button variant="secondary" size="sm" onClick={() => setAnchor((a) => addDays(a, calView === 'month' ? 30 : 7))}>Next →</Button>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{stats.totalCompleted}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Completed</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{stats.totalXP}</p><p className="text-[10px] font-bold uppercase text-ink-faint">XP earned</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{stats.completionRate}%</p><p className="text-[10px] font-bold uppercase text-ink-faint">Completion</p></Card>
            <Card padding="sm" className="text-center"><p className="font-display text-lg font-extrabold text-ink">{streak?.longest ?? 0}</p><p className="text-[10px] font-bold uppercase text-ink-faint">Longest streak</p></Card>
          </div>
          <Card>
            <p className="mb-4 font-display text-sm font-bold text-ink">This week</p>
            <BarChart data={daily.map((d) => ({ label: d.label, value: d.count }))} />
          </Card>
          {donutData.length > 0 && (
            <Card>
              <p className="mb-4 font-display text-sm font-bold text-ink">Category breakdown</p>
              <DonutChart data={donutData} />
            </Card>
          )}
        </div>
      )}

      <ChoreDetailModal chore={openChore} onClose={() => setOpenChoreId(null)} onEdit={() => { setEditChoreId(openChoreId); setOpenChoreId(null) }} />
      <ChoreFormModal open={!!editChore} onClose={() => setEditChoreId(null)} editChore={editChore} />
      <ChoreFormModal open={createOpen} onClose={() => setCreateOpen(false)} defaultUserId={personId} />
      <ChoreTimerModal chore={timerChore} onClose={() => setTimerChoreId(null)} />
      <DayDetailModal
        date={dayModalDate}
        occurrences={dayOccurrences}
        onClose={() => setDayModalDate(null)}
        onOpenChore={(id) => { setOpenChoreId(id); setDayModalDate(null) }}
      />
    </div>
  )
}
