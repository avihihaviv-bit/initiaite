import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import clsx from 'clsx'
import { MOBILE_PRIMARY_IDS, NAV_ITEMS } from '../../nav'
import { MoreSheet } from './MoreSheet'

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const primary = NAV_ITEMS.filter((i) => MOBILE_PRIMARY_IDS.includes(i.id))
  const rest = NAV_ITEMS.filter((i) => !MOBILE_PRIMARY_IDS.includes(i.id))
  const restActive = rest.some((r) => location.pathname === r.path)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {primary.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'focus-ring flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  isActive ? 'text-primary-500' : 'text-ink-faint'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label === 'My Chores' ? 'Chores' : item.label}
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx(
              'focus-ring flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
              restActive ? 'text-primary-500' : 'text-ink-faint'
            )}
          >
            <Menu size={22} strokeWidth={restActive ? 2.5 : 2} />
            More
          </button>
        </div>
      </nav>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} items={rest} />
    </>
  )
}
