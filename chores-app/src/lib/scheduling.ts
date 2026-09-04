import type { Chore } from '../types'
import { isDueOn } from './occurrence'

export interface TimeSuggestion {
  time: string // HH:mm
  reason: string
}

const DAY_START = 8 * 60 // 08:00
const DAY_END = 21 * 60 // 21:00
const STEP = 15

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Smart scheduling: finds a free time slot on `dateISO` for everyone in
 * `assigneeIds`, avoiding overlap with their other chores that day.
 */
export function suggestTime(
  chores: Chore[],
  assigneeIds: string[],
  dateISO: string,
  durationMinutes: number,
  excludeChoreId?: string
): TimeSuggestion {
  const busy: [number, number][] = []

  chores.forEach((c) => {
    if (c.archived) return
    if (c.id === excludeChoreId) return
    if (assigneeIds.length > 0 && !c.assigneeIds.some((id) => assigneeIds.includes(id))) return
    if (!c.dueTime) return
    if (!isDueOn(c, dateISO)) return
    const [h, m] = c.dueTime.split(':').map(Number)
    const start = h * 60 + m
    busy.push([start, start + c.estimatedMinutes])
  })
  busy.sort((a, b) => a[0] - b[0])

  for (let t = DAY_START; t + durationMinutes <= DAY_END; t += STEP) {
    const conflict = busy.some(([s, e]) => t < e && t + durationMinutes > s)
    if (!conflict) {
      return {
        time: toHHMM(t),
        reason:
          busy.length > 0
            ? `Avoids overlapping with ${busy.length} other chore${busy.length > 1 ? 's' : ''} that day`
            : 'Nothing else scheduled that day yet',
      }
    }
  }

  return { time: '18:00', reason: 'That day looks packed — this is the best fallback slot' }
}
