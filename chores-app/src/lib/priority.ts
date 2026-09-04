import type { Chore, Priority } from '../types'
import { daysBetween, todayISO } from './date'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue } from './occurrence'

const PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 8,
  medium: 18,
  high: 30,
  urgent: 40,
}

export interface ScoredChore {
  chore: Chore
  score: number
  reasons: string[]
}

/**
 * Smart Priority Engine.
 * Produces a 0-100ish score for "how urgently should this get done now",
 * factoring deadline pressure, overdue status, user priority, duration,
 * dependencies, and time-of-day fit.
 */
export function scoreChore(chore: Chore, now = new Date()): ScoredChore {
  const reasons: string[] = []
  let score = 0

  score += PRIORITY_WEIGHT[chore.priority]
  if (chore.priority === 'high' || chore.priority === 'urgent') {
    reasons.push(`${chore.priority} priority`)
  }

  const today = todayISO()
  const diff = daysBetween(today, effectiveDueDate(chore, today))

  if (diff < 0) {
    const overdueBoost = Math.min(30, 12 + Math.abs(diff) * 4)
    score += overdueBoost
    reasons.push(`Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`)
  } else if (diff === 0) {
    score += 22
    if (chore.dueTime) {
      const [h, m] = chore.dueTime.split(':').map(Number)
      const dueMinutes = h * 60 + m
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const delta = dueMinutes - nowMinutes
      if (delta <= 0) {
        score += 14
        reasons.push('Due time has passed')
      } else if (delta <= 60) {
        score += 12
        reasons.push(`Due in ${delta} min`)
      } else if (delta <= 180) {
        score += 6
        reasons.push('Due later today')
      }
    } else {
      reasons.push('Due today')
    }
  } else if (diff === 1) {
    score += 8
  } else if (diff <= 3) {
    score += 3
  }

  // Shorter chores get a small nudge — easy wins, momentum.
  if (chore.estimatedMinutes <= 10) {
    score += 6
    reasons.push('Quick win')
  } else if (chore.estimatedMinutes >= 45) {
    score -= 4
  }

  // Frequency: daily essentials (kitchen, trash) matter more to keep the house running.
  if (chore.recurrence.frequency === 'daily') {
    score += 4
  }

  // Dependencies: if other chores depend on this one, bump it.
  if (chore.dependsOn.length > 0) {
    score -= 6 // this one is blocked, deprioritize until deps clear
    reasons.push('Waiting on another chore')
  }

  // Unassigned household-critical chores surface a bit more.
  if (!chore.assigneeId) {
    score += 2
  }

  return { chore, score: Math.max(0, Math.round(score)), reasons }
}

export function rankChores(chores: Chore[], now = new Date()): ScoredChore[] {
  return chores
    .filter((c) => !c.archived)
    .map((c) => scoreChore(c, now))
    .sort((a, b) => b.score - a.score)
}

/** Is a chore currently blocked by incomplete dependencies (for today's occurrence)? */
export function isBlocked(chore: Chore, allChores: Chore[]): boolean {
  if (chore.dependsOn.length === 0) return false
  const today = todayISO()
  return chore.dependsOn.some((depId) => {
    const dep = allChores.find((c) => c.id === depId)
    if (!dep) return false
    return !dep.history.some((h) => h.occurrenceDate === today)
  })
}

export function bestNextChore(chores: Chore[], userId: string | null, allChores: Chore[]): ScoredChore | null {
  const today = todayISO()
  const candidates = chores.filter((c) => {
    if (c.archived) return false
    if (userId && c.assigneeId && c.assigneeId !== userId) return false
    if (isBlocked(c, allChores)) return false
    if (!isDueOn(c, today) && !isOverdue(c, today)) return false
    return !isCompletedOn(c, effectiveDueDate(c, today))
  })
  const ranked = rankChores(candidates)
  return ranked[0] ?? null
}
