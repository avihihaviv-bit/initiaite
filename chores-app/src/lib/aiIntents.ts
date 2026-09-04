import type { Category, Chore, Difficulty, User } from '../types'
import { ONBOARDING_CHORE_TEMPLATES } from './seed'
import { addDays, parseISODate, todayISO, startOfWeek, WEEKDAY_LABELS_FULL, friendlyDate, formatTime } from './date'
import { isDueOn, occurrencesForRange } from './occurrence'

export interface AssignChoresAction {
  kind: 'assign-chores'
  userId: string
  date: string
  items: { title: string; emoji: string; categoryId: string; estimatedMinutes: number; difficulty: Difficulty }[]
}

export interface MoveChoresAction {
  kind: 'move-chores'
  userId: string
  fromDate: string
  toDate: string
  choreIds: string[]
}

export interface CreateRecurringAction {
  kind: 'create-recurring'
  userId: string
  title: string
  emoji: string
  categoryId: string
  daysOfWeek: number[]
  startDate: string
  time?: string
}

export type PendingAction = AssignChoresAction | MoveChoresAction | CreateRecurringAction

export interface IntentResult {
  reply: string
  action?: PendingAction
  actionLabel?: string
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2,
}

function parseCount(word: string): number {
  if (/^\d+$/.test(word)) return Math.max(1, Math.min(10, Number(word)))
  return NUMBER_WORDS[word.toLowerCase()] ?? 1
}

const WEEKDAY_SHORT: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

function weekdayIndexFromWord(word: string): number | null {
  const w = word.toLowerCase()
  const fullIdx = WEEKDAY_LABELS_FULL.findIndex((d) => d.toLowerCase() === w)
  if (fullIdx >= 0) return fullIdx
  return w.slice(0, 3) in WEEKDAY_SHORT ? WEEKDAY_SHORT[w.slice(0, 3)] : null
}

function resolveDateWord(word: string, from = todayISO()): string | null {
  const w = word.toLowerCase()
  if (w === 'today') return from
  if (w === 'tomorrow') return addDays(from, 1)
  if (w === 'yesterday') return addDays(from, -1)
  const dow = weekdayIndexFromWord(w)
  if (dow == null) return null
  const fromDow = parseISODate(from).getDay()
  const delta = (dow - fromDow + 7) % 7
  return addDays(from, delta)
}

