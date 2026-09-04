import { BarChart3, Bot, Calendar, CalendarClock, Gift, Home, ListChecks, Settings, Users } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  id: string
  path: string
  label: string
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  emoji: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', path: '/', label: 'Home', icon: Home, emoji: '🏠' },
  { id: 'chores', path: '/chores', label: 'All Chores', icon: ListChecks, emoji: '📋' },
  { id: 'people', path: '/people', label: 'People', icon: Users, emoji: '👥' },
  { id: 'calendar', path: '/calendar', label: 'Calendar', icon: Calendar, emoji: '📅' },
  { id: 'schedule', path: '/schedule', label: 'Schedule', icon: CalendarClock, emoji: '🗓' },
  { id: 'rewards', path: '/rewards', label: 'Rewards', icon: Gift, emoji: '🏆' },
  { id: 'stats', path: '/stats', label: 'Statistics', icon: BarChart3, emoji: '📊' },
  { id: 'ai', path: '/ai', label: 'AI Assistant', icon: Bot, emoji: '🤖' },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings, emoji: '⚙️' },
]

// Primary items shown directly in the mobile bottom nav; the rest live in "More".
export const MOBILE_PRIMARY_IDS = ['home', 'chores', 'calendar', 'people']
