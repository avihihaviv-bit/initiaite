import type { Chore } from '../types'
import { addDays, todayISO, WEEKDAY_LABELS } from './date'
import { isOverdue } from './occurrence'

export interface DayCount {
  date: string
  label: string
  count: number
}

export function weeklyCompletionCounts(chores: Chore[], daysBack = 7): DayCount[] {
  const today = todayISO()
  const out: DayCount[] = []
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const count = chores.reduce((sum, c) => sum + c.history.filter((h) => h.occurrenceDate === date).length, 0)
    out.push({ date, label: WEEKDAY_LABELS[new Date(date).getDay()], count })
  }
  return out
}

export interface CategoryBreakdown {
  categoryId: string
  count: number
}

export function categoryBreakdown(chores: Chore[], daysBack = 30): CategoryBreakdown[] {
  const cutoff = addDays(todayISO(), -daysBack)
  const map = new Map<string, number>()
  chores.forEach((c) => {
    const count = c.history.filter((h) => h.occurrenceDate >= cutoff).length
    if (count > 0) map.set(c.categoryId, (map.get(c.categoryId) ?? 0) + count)
  })
  return Array.from(map.entries())
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count)
}

export interface HouseholdStats {
  totalCompleted: number
  totalXP: number
  totalMinutes: number
  completionRate: number
  overdueCount: number
  avgCompletionMinutes: number
}

export function householdStats(chores: Chore[]): HouseholdStats {
  const active = chores.filter((c) => !c.archived)
  let totalCompleted = 0
  let totalXP = 0
  let totalMinutes = 0
  let durationSamples = 0

  active.forEach((c) => {
    c.history.forEach((h) => {
      totalCompleted++
      totalXP += h.xpEarned
      if (h.durationMinutes) {
        totalMinutes += h.durationMinutes
        durationSamples++
      }
    })
  })

  const overdueCount = active.filter((c) => isOverdue(c)).length
  // completion rate over the last 14 days: completed occurrences vs. (completed + currently overdue)
  const today = todayISO()
  const cutoff = addDays(today, -14)
  let completed = 0
  active.forEach((c) => {
    c.history.forEach((h) => {
      if (h.occurrenceDate >= cutoff && h.occurrenceDate <= today) completed++
    })
  })
  const completionRate = completed + overdueCount > 0 ? Math.round((completed / (completed + overdueCount)) * 100) : 100

  return {
    totalCompleted,
    totalXP,
    totalMinutes,
    completionRate: Number.isFinite(completionRate) ? completionRate : 100,
    overdueCount,
    avgCompletionMinutes: durationSamples > 0 ? Math.round(totalMinutes / durationSamples) : 0,
  }
}
