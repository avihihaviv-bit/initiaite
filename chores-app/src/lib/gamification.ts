import type { BadgeDef, BadgeId, Difficulty } from '../types'

export const DIFFICULTY_XP: Record<Difficulty, [number, number]> = {
  easy: [5, 15],
  medium: [20, 40],
  hard: [50, 100],
}

export function suggestedXP(difficulty: Difficulty, minutes: number): number {
  const [lo, hi] = DIFFICULTY_XP[difficulty]
  const scaled = lo + (hi - lo) * Math.min(1, minutes / 45)
  return Math.round(scaled / 5) * 5
}

export function suggestedPoints(xp: number): number {
  return Math.round(xp * 0.8)
}

/** XP required cumulatively to *reach* a given level. Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  // gentle exponential-ish curve: 100, 250, 450, 700, 1000, 1350...
  let total = 0
  for (let l = 2; l <= level; l++) {
    total += 100 + (l - 2) * 50
  }
  return total
}

export function levelFromXP(xp: number): { level: number; intoLevel: number; forNext: number } {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const base = xpForLevel(level)
  const nextBase = xpForLevel(level + 1)
  return { level, intoLevel: xp - base, forNext: nextBase - base }
}

export const BADGES: BadgeDef[] = [
  { id: 'fresh-start', name: 'Fresh Start', description: 'Completed your first chore', emoji: '🌱' },
  { id: 'streak-7', name: '7 Day Streak', description: '7 days in a row', emoji: '🔥' },
  { id: 'streak-30', name: '30 Day Streak', description: '30 days in a row', emoji: '🔥' },
  { id: 'cleaning-machine', name: 'Cleaning Machine', description: '25 cleaning chores done', emoji: '🧹' },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Finished a chore in half the estimated time', emoji: '⚡' },
  { id: 'home-hero', name: 'Home Hero', description: '100 total chores completed', emoji: '🏠' },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Completed every chore for 7 days straight', emoji: '💯' },
  { id: 'early-bird', name: 'Early Bird', description: 'Completed a chore before 8am', emoji: '🌅' },
  { id: 'night-owl', name: 'Night Owl', description: 'Completed a chore after 10pm', emoji: '🌙' },
  { id: 'century', name: '100 Chores', description: '100 chores completed all-time', emoji: '🎯' },
  { id: 'hard-worker', name: 'Hard Worker', description: '10 hard chores completed', emoji: '💪' },
  { id: 'team-player', name: 'Team Player', description: 'Helped balance the household fairness score', emoji: '🤝' },
]

export function badgeDef(id: BadgeId): BadgeDef {
  return BADGES.find((b) => b.id === id)!
}
