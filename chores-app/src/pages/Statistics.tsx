import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { SegmentedControl } from '../components/ui/Tabs'
import { BarChart } from '../components/stats/BarChart'
import { DonutChart } from '../components/stats/DonutChart'
import { weeklyCompletionCounts, categoryBreakdown, householdStats } from '../lib/stats'
import { weeklyWorkload, fairnessScore } from '../lib/balance'
import { WEEKDAY_LABELS } from '../lib/date'

export default function Statistics() {
  const chores = useStore((s) => s.chores)
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const streaks = useStore((s) => s.streaks)
  const [range, setRange] = useState<'week' | 'month'>('week')

  const daily = useMemo(() => weeklyCompletionCounts(chores, range === 'week' ? 7 : 30), [chores, range])
  const catBreakdown = useMemo(() => categoryBreakdown(chores, range === 'week' ? 7 : 30), [chores, range])
  const stats = useMemo(() => householdStats(chores), [chores])
  const shares = useMemo(() => weeklyWorkload(chores, users), [chores, users])
  const fairness = useMemo(() => fairnessScore(shares), [shares])
  const longestStreak = Math.max(0, ...streaks.map((s) => s.longest))

  const chartData =
    range === 'week'
      ? daily.map((d) => ({ label: d.label, value: d.count, highlight: d.label === WEEKDAY_LABELS[new Date().getDay()] }))
      : bucketByWeek(daily)

  const donutData = catBreakdown.map((c) => {
    const cat = categories.find((cc) => cc.id === c.categoryId)
    return { label: cat?.name ?? 'Other', value: c.count, color: cat?.color ?? '#999', emoji: cat?.emoji }
  })

  return (
    <div className="space-y-6 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Statistics</h1>
          <p className="mt-0.5 text-sm text-ink-soft">The full picture of how your household runs.</p>
        </div>
        <SegmentedControl options={[{ id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }]} value={range} onChange={(v) => setRange(v as 'week' | 'month')} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile emoji="✅" label="Completed" value={stats.totalCompleted} />
        <StatTile emoji="⭐" label="XP earned" value={stats.totalXP} />
        <StatTile emoji="⏱" label="Minutes spent" value={stats.totalMinutes} />
        <StatTile emoji="📈" label="Completion rate" value={`${stats.completionRate}%`} />
        <StatTile emoji="⚠️" label="Overdue" value={stats.overdueCount} tone={stats.overdueCount > 0 ? 'danger' : undefined} />
        <StatTile emoji="🔥" label="Longest streak" value={longestStreak} />
      </div>

      <Card>
        <p className="mb-4 font-display text-sm font-bold text-ink">{range === 'week' ? 'This week' : 'This month'}</p>
        <BarChart data={chartData} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-sm font-bold text-ink">Category breakdown</p>
          {donutData.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">No completions in this range yet.</p>
          ) : (
            <DonutChart data={donutData} />
          )}
        </Card>

        <Card>
          <p className="mb-1 font-display text-sm font-bold text-ink">Family contribution</p>
          <p className="mb-4 text-xs text-ink-faint">⚖️ Household fairness: {fairness}/100</p>
          <div className="space-y-3">
            {shares
              .slice()
              .sort((a, b) => b.sharePct - a.sharePct)
              .map((s) => {
                const u = users.find((usr) => usr.id === s.userId)
                if (!u) return null
                return (
                  <div key={s.userId} className="flex items-center gap-3">
                    <Avatar emoji={u.avatarEmoji} color={u.color} size={26} />
                    <span className="w-16 shrink-0 text-xs font-bold text-ink">{u.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/70">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.sharePct}%`, background: u.color }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-bold text-ink-faint">{s.sharePct}%</span>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-3 font-display text-sm font-bold text-ink">Average completion time</p>
        <p className="font-display text-3xl font-extrabold text-ink">{stats.avgCompletionMinutes} <span className="text-base font-semibold text-ink-faint">min / chore</span></p>
        <p className="mt-1 text-xs text-ink-soft">Based on chores completed with the timer.</p>
      </Card>
    </div>
  )
}

function bucketByWeek(daily: { date: string; label: string; count: number }[]) {
  const weeks: { label: string; value: number }[] = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    weeks.push({ label: `Wk ${Math.floor(i / 7) + 1}`, value: chunk.reduce((s, d) => s + d.count, 0) })
  }
  return weeks
}

function StatTile({ emoji, label, value, tone }: { emoji: string; label: string; value: string | number; tone?: 'danger' }) {
  return (
    <Card padding="sm" className="flex flex-col items-center gap-1 text-center">
      <span className="text-xl">{emoji}</span>
      <span className={`font-display text-lg font-extrabold ${tone === 'danger' ? 'text-danger-500' : 'text-ink'}`}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</span>
    </Card>
  )
}
