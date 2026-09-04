export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function daysBetween(fromISO: string, toISOStr: string): number {
  const a = parseISODate(fromISO)
  const b = parseISODate(toISOStr)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function isPast(iso: string): boolean {
  return daysBetween(todayISO(), iso) < 0
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

export function isTomorrow(iso: string): boolean {
  return iso === addDays(todayISO(), 1)
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LABELS_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]
export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function friendlyDate(iso: string): string {
  if (isToday(iso)) return 'Today'
  if (isTomorrow(iso)) return 'Tomorrow'
  if (iso === addDays(todayISO(), -1)) return 'Yesterday'
  const d = parseISODate(iso)
  const diff = daysBetween(todayISO(), iso)
  if (diff > 1 && diff < 7) return WEEKDAY_LABELS_FULL[d.getDay()]
  return `${MONTH_LABELS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

export function formatTime(hhmm?: string): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function startOfWeek(iso: string): string {
  const d = parseISODate(iso)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return toISODate(d)
}

export function startOfMonth(iso: string): string {
  const d = parseISODate(iso)
  d.setDate(1)
  return toISODate(d)
}

export function getMonthGrid(iso: string): string[] {
  const first = startOfMonth(iso)
  const gridStart = startOfWeek(first)
  const days: string[] = []
  let cur = gridStart
  for (let i = 0; i < 42; i++) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export function getWeekDays(iso: string): string[] {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
