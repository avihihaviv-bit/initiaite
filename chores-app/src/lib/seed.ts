import type {
  AppState, Category, Chore, CompletionRecord, EarnedBadge, Family, Reward, StreakInfo, User,
} from '../types'
import { uid } from './id'
import { addDays, todayISO } from './date'
import { levelFromXP } from './gamification'

const today = todayISO()

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-cleaning', name: 'Cleaning', emoji: '🧹', color: '#7c5cff' },
  { id: 'cat-kitchen', name: 'Kitchen', emoji: '🍽', color: '#ff9f0a' },
  { id: 'cat-laundry', name: 'Laundry', emoji: '🧺', color: '#2f8fef' },
  { id: 'cat-trash', name: 'Trash', emoji: '🗑', color: '#6b6580' },
  { id: 'cat-bedroom', name: 'Bedroom', emoji: '🛏', color: '#ff6bd6' },
  { id: 'cat-bathroom', name: 'Bathroom', emoji: '🛁', color: '#4fd1c5' },
  { id: 'cat-outside', name: 'Outside', emoji: '🌳', color: '#33c17a' },
  { id: 'cat-pets', name: 'Pets', emoji: '🐶', color: '#e6810a' },
  { id: 'cat-shopping', name: 'Shopping', emoji: '🛒', color: '#f0403f' },
  { id: 'cat-maintenance', name: 'Maintenance', emoji: '🔧', color: '#8b6bff' },
  { id: 'cat-organization', name: 'Organization', emoji: '📦', color: '#f2a90c' },
]

export interface OnboardingChoreTemplate {
  id: string
  title: string
  emoji: string
  categoryId: string
  estimatedMinutes: number
  difficulty: Chore['difficulty']
  frequency: Chore['recurrence']['frequency']
}

export const ONBOARDING_CHORE_TEMPLATES: OnboardingChoreTemplate[] = [
  { id: 'tpl-bed', title: 'Make bed', emoji: '🛏', categoryId: 'cat-bedroom', estimatedMinutes: 3, difficulty: 'easy', frequency: 'daily' },
  { id: 'tpl-room', title: 'Clean bedroom', emoji: '🧹', categoryId: 'cat-cleaning', estimatedMinutes: 15, difficulty: 'medium', frequency: 'weekly' },
  { id: 'tpl-dishwasher', title: 'Load dishwasher', emoji: '🍽', categoryId: 'cat-kitchen', estimatedMinutes: 10, difficulty: 'easy', frequency: 'daily' },
  { id: 'tpl-trash', title: 'Take out trash', emoji: '🗑', categoryId: 'cat-trash', estimatedMinutes: 5, difficulty: 'easy', frequency: 'weekly' },
  { id: 'tpl-laundry', title: 'Fold laundry', emoji: '🧺', categoryId: 'cat-laundry', estimatedMinutes: 20, difficulty: 'medium', frequency: 'weekly' },
  { id: 'tpl-bathroom', title: 'Clean bathroom', emoji: '🧼', categoryId: 'cat-bathroom', estimatedMinutes: 25, difficulty: 'hard', frequency: 'weekly' },
  { id: 'tpl-dog', title: 'Feed the dog', emoji: '🐶', categoryId: 'cat-pets', estimatedMinutes: 5, difficulty: 'easy', frequency: 'daily' },
  { id: 'tpl-plants', title: 'Water plants', emoji: '🌳', categoryId: 'cat-outside', estimatedMinutes: 8, difficulty: 'easy', frequency: 'weekly' },
]

function buildUsers(): User[] {
  return [
    { id: 'u-yoav', name: 'Yoav', avatarEmoji: '👦', color: '#7c5cff', role: 'child', xp: 0, points: 0, createdAt: today },
    { id: 'u-mom', name: 'Mom', avatarEmoji: '👩', color: '#ff6bd6', role: 'admin', xp: 0, points: 0, createdAt: today },
    { id: 'u-dad', name: 'Dad', avatarEmoji: '👨', color: '#2f8fef', role: 'admin', xp: 0, points: 0, createdAt: today },
    { id: 'u-sis', name: 'Sister', avatarEmoji: '👧', color: '#ff9f0a', role: 'child', xp: 0, points: 0, createdAt: today },
  ]
}

