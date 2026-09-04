import type { Chore, User } from '../types'
import { addDays, todayISO } from './date'

export interface WorkloadShare {
  userId: string
  points: number
  minutes: number
  count: number
  sharePct: number
}

/** Sum this week's assigned workload (points-weighted) per user. */
export function weeklyWorkload(chores: Chore[], users: User[]): WorkloadShare[] {
  const today = todayISO()
  const weekAgo = addDays(today, -6)

  const raw = users.map((u) => {
    const mine = chores.filter(
      (c) => c.assigneeIds.includes(u.id) && !c.archived
    )
    let points = 0
    let minutes = 0
    let count = 0
    mine.forEach((c) => {
      const recentCompletions = c.history.filter(
        (h) => h.occurrenceDate >= weekAgo && h.occurrenceDate <= today
      )
      if (recentCompletions.length > 0) {
        points += recentCompletions.length * c.points
        minutes += recentCompletions.length * c.estimatedMinutes
        count += recentCompletions.length
      } else if (c.dueDate >= weekAgo && c.dueDate <= addDays(today, 7)) {
        // scheduled but not yet completed this week still counts as workload
        points += c.points * 0.6
        minutes += c.estimatedMinutes * 0.6
        count += 0.6
      }
    })
    return { userId: u.id, points, minutes, count }
  })

  const total = raw.reduce((s, r) => s + r.points, 0) || 1
  return raw.map((r) => ({ ...r, sharePct: Math.round((r.points / total) * 100) }))
}

/** Fairness score 0-100: 100 = perfectly even split of workload among active members. */
export function fairnessScore(shares: WorkloadShare[]): number {
  const active = shares.filter((s) => s.points > 0)
  if (active.length <= 1) return 100
  const ideal = 100 / active.length
  const deviation =
    active.reduce((sum, s) => sum + Math.abs(s.sharePct - ideal), 0) / active.length
  // deviation of 0 -> 100, deviation of ~ideal -> 0
  const score = Math.max(0, 100 - (deviation / ideal) * 100)
  return Math.round(score)
}

export interface BalanceSuggestion {
  choreId: string
  choreTitle: string
  fromUserId: string
  toUserId: string
  reasoning: string
  projectedFairness: number
}

/**
 * Smart Chore Balancing: suggests moving one under-loaded-friendly chore from
 * the most-loaded active member to the least-loaded one.
 */
export function suggestRebalance(chores: Chore[], users: User[]): BalanceSuggestion | null {
  if (users.length < 2) return null
  const shares = weeklyWorkload(chores, users)
  const currentFairness = fairnessScore(shares)
  if (currentFairness >= 88) return null

  const sorted = [...shares].sort((a, b) => b.sharePct - a.sharePct)
  const most = sorted[0]
  const least = sorted[sorted.length - 1]
  if (!most || !least || most.userId === least.userId) return null

  // Find an upcoming, not-yet-completed, movable chore from the most-loaded person,
  // preferring smaller/medium chores so the swap doesn't just flip who's overloaded.
  const today = todayISO()
  const candidates = chores
    .filter(
      (c) =>
        c.assigneeIds.length === 1 &&
        c.assigneeIds[0] === most.userId &&
        !c.archived &&
        c.dueDate >= today &&
        !c.history.some((h) => h.occurrenceDate === c.dueDate)
    )
    .sort((a, b) => a.points - b.points)

  const target = candidates[0]
  if (!target) return null

  const hypothetical = shares.map((s) => {
    if (s.userId === most.userId) return { ...s, points: s.points - target.points }
    if (s.userId === least.userId) return { ...s, points: s.points + target.points }
    return s
  })
  const total = hypothetical.reduce((s, r) => s + r.points, 0) || 1
  const recomputed = hypothetical.map((r) => ({ ...r, sharePct: Math.round((r.points / total) * 100) }))
  const projected = fairnessScore(recomputed)

  if (projected <= currentFairness) return null

  const fromName = users.find((u) => u.id === most.userId)?.name ?? 'someone'
  const toName = users.find((u) => u.id === least.userId)?.name ?? 'someone'

  return {
    choreId: target.id,
    choreTitle: target.title,
    fromUserId: most.userId,
    toUserId: least.userId,
    reasoning: `${fromName} currently carries ${most.sharePct}% of this week's workload, while ${toName} carries ${least.sharePct}%. Moving "${target.title}" evens things out.`,
    projectedFairness: projected,
  }
}
