// Core domain types for Homebase — the household chores app.

export type Role = 'admin' | 'member' | 'child' | 'guest'
export type ThemeMode = 'light' | 'dark' | 'system'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type ChoreStatus = 'pending' | 'completed' | 'skipped' | 'overdue'

export interface User {
  id: string
  name: string
  avatarEmoji: string
  color: string // hex used for accents/charts
  role: Role
  gender?: 'male' | 'female'
  age?: number
  xp: number
  points: number // spendable currency for reward shop
  createdAt: string
}

export interface Family {
  id: string
  name: string
  memberIds: string[]
  fairnessTarget: number // 0-100, desired balance tolerance
}

export interface Category {
  id: string
  name: string
  emoji: string
  color: string
}

export type RepeatFrequency =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom'

export interface RecurrenceRule {
  frequency: RepeatFrequency
  /** 0=Sun..6=Sat, used for weekly/biweekly/custom */
  daysOfWeek?: number[]
  /** anchor date (ISO) recurrence is computed relative to */
  startDate: string
  /** ISO date after which the recurrence stops, optional */
  endDate?: string
  /** dates (ISO, yyyy-mm-dd) skipped without breaking the streak/series */
  skippedDates?: string[]
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface ChoreComment {
  id: string
  authorId: string
  text: string
  createdAt: string
}

export interface ChorePhoto {
  id: string
  kind: 'before' | 'after'
  emoji: string // stand-in for an uploaded photo in this demo
  note?: string
}

export interface CompletionRecord {
  id: string
  occurrenceDate: string // ISO yyyy-mm-dd this completion corresponds to
  completedBy: string
  completedAt: string // full ISO timestamp
  xpEarned: number
  pointsEarned: number
  durationMinutes?: number
  onTime: boolean
}

export interface Chore {
  id: string
  title: string
  description?: string
  emoji: string
  categoryId: string
  /** empty array = unassigned. Multiple ids = shared responsibility (anyone can complete it). */
  assigneeIds: string[]
  priority: Priority
  difficulty: Difficulty
  estimatedMinutes: number
  points: number
  xp: number
  dueDate: string // ISO yyyy-mm-dd for the next/only occurrence
  dueTime?: string // HH:mm
  recurrence: RecurrenceRule
  reminder?: 'none' | 'at-time' | '15-before' | '30-before' | '1h-before'
  subtasks: Subtask[]
  dependsOn: string[] // chore ids that must be completed first (for this occurrence)
  comments: ChoreComment[]
  photos: ChorePhoto[]
  history: CompletionRecord[]
  createdAt: string
  archived: boolean
  color: string
}

export interface Reward {
  id: string
  name: string
  emoji: string
  description: string
  cost: number
  requiresApproval: boolean
  availability: 'always' | 'limited'
  stock?: number
  createdBy: string
}

export interface RewardRedemption {
  id: string
  rewardId: string
  userId: string
  status: 'pending' | 'approved' | 'denied' | 'fulfilled'
  requestedAt: string
  resolvedAt?: string
}

export type BadgeId =
  | 'streak-7'
  | 'streak-30'
  | 'cleaning-machine'
  | 'speed-demon'
  | 'home-hero'
  | 'perfect-week'
  | 'early-bird'
  | 'night-owl'
  | 'century'
  | 'hard-worker'
  | 'team-player'
  | 'fresh-start'

export interface BadgeDef {
  id: BadgeId
  name: string
  description: string
  emoji: string
}

export interface EarnedBadge {
  badgeId: BadgeId
  userId: string
  earnedAt: string
}

export interface StreakInfo {
  userId: string
  current: number
  longest: number
  lastCompletedDate: string | null
  freezeAvailable: boolean
  freezeUsedThisMonth: boolean
}

export interface AppNotification {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  kind: 'reminder' | 'overdue' | 'streak' | 'level' | 'reward' | 'balance' | 'system'
}

export interface NotificationSettings {
  choreReminders: boolean
  overdueAlerts: boolean
  streakNudges: boolean
  levelUps: boolean
  rewardUpdates: boolean
  balanceSuggestions: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export interface AppSettings {
  themeMode: ThemeMode
  confetti: boolean
  haptics: boolean
  notifications: NotificationSettings
  onboardingComplete: boolean
  currentUserId: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  /** A proposed action awaiting user confirmation (e.g. "assign 3 chores to Yoav"). */
  pendingAction?: import('../lib/aiIntents').PendingAction
  actionLabel?: string
  actionStatus?: 'proposed' | 'applied' | 'dismissed'
}

export interface AppState {
  family: Family
  users: User[]
  categories: Category[]
  chores: Chore[]
  rewards: Reward[]
  redemptions: RewardRedemption[]
  earnedBadges: EarnedBadge[]
  streaks: StreakInfo[]
  notifications: AppNotification[]
  settings: AppSettings
  chatHistory: ChatMessage[]
}