function resolveUser(word: string, users: User[], currentUserId: string | null): User | undefined {
  const w = word.toLowerCase().replace(/'s$/, '')
  if (['my', 'me', 'myself', 'i'].includes(w)) return users.find((u) => u.id === currentUserId)
  return users.find((u) => u.name.toLowerCase() === w) ?? users.find((u) => u.name.toLowerCase().startsWith(w))
}

function parseTime(hourStr?: string, minStr?: string, ampm?: string): string | undefined {
  if (!hourStr) return undefined
  let h = Number(hourStr)
  const m = minStr ? Number(minStr) : 0
  if (Number.isNaN(h) || h > 23 || m > 59) return undefined
  const period = ampm?.toLowerCase()
  if (period === 'pm' && h < 12) h += 12
  if (period === 'am' && h === 12) h = 0
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function guessCategory(title: string, categories: Category[]): Category {
  const t = title.toLowerCase()
  const rules: [RegExp, string][] = [
    [/bathroom|toilet|shower/, 'cat-bathroom'],
    [/kitchen|dish/, 'cat-kitchen'],
    [/laundry|cloth/, 'cat-laundry'],
    [/trash|garbage|recycl/, 'cat-trash'],
    [/bedroom|\bbed\b/, 'cat-bedroom'],
    [/yard|garden|lawn|outside|plant/, 'cat-outside'],
    [/dog|cat\b|pet/, 'cat-pets'],
    [/shop|groc/, 'cat-shopping'],
    [/fix|repair|maintenance/, 'cat-maintenance'],
    [/organiz|garage|closet/, 'cat-organization'],
  ]
  const match = rules.find(([re]) => re.test(t))
  return categories.find((c) => c.id === match?.[1]) ?? categories.find((c) => c.id === 'cat-cleaning') ?? categories[0]
}

function titleCase(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

interface IntentCtx {
  chores: Chore[]
  users: User[]
  categories: Category[]
  currentUserId: string | null
}

/** Try to detect an actionable natural-language command. Returns null if nothing matched. */
export function parseActionIntent(text: string, ctx: IntentCtx): IntentResult | null {
  const lower = text.toLowerCase().trim()
  const { chores, users, categories, currentUserId } = ctx
  const today = todayISO()

  // "Give Yoav three chores for Sunday"
  const giveMatch = lower.match(/give\s+([a-z]+)\s+(\d+|[a-z]+)\s+chores?(?:\s+(?:for|on)\s+([a-z]+))?/)
  if (giveMatch) {
    const user = resolveUser(giveMatch[1], users, currentUserId)
    const count = parseCount(giveMatch[2])
    const date = giveMatch[3] ? resolveDateWord(giveMatch[3], today) : today
    if (!user) return { reply: `I couldn't find anyone named "${giveMatch[1]}" in your household.` }
    if (!date) return { reply: `I didn't catch which day you meant — try "for Sunday" or "for tomorrow".` }

    const alreadyTitles = new Set(chores.filter((c) => isDueOn(c, date) && c.assigneeIds.includes(user.id)).map((c) => c.title.toLowerCase()))
    const pool = ONBOARDING_CHORE_TEMPLATES.filter((t) => !alreadyTitles.has(t.title.toLowerCase()))
    const picks = (pool.length >= count ? pool : ONBOARDING_CHORE_TEMPLATES).slice(0, count)
    if (picks.length === 0) return { reply: `I couldn't come up with new chores to suggest right now.` }

    const items = picks.map((t) => ({ title: t.title, emoji: t.emoji, categoryId: t.categoryId, estimatedMinutes: t.estimatedMinutes, difficulty: t.difficulty }))
    const lines = items.map((i) => `${i.emoji} ${i.title} (${i.estimatedMinutes} min)`).join('\n')
    return {
      reply: `Here's a suggested plan for ${user.name} on ${friendlyDate(date)}:\n${lines}\n\nWant me to add these?`,
      action: { kind: 'assign-chores', userId: user.id, date, items },
      actionLabel: `Assign ${items.length} chore${items.length === 1 ? '' : 's'} to ${user.name}`,
    }
  }

  // "Move all my chores from tomorrow to Saturday"
  const moveMatch = lower.match(/move\s+all\s+(?:of\s+)?([a-z]+(?:'s)?)\s+chores\s+from\s+([a-z]+)\s+to\s+([a-z]+)/)
  if (moveMatch) {
    const user = resolveUser(moveMatch[1], users, currentUserId)
    const fromDate = resolveDateWord(moveMatch[2], today)
    const toDate = resolveDateWord(moveMatch[3], today)
    if (!user) return { reply: `I couldn't find anyone named "${moveMatch[1]}" in your household.` }
    if (!fromDate || !toDate) return { reply: `I didn't catch those dates — try naming a weekday, "today", or "tomorrow".` }

    const matches = chores.filter((c) => !c.archived && c.assigneeIds.includes(user.id) && isDueOn(c, fromDate))
    if (matches.length === 0) return { reply: `${user.name} doesn't have any chores on ${friendlyDate(fromDate)}.` }

    const lines = matches.map((c) => `${c.emoji} ${c.title}`).join('\n')
    return {
      reply: `${user.name} has ${matches.length} chore${matches.length === 1 ? '' : 's'} on ${friendlyDate(fromDate)}:\n${lines}\n\nMove ${matches.length === 1 ? 'it' : 'them all'} to ${friendlyDate(toDate)}?`,
      action: { kind: 'move-chores', userId: user.id, fromDate, toDate, choreIds: matches.map((c) => c.id) },
      actionLabel: `Move ${matches.length} chore${matches.length === 1 ? '' : 's'} to ${friendlyDate(toDate)}`,
    }
  }

  // "Who has the most chores this week?"
  if (/who\s+has\s+the\s+most\s+chores/.test(lower)) {
    const weekStart = startOfWeek(today)
    const weekEnd = addDays(weekStart, 6)
    const occ = occurrencesForRange(chores, weekStart, weekEnd)
    const tally = new Map<string, number>()
    occ.forEach((o) => o.chore.assigneeIds.forEach((id) => tally.set(id, (tally.get(id) ?? 0) + 1)))
    if (tally.size === 0) return { reply: `No chores are scheduled this week yet.` }
    const ranked = users
      .map((u) => ({ user: u, count: tally.get(u.id) ?? 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
    if (ranked.length === 0) return { reply: `No chores are assigned to anyone this week yet.` }
    const top = ranked[0]
    const rest = ranked.slice(1).map((r) => `${r.user.name} (${r.count})`).join(', ')
    return {
      reply: `${top.user.name} has the most chores this week with ${top.count} scheduled.${rest ? ` Then ${rest}.` : ''}`,
    }
  }

  // "Schedule cleaning the bathroom for Mom every Saturday at 10"
  const schedMatch = lower.match(
    /schedule\s+(.+?)\s+for\s+([a-z]+)\s+every\s+([a-z]+)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/
  )
  if (schedMatch) {
    const user = resolveUser(schedMatch[2], users, currentUserId)
    const dow = weekdayIndexFromWord(schedMatch[3])
    if (!user) return { reply: `I couldn't find anyone named "${schedMatch[2]}" in your household.` }
    if (dow == null) return { reply: `I didn't recognize "${schedMatch[3]}" as a day of the week.` }

    const title = titleCase(schedMatch[1].replace(/^(the|a|an)\s+/, ''))
    const category = guessCategory(title, categories)
    const time = parseTime(schedMatch[4], schedMatch[5], schedMatch[6])
    const startDate = resolveDateWord(schedMatch[3], today) ?? today
    return {
      reply: `I'll schedule "${title}" for ${user.name}, every ${WEEKDAY_LABELS_FULL[dow]}${time ? ` at ${formatTime(time)}` : ''}. Sound good?`,
      action: { kind: 'create-recurring', userId: user.id, title, emoji: category.emoji, categoryId: category.id, daysOfWeek: [dow], startDate, time },
      actionLabel: `Create recurring chore for ${user.name}`,
    }
  }

  return null
}
