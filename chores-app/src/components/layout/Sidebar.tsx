import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { NAV_ITEMS } from '../../nav'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'
import { levelFromXP } from '../../lib/gamification'
import { ProgressBar } from '../ui/ProgressBar'

export function Sidebar() {
  const users = useStore((s) => s.users)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const user = users.find((u) => u.id === currentUserId) ?? users[0]
  const { level, intoLevel, forNext } = user ? levelFromXP(user.xp) : { level: 1, intoLevel: 0, forNext: 100 }

  return (
    <aside className="sticky top-0 hidden h-svh w-[248px] shrink-0 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-lg shadow-[var(--shadow-glow)]">
          🏡
        </div>
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">Homebase</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
              )
            }
          >
            <item.icon size={18} strokeWidth={2.25} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <NavLink to="/settings" className="focus-ring mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 transition hover:bg-border/40">
          <Avatar emoji={user.avatarEmoji} color={user.color} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{user.name}</p>
            <p className="text-[11px] font-semibold text-ink-faint">Level {level}</p>
            <ProgressBar value={forNext ? (intoLevel / forNext) * 100 : 100} height={5} className="mt-1" />
          </div>
        </NavLink>
      )}
    </aside>
  )
}