interface SeedChoreSpec {
  id: string
  title: string
  emoji: string
  categoryId: string
  assigneeIds: string[]
  priority: Chore['priority']
  difficulty: Chore['difficulty']
  estimatedMinutes: number
  dueTime?: string
  frequency: Chore['recurrence']['frequency']
  daysOfWeek?: number[]
  color: string
}

const SPECS: SeedChoreSpec[] = [
  { id: 'c-makebed', title: 'Make bed', emoji: '🛏', categoryId: 'cat-bedroom', assigneeIds: ['u-yoav'], priority: 'low', difficulty: 'easy', estimatedMinutes: 3, dueTime: '08:00', frequency: 'daily', color: '#ff6bd6' },
  { id: 'c-cleanroom', title: 'Clean bedroom', emoji: '🧹', categoryId: 'cat-cleaning', assigneeIds: ['u-yoav'], priority: 'high', difficulty: 'medium', estimatedMinutes: 15, dueTime: '16:30', frequency: 'weekly', daysOfWeek: [6], color: '#7c5cff' },
  { id: 'c-dishwasher', title: 'Load dishwasher', emoji: '🍽', categoryId: 'cat-kitchen', assigneeIds: ['u-mom'], priority: 'medium', difficulty: 'easy', estimatedMinutes: 10, dueTime: '20:00', frequency: 'daily', color: '#ff9f0a' },
  { id: 'c-trash', title: 'Take out trash', emoji: '🗑', categoryId: 'cat-trash', assigneeIds: ['u-dad'], priority: 'high', difficulty: 'easy', estimatedMinutes: 5, dueTime: '18:00', frequency: 'weekly', daysOfWeek: [0, 3], color: '#6b6580' },
  { id: 'c-laundry', title: 'Fold laundry', emoji: '🧺', categoryId: 'cat-laundry', assigneeIds: ['u-sis'], priority: 'medium', difficulty: 'medium', estimatedMinutes: 20, dueTime: '17:00', frequency: 'weekly', daysOfWeek: [2, 5], color: '#2f8fef' },
  { id: 'c-bathroom', title: 'Clean bathroom', emoji: '🧼', categoryId: 'cat-bathroom', assigneeIds: ['u-mom'], priority: 'high', difficulty: 'hard', estimatedMinutes: 25, dueTime: '11:00', frequency: 'weekly', daysOfWeek: [6], color: '#4fd1c5' },
  { id: 'c-dog', title: 'Feed the dog', emoji: '🐶', categoryId: 'cat-pets', assigneeIds: ['u-sis'], priority: 'urgent', difficulty: 'easy', estimatedMinutes: 5, dueTime: '07:30', frequency: 'daily', color: '#e6810a' },
  { id: 'c-plants', title: 'Water plants', emoji: '🌳', categoryId: 'cat-outside', assigneeIds: ['u-dad'], priority: 'low', difficulty: 'easy', estimatedMinutes: 8, dueTime: '09:00', frequency: 'weekly', daysOfWeek: [1, 4], color: '#33c17a' },
  { id: 'c-vacuum', title: 'Vacuum living room', emoji: '🧹', categoryId: 'cat-cleaning', assigneeIds: ['u-dad', 'u-yoav'], priority: 'medium', difficulty: 'medium', estimatedMinutes: 20, dueTime: '10:00', frequency: 'weekly', daysOfWeek: [6], color: '#7c5cff' },
  { id: 'c-sheets', title: 'Change bedsheets', emoji: '🛏', categoryId: 'cat-bedroom', assigneeIds: ['u-mom'], priority: 'low', difficulty: 'medium', estimatedMinutes: 15, dueTime: '12:00', frequency: 'biweekly', daysOfWeek: [6], color: '#ff6bd6' },
  { id: 'c-groceries', title: 'Grocery shopping', emoji: '🛒', categoryId: 'cat-shopping', assigneeIds: ['u-mom'], priority: 'medium', difficulty: 'medium', estimatedMinutes: 45, dueTime: '15:00', frequency: 'weekly', daysOfWeek: [0], color: '#f0403f' },
  { id: 'c-lightbulb', title: 'Fix hallway light', emoji: '🔧', categoryId: 'cat-maintenance', assigneeIds: ['u-dad'], priority: 'low', difficulty: 'medium', estimatedMinutes: 15, frequency: 'none', color: '#8b6bff' },
  { id: 'c-garage', title: 'Organize garage shelf', emoji: '📦', categoryId: 'cat-organization', assigneeIds: [], priority: 'low', difficulty: 'hard', estimatedMinutes: 40, frequency: 'none', color: '#f2a90c' },
]

