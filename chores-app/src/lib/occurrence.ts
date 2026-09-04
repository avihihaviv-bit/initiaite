import type { Chore } from '../types'
import { addDays, daysBetween, todayISO } from './date'
import { nextOccurrence, occursOn } from './recurrence'

/** Does this chore have an occurrence landing on this exact date? */
export function isDueOn(chore: Chore, dateISO: string): boolean {
  if (chore.recurrence.frequency === 'none') return chore.dueDate === dateISO
  return occursOn(chore.recurrence, dateISO)
}

export function isCompletedOn(chore: Chore, dateISO: string): boolean {
  return chore.history.some((h) => h.occurrenceDate === dateISO)
}

/** Most recent scheduled occurrence on or before dateISO, if any. */
export function lastDueOnOrBefore(chore: Chore, dateISO: string): string | null {
  if (chore.recurrence.frequency === 'none') {
    return chore.dueDate <= dateISO ? chore.dueDate : null
  }
  let cursor = dateISO
  for (let i = 0; i < 60; i++) {
    if (daysBetween(chore.recurrence.startDate, cursor) < 0) return null
    if (occursOn(chore.recurrence, cursor)) return cursor
    cursor = addDays(cursor, -1)
  }
  return null
}

/** Next scheduled occurrence on or after fromISO. */
export function nextDueDate(chore: Chore, fromISO = todayISO()): string {
  if (chore.recurrence.frequency === 'none') return chore.dueDate
  return nextOccurrence(chore.recurrence, fromISO) ?? chore.dueDate
}

/** A chore is overdue if it had a scheduled occurrence strictly before today that was never completed. */
export function isOverdue(chore: Chore, today = todayISO()): boolean {
  const before = addDays(today, -1)
  const last = lastDueOnOrBefore(chore, before)
  if (!last) return false
  return !isCompletedOn(chore, last)
}

/** The date that best represents "when this chore needs attention" — the missed date if overdue, else the next due date. */
export function effectiveDueDate(chore: Chore, today = todayISO()): string {
  if (isOverdue(chore, today)) {
    return lastDueOnOrBefore(chore, addDays(today, -1)) ?? nextDueDate(chore, today)
  }
  return nextDueDate(chore, today)
}

export type OccurrenceStatus = 'completed' | 'overdue' | 'today' | 'upcoming'

export interface Occurrence {
  chore: Chore
  date: string
  status: OccurrenceStatus
}

/** Expand all active chores into their scheduled occurrences within [startISO, endISO]. */
export function occurrencesForRange(chores: Chore[], startISO: string, endISO: string): Occurrence[] {
  const today = todayISO()
  const out: Occurrence[] = []
  chores
    .filter((c) => !c.archived)
    .forEach((chore) => {
      let cursor = startISO
      let guard = 0
      while (daysBetween(cursor, endISO) >= 0 && guard < 400) {
        if (isDueOn(chore, cursor)) {
          const completed = isCompletedOn(chore, cursor)
          let status: OccurrenceStatus
          if (completed) status = 'completed'
          else if (cursor < today) status = 'overdue'
          else if (cursor === today) status = 'today'
          else status = 'upcoming'
          out.push({ chore, date: cursor, status })
        }
        cursor = addDays(cursor, 1)
        guard++
      }
    })
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
