import type { Chore, User } from '../types'
import { suggestRebalance, weeklyWorkload, fairnessScore } from './balance'
import { bestNextChore, isBlocked, rankChores } from './priority'
import { todayISO } from './date'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue } from './occurrence'

export interface PlanItem {
  time: string
  emoji: string
  title: string
  minutes: number
  xp: number
  choreId?: string
}

/** Break a free-form task into a realistic step-by-step plan that fits a time budget. */
export function breakDownTask(taskText: string, minutesAvailable: number): PlanItem[] {
  const text = taskText.toLowerCase()

  const library: { match: RegExp; steps: { title: string; minutes: number; emoji: string }[] }[] = [
    {
      match: /room|bedroom|messy/,
      steps: [
        { title: 'Put clothes away', minutes: 5, emoji: '👕' },
        { title: 'Clear the desk', minutes: 7, emoji: '🗂' },
        { title: 'Make the bed', minutes: 3, emoji: '🛏' },
        { title: 'Vacuum the floor', minutes: 10, emoji: '🧹' },
        { title: 'Final cleanup pass', minutes: 5, emoji: '✨' },
      ],
    },
    {
      match: /kitchen|dishes|dishwasher/,
      steps: [
        { title: 'Clear the counters', minutes: 4, emoji: '🍽' },
        { title: 'Load the dishwasher', minutes: 6, emoji: '🧽' },
        { title: 'Wipe down surfaces', minutes: 5, emoji: '🧴' },
        { title: 'Take out the trash', minutes: 5, emoji: '🗑' },
        { title: 'Sweep the floor', minutes: 6, emoji: '🧹' },
      ],
    },
    {
      match: /bathroom/,
      steps: [
        { title: 'Clear the counter', minutes: 3, emoji: '🧴' },
        { title: 'Scrub the sink', minutes: 5, emoji: '🧽' },
        { title: 'Clean the toilet', minutes: 6, emoji: '🚽' },
        { title: 'Wipe mirror & fixtures', minutes: 4, emoji: '🪞' },
        { title: 'Sweep and mop', minutes: 7, emoji: '🧹' },
      ],
    },
    {
      match: /laundry/,
      steps: [
        { title: 'Sort by color', minutes: 4, emoji: '🧺' },
        { title: 'Start a wash load', minutes: 3, emoji: '🌀' },
        { title: 'Fold clean laundry', minutes: 10, emoji: '🧦' },
        { title: 'Put clothes away', minutes: 8, emoji: '🚪' },
      ],
    },
  ]

  const found = library.find((l) => l.match.test(text))
  const base = found?.steps ?? [
    { title: 'Pick the messiest area first', minutes: 5, emoji: '🎯' },
    { title: 'Clear surfaces & put things back', minutes: 10, emoji: '📦' },
    { title: 'Wipe / sweep / tidy', minutes: 10, emoji: '🧹' },
    { title: 'Final walk-through', minutes: 5, emoji: '✅' },
  ]

  // Fit steps to the time budget, scaling down if needed.
  const totalBase = base.reduce((s, b) => s + b.minutes, 0)
  const scale = Math.min(1, minutesAvailable / totalBase)

  let clock = new Date()
  const plan: PlanItem[] = []
  base.forEach((step) => {
    const minutes = Math.max(2, Math.round(step.minutes * scale))
    plan.push({
      time: clock.toTimeString().slice(0, 5),
      emoji: step.emoji,
      title: step.title,
      minutes,
      xp: Math.max(3, Math.round(minutes * 1.6)),
    })
    clock = new Date(clock.getTime() + minutes * 60000)
  })
  return plan
}

export function totalPlanMinutes(plan: PlanItem[]): number {
  return plan.reduce((s, p) => s + p.minutes, 0)
}
export function totalPlanXP(plan: PlanItem[]): number {
  return plan.reduce((s, p) => s + p.xp, 0)
}