function xpFor(spec: SeedChoreSpec): number {
  const base = { easy: 10, medium: 30, hard: 70 }[spec.difficulty]
  return Math.round((base + spec.estimatedMinutes * 0.4) / 5) * 5
}

function buildChores(): Chore[] {
  return SPECS.map((s) => {
    const xp = xpFor(s)
    const points = Math.round(xp * 0.8)
    const history: CompletionRecord[] = []

    if (s.frequency !== 'none') {
      // Backfill ~14 days of plausible completion history for stats/streaks.
      for (let d = 14; d >= 1; d--) {
        const dateISO = addDays(today, -d)
        const dow = new Date(dateISO).getDay()
        let occurs = false
        if (s.frequency === 'daily') occurs = true
        else if (s.frequency === 'weekly' || s.frequency === 'biweekly') occurs = (s.daysOfWeek ?? []).includes(dow)
        if (!occurs) continue
        // ~82% completion rate historically, weighted slightly better for lower-priority easy chores
        const chance = s.difficulty === 'easy' ? 0.88 : s.difficulty === 'medium' ? 0.8 : 0.68
        if (Math.random() < chance) {
          const completer = s.assigneeIds[Math.floor(Math.random() * s.assigneeIds.length)] ?? 'u-mom'
          history.push({
            id: uid('rec'),
            occurrenceDate: dateISO,
            completedBy: completer,
            completedAt: `${dateISO}T${s.dueTime ?? '18:00'}:00.000Z`,
            xpEarned: xp,
            pointsEarned: points,
            durationMinutes: Math.max(2, s.estimatedMinutes + Math.round((Math.random() - 0.5) * 6)),
            onTime: Math.random() > 0.15,
          })
        }
      }
    }

    return {
      id: s.id,
      title: s.title,
      description: '',
      emoji: s.emoji,
      categoryId: s.categoryId,
      assigneeIds: s.assigneeIds,
      priority: s.priority,
      difficulty: s.difficulty,
      estimatedMinutes: s.estimatedMinutes,
      points,
      xp,
      dueDate: today,
      dueTime: s.dueTime,
      recurrence: {
        frequency: s.frequency,
        daysOfWeek: s.daysOfWeek,
        startDate: addDays(today, -30),
      },
      reminder: s.dueTime ? '30-before' : 'none',
      subtasks:
        s.id === 'c-cleanroom'
          ? [
              { id: uid('st'), title: 'Make bed', done: false },
              { id: uid('st'), title: 'Put clothes away', done: false },
              { id: uid('st'), title: 'Clean desk', done: false },
              { id: uid('st'), title: 'Vacuum', done: false },
              { id: uid('st'), title: 'Empty trash', done: false },
            ]
          : [],
      dependsOn: [],
      comments: [],
      photos: [],
      history,
      createdAt: addDays(today, -30),
      archived: false,
      color: s.color,
    } satisfies Chore
  })
}

export function buildRewards(): Reward[] {
  return [
    { id: 'r-gaming', name: '30 min extra gaming', emoji: '🎮', description: 'Extend screen time by half an hour.', cost: 150, requiresApproval: false, availability: 'always', createdBy: 'u-mom' },
    { id: 'r-dinner', name: 'Choose dinner', emoji: '🍕', description: 'Pick what the whole family eats tonight.', cost: 200, requiresApproval: true, availability: 'always', createdBy: 'u-mom' },
    { id: 'r-movie', name: 'Pick the movie', emoji: '🎬', description: 'Family movie night, your pick.', cost: 180, requiresApproval: false, availability: 'always', createdBy: 'u-dad' },
    { id: 'r-cash', name: '10 ₪ allowance', emoji: '💰', description: 'Cash reward added to your allowance.', cost: 400, requiresApproval: true, availability: 'always', createdBy: 'u-dad' },
    { id: 'r-weekend', name: 'Choose weekend activity', emoji: '🏖', description: 'You decide what the family does this weekend.', cost: 500, requiresApproval: true, availability: 'limited', stock: 1, createdBy: 'u-mom' },
    { id: 'r-sleepover', name: 'Friend sleepover', emoji: '🛌', description: 'Invite a friend to stay over.', cost: 350, requiresApproval: true, availability: 'always', createdBy: 'u-mom' },
  ]
}

