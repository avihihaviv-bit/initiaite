import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'

export function UserSwitcher() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const users = useStore((s) => s.users)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const setCurrentUser = useStore((s) => s.setCurrentUser)
  const current = users.find((u) => u.id === currentUserId) ?? users[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!current) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 pr-2.5 transition hover:bg-surface-2"
      >
        <Avatar emoji={current.avatarEmoji} color={current.color} size={28} />
        <span className="hidden text-sm font-bold text-ink sm:inline">{current.name}</span>
        <ChevronDown size={14} className="text-ink-faint" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"
          >
            <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Switch profile</p>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setCurrentUser(u.id)
                  setOpen(false)
                }}
                className="focus-ring flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-surface-2"
              >
                <Avatar emoji={u.avatarEmoji} color={u.color} size={30} />
                <span className="flex-1 text-sm font-semibold text-ink">{u.name}</span>
                {u.id === current.id && <span className="h-2 w-2 rounded-full bg-primary-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