/** Generate today's smart plan for a user from their real chores. */
export function generateDailyPlan(chores: Chore[], userId: string): PlanItem[] {
  const today = todayISO()
  const mine = chores.filter(
    (c) =>
      !c.archived &&
      c.assigneeIds.includes(userId) &&
      (isDueOn(c, today) || isOverdue(c, today)) &&
      !isCompletedOn(c, effectiveDueDate(c, today)) &&
      !isBlocked(c, chores)
  )
  const ranked = rankChores(mine)
  return ranked.map((r) => ({
    time: r.chore.dueTime ?? '—',
    emoji: r.chore.emoji,
    title: r.chore.title,
    minutes: r.chore.estimatedMinutes,
    xp: r.chore.xp,
    choreId: r.chore.id,
  }))
}

export function answerAssistant(
  message: string,
  ctx: { chores: Chore[]; users: User[]; currentUserId: string | null }
): string {
  const text = message.toLowerCase().trim()
  const { chores, users, currentUserId } = ctx

  if (/balance|fair|workload/.test(text)) {
    const suggestion = suggestRebalance(chores, users)
    const shares = weeklyWorkload(chores, users)
    const score = fairnessScore(shares)
    if (!suggestion) {
      return `Household fairness is looking solid at ${score}/100. No rebalancing needed right now — nice work sharing the load! 🤝`
    }
    return `Household fairness is ${score}/100. ${suggestion.reasoning} That would raise fairness to ${suggestion.projectedFairness}/100. Want me to make that move? You can accept it from the People tab.`
  }

  if (/overdue|late|behind/.test(text)) {
    const today = todayISO()
    const overdue = chores.filter((c) => !c.archived && isOverdue(c, today))
    if (overdue.length === 0) return `You're all caught up — nothing overdue right now. 🎉`
    return `You have ${overdue.length} overdue chore${overdue.length > 1 ? 's' : ''}: ${overdue
      .slice(0, 4)
      .map((c) => `${c.emoji} ${c.title}`)
      .join(', ')}${overdue.length > 4 ? '…' : ''}. Want to tackle the quickest one first?`
  }

  if (/next|what should i do|do next/.test(text)) {
    const best = bestNextChore(chores, currentUserId, chores)
    if (!best) return `You're all clear! No pending chores need your attention right now. 🌿`
    return `Your best next task: ${best.chore.emoji} ${best.chore.title} — about ${best.chore.estimatedMinutes} min for +${best.chore.xp} XP. ${best.reasons[0] ?? ''}`
  }

  if (/plan|schedule|today/.test(text)) {
    if (!currentUserId) return `Tell me who you are first and I'll build your plan!`
    const plan = generateDailyPlan(chores, currentUserId)
    if (plan.length === 0) return `Nothing scheduled for today — enjoy the free time, or ask me to suggest a chore!`
    const lines = plan.map((p) => `${p.time !== '—' ? p.time : ''} ${p.emoji} ${p.title} (${p.minutes} min)`.trim())
    return `Here's today's plan:\n${lines.join('\n')}\n\nTotal: ${totalPlanMinutes(plan)} min · +${totalPlanXP(plan)} XP potential.`
  }

  if (/\d+\s*(min|minute)/.test(text) || /messy|clean|tidy/.test(text)) {
    const minMatch = text.match(/(\d+)\s*(min|minute)/)
    const minutes = minMatch ? Number(minMatch[1]) : 30
    const plan = breakDownTask(text, minutes)
    const lines = plan.map((p, i) => `${i + 1}. ${p.title} — ${p.minutes} min`)
    return `You can make a big difference in ${minutes} minutes.\n\n${lines.join(
      '\n'
    )}\n\nTotal: ${totalPlanMinutes(plan)} min · Potential XP: +${totalPlanXP(plan)}`
  }

  return `I can help you plan your day, break down a messy room, find your best next task, check overdue chores, or suggest a fairer chore balance. Try asking "what should I do next?" or "I have 20 minutes and my kitchen is a mess."`
}
