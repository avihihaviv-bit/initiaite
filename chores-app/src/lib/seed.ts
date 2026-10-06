import type { AppState, Category, Chore, Family, Reward } from '../types'

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

/** A blank slate — no invented family, no chores. The onboarding wizard is
 * what actually builds the household, from the user's own input. */
export function buildDemoState(): AppState {
  const family: Family = { id: 'fam-1', name: '', memberIds: [], fairnessTarget: 85 }

  return {
    family,
    users: [],
    categories: DEFAULT_CATEGORIES,
    chores: [],
    rewards: [],
    redemptions: [],
    earnedBadges: [],
    streaks: [],
    notifications: [],
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
      onboardingComplete: false,
      currentUserId: null,
    },
    chatHistory: [],
  }
}