function computeXPAndPoints(users: User[], chores: Chore[]): User[] {
  return users.map((u) => {
    let xp = 0
    let points = 0
    chores.forEach((c) => {
      c.history.forEach((h) => {
        if (h.completedBy === u.id) {
          xp += h.xpEarned
          points += h.pointsEarned
        }
      })
    })
    // spend a little so the reward shop feels used
    const spent = Math.round(points * 0.35)
    return { ...u, xp, points: Math.max(0, points - spent) }
  })
}

function buildStreaks(chores: Chore[], users: User[]): StreakInfo[] {
  return users.map((u) => {
    let current = 0
    for (let d = 0; d < 60; d++) {
      const dateISO = addDays(today, -d)
      const didAnything = chores.some((c) => c.history.some((h) => h.occurrenceDate === dateISO && h.completedBy === u.id))
      if (didAnything) current++
      else if (d === 0) continue
      else break
    }
    return {
      userId: u.id,
      current,
      longest: Math.max(current, current + Math.floor(Math.random() * 4)),
      lastCompletedDate: current > 0 ? today : null,
      freezeAvailable: true,
      freezeUsedThisMonth: false,
    }
  })
}

function buildEarnedBadges(users: User[], streaks: StreakInfo[]): EarnedBadge[] {
  const out: EarnedBadge[] = []
  users.forEach((u) => {
    out.push({ badgeId: 'fresh-start', userId: u.id, earnedAt: addDays(today, -25) })
    const streak = streaks.find((s) => s.userId === u.id)
    if (streak && streak.longest >= 7) out.push({ badgeId: 'streak-7', userId: u.id, earnedAt: addDays(today, -3) })
    const { level } = levelFromXP(u.xp)
    if (level >= 5) out.push({ badgeId: 'hard-worker', userId: u.id, earnedAt: addDays(today, -10) })
  })
  return out
}

export function buildDemoState(): AppState {
  const family: Family = { id: 'fam-1', name: 'The Household', memberIds: [], fairnessTarget: 85 }
  const users = buildUsers()
  family.memberIds = users.map((u) => u.id)
  const choresRaw = buildChores()
  const users2 = computeXPAndPoints(users, choresRaw)
  const streaks = buildStreaks(choresRaw, users2)
  const earnedBadges = buildEarnedBadges(users2, streaks)

  return {
    family,
    users: users2,
    categories: DEFAULT_CATEGORIES,
    chores: choresRaw,
    rewards: buildRewards(),
    redemptions: [
      { id: uid('rdm'), rewardId: 'r-gaming', userId: 'u-yoav', status: 'fulfilled', requestedAt: addDays(today, -5), resolvedAt: addDays(today, -5) },
    ],
    earnedBadges,
    streaks,
    notifications: [
      { id: uid('ntf'), title: '🔥 Keep it going', body: "Complete one more chore today to protect your streak.", createdAt: `${today}T09:00:00.000Z`, read: false, kind: 'streak' },
      { id: uid('ntf'), title: '⚠️ Overdue', body: 'Fix hallway light has been open for a while.', createdAt: `${today}T08:00:00.000Z`, read: false, kind: 'overdue' },
      { id: uid('ntf'), title: '🏆 Almost there', body: "You're close to your next level — a couple more chores will do it.", createdAt: addDays(today, -1) + 'T19:00:00.000Z', read: true, kind: 'level' },
    ],
    settings: {
      themeMode: 'system',
      confetti: true,
      haptics: true,
      notifications: {
        choreReminders: true,
        overdueAlerts: true,
        streakNudges: true,
        levelUps: true,
        rewardUpdates: true,
        balanceSuggestions: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:30',
      },
      onboardingComplete: true,
      currentUserId: 'u-yoav',
    },
    chatHistory: [],
  }
}
