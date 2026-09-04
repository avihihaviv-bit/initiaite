import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellRing, CheckCheck } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/useStore'
import { timeAgo } from '../../lib/date'
import { EmptyState } from '../ui/EmptyState'

const KIND_EMOJI: Record<string, string> = {
  reminder: '⏰', overdue: '⚠️', streak: '🔥', level: '🏆', reward: '🎁', balance: '⚖️', system: '🔔',
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationRead)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition hover:bg-surface-2 hover:text-ink"
      >
        {unread > 0 ? <BellRing size={19} /> : <Bell size={19} />}
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-display text-sm font-bold text-ink">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="focus-ring flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-500 hover:bg-primary-50">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4">
                  <EmptyState emoji="🔕" title="No notifications" description="You're all caught up." />
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={clsx(
                      'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition last:border-0 hover:bg-surface-2',
                      !n.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                    )}
                  >
                    <span className="text-lg">{KIND_EMOJI[n.kind] ?? '🔔'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-ink">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-ink-faint">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
