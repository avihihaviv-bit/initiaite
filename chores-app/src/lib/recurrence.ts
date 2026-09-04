import type { RecurrenceRule } from '../types'
import { addDays, daysBetween, parseISODate, toISODate } from './date'

/** Does this recurrence rule land on the given ISO date? */
export function occursOn(rule: RecurrenceRule, iso: string): boolean {
  if (rule.skippedDates?.includes(iso)) return false
  if (daysBetween(rule.startDate, iso) < 0) return false
  if (rule.endDate && daysBetween(iso, rule.endDate) < 0) return false

  const dow = parseISODate(iso).getDay()

  switch (rule.frequency) {
    case 'none':
      return iso === rule.startDate
    case 'daily':
      return true
    case 'weekdays':
      return dow >= 1 && dow <= 5
    case 'weekends':
      return dow === 0 || dow === 6
    case 'weekly':
      return (rule.daysOfWeek ?? [parseISODate(rule.startDate).getDay()]).includes(dow)
    case 'biweekly': {
      const weeksSince = Math.floor(daysBetween(rule.startDate, iso) / 7)
      const startDow = parseISODate(rule.startDate).getDay()
      return weeksSince % 2 === 0 && (rule.daysOfWeek ?? [startDow]).includes(dow)
    }
    case 'monthly': {
      const startDate = parseISODate(rule.startDate).getDate()
      return parseISODate(iso).getDate() === startDate
    }
    case 'custom':
      return (rule.daysOfWeek ?? []).includes(dow)
    default:
      return false
  }
}

/** Next occurrence on/after fromISO (inclusive). */
export function nextOccurrence(rule: RecurrenceRule, fromISO: string): string | null {
  let cursor = daysBetween(rule.startDate, fromISO) > 0 ? fromISO : rule.startDate
  for (let i = 0; i < 730; i++) {
    if (occursOn(rule, cursor)) return cursor
    if (rule.endDate && daysBetween(cursor, rule.endDate) < 0) return null
    cursor = addDays(cursor, 1)
  }
  return null
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const dayName = (d: number) =>
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
  switch (rule.frequency) {
    case 'none':
      return 'Once'
    case 'daily':
      return 'Every day'
    case 'weekdays':
      return 'Every weekday'
    case 'weekends':
      return 'Every weekend'
    case 'weekly':
      return `Every ${(rule.daysOfWeek ?? []).map(dayName).join(', ') || 'week'}`
    case 'biweekly':
      return `Every 2 weeks (${(rule.daysOfWeek ?? []).map(dayName).join(', ')})`
    case 'monthly':
      return 'Every month'
    case 'custom':
      return `Custom: ${(rule.daysOfWeek ?? []).map(dayName).join(', ')}`
    default:
      return ''
  }
}

export function occurrencesInRange(
  rule: RecurrenceRule,
  startISO: string,
  endISO: string
): string[] {
  const out: string[] = []
  let cur = startISO
  let guard = 0
  while (daysBetween(cur, endISO) >= 0 && guard < 400) {
    if (occursOn(rule, cur)) out.push(cur)
    cur = addDays(cur, 1)
    guard++
  }
  return out
}

export function todayPlusYears(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + years)
  return toISODate(d)
}
