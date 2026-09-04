import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { NAV_ITEMS } from '../../nav'
import { NotificationPanel } from './NotificationPanel'
import { ThemeToggle } from './ThemeToggle'
import { UserSwitcher } from './UserSwitcher'
import { SearchPalette, useGlobalSearchShortcut } from './SearchPalette'

export function TopBar() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  useGlobalSearchShortcut(() => setSearchOpen(true))
  const current =
    NAV_ITEMS.find((i) => i.path === location.pathname) ??
    NAV_ITEMS.find((i) => i.path !== '/' && location.pathname.startsWith(i.path))

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-canvas/80 px-4 py-3 backdrop-blur-lg sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <span className="text-lg">{current?.emoji ?? '🏡'}</span>
        <span className="font-display text-base font-extrabold text-ink">{current?.label ?? 'Homebase'}</span>
      </div>
      <h1 className="hidden font-display text-lg font-extrabold text-ink lg:block">{current?.label ?? 'Home'}</h1>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-ink-faint transition hover:bg-surface-2 hover:text-ink"
          aria-label="Search"
        >
          <Search size={16} />
          <span className="hidden text-xs font-semibold sm:inline">Search</span>
          <kbd className="hidden rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold sm:inline">⌘K</kbd>
        </button>
        <div className="hidden md:block">
          <ThemeToggle compact />
        </div>
        <NotificationPanel />
        <UserSwitcher />
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
