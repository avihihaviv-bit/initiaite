import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { friendlyDate } from '../../lib/date'

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const chores = useStore((s) => s.chores)
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const active = chores.filter((c) => !c.archived)
    if (!q) return active.slice(0, 8)
    return active
      .filter((c) => {
        const names = users.filter((u) => c.assigneeIds.includes(u.id)).map((u) => u.name.toLowerCase())
        const category = categories.find((cat) => cat.id === c.categoryId)?.name ?? ''
        return (
          c.title.toLowerCase().includes(q) ||
          names.some((n) => n.includes(q)) ||
          category.toLowerCase().includes(q) ||
          c.priority.includes(q)
        )
      })
      .slice(0, 8)
  }, [query, chores, users, categories])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
              <Search size={18} className="text-ink-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chores, people, categories…"
                className="flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink-faint"
              />
              <kbd className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-faint">ESC</kbd>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-ink-soft">No chores match "{query}"</p>
              ) : (
                results.map((c) => {
                  const primaryAssignee = users.find((u) => c.assigneeIds[0] === u.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        navigate(`/chores?open=${c.id}`)
                        onClose()
                      }}
                      className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{c.title}</span>
                        <span className="block text-xs text-ink-faint">
                          {friendlyDate(c.dueDate)} {primaryAssignee ? `· ${primaryAssignee.name}${c.assigneeIds.length > 1 ? ` +${c.assigneeIds.length - 1}` : ''}` : ''}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
