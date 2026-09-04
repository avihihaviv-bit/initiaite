import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckSquare, Plus, Search, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ChoreCard } from '../components/chores/ChoreCard'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { ChoreTimerModal } from '../components/chores/ChoreTimerModal'
import { Select } from '../components/ui/Select'
import { rankChores } from '../lib/priority'
import { friendlyDate, todayISO } from '../lib/date'
import { effectiveDueDate, isCompletedOn, isDueOn, isOverdue } from '../lib/occurrence'
import { useToast } from '../components/ui/Toast'

type StatusFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
]

export default function Chores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const chores = useStore((s) => s.chores)
  const users = useStore((s) => s.users)
  const categories = useStore((s) => s.categories)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const bulkComplete = useStore((s) => s.bulkComplete)
  const bulkAssign = useStore((s) => s.bulkAssign)
  const { show } = useToast()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [highPriorityOnly, setHighPriorityOnly] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [editChoreId, setEditChoreId] = useState<string | null>(null)
  const [timerChoreId, setTimerChoreId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const openChore = chores.find((c) => c.id === openChoreId) ?? null
  const editChore = chores.find((c) => c.id === editChoreId) ?? null
  const timerChore = chores.find((c) => c.id === timerChoreId) ?? null

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      const c = chores.find((ch) => ch.id === openId)
      if (c) setOpenChoreId(c.id)
      searchParams.delete('open')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const today = todayISO()

  const filtered = useMemo(() => {
    let list = chores.filter((c) => !c.archived)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((c) => {
        const names = users.filter((u) => c.assigneeIds.includes(u.id)).map((u) => u.name.toLowerCase())
        return c.title.toLowerCase().includes(q) || names.some((n) => n.includes(q)) || c.priority.includes(q)
      })
    }
    if (mineOnly) list = list.filter((c) => !!currentUserId && c.assigneeIds.includes(currentUserId))
    if (highPriorityOnly) list = list.filter((c) => c.priority === 'high' || c.priority === 'urgent')
    if (categoryFilter !== 'all') list = list.filter((c) => c.categoryId === categoryFilter)

    switch (status) {
      case 'today':
        list = list.filter((c) => isDueOn(c, today) && !isCompletedOn(c, today))
        break
      case 'upcoming':
        list = list.filter((c) => effectiveDueDate(c, today) > today)
        break
      case 'overdue':
        list = list.filter((c) => isOverdue(c, today))
        break
      case 'completed':
        list = list.filter((c) => isCompletedOn(c, effectiveDueDate(c, today)))
        break
      default:
        break
    }
    return list
  }, [chores, query, mineOnly, highPriorityOnly, categoryFilter, status, currentUserId, today, users])

  const ranked = useMemo(() => rankChores(filtered), [filtered])

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof ranked>()
    ranked.forEach((r) => {
      const key = effectiveDueDate(r.chore, today)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    })
    return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  }, [ranked, today])

  const toggleSelect = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="space-y-5 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">My Chores</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{filtered.length} chore{filtered.length === 1 ? '' : 's'} matching your filters</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectMode ? 'primary' : 'secondary'}
            icon={<CheckSquare size={15} />}
            onClick={() => {
              setSelectMode((v) => !v)
              setSelectedIds([])
            }}
          >
            {selectMode ? 'Done selecting' : 'Select'}
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Add chore</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chores, people, priority…"
            className="focus-ring h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm font-medium text-ink placeholder:text-ink-faint"
          />
        </div>

        <div className="no-scrollbar scroll-fade-x flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                status === f.id ? 'border-primary-400 bg-primary-500 text-white' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="mx-1 h-5 w-px shrink-0 bg-border" />
          <button
            onClick={() => setMineOnly((v) => !v)}
            className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              mineOnly ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
            }`}
          >
            Mine
          </button>
          <button
            onClick={() => setHighPriorityOnly((v) => !v)}
            className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              highPriorityOnly ? 'border-primary-400 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'border-border bg-surface text-ink-soft hover:bg-surface-2'
            }`}
          >
            High priority
          </button>
          <div className="w-40 shrink-0">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!h-8 !text-xs">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {selectMode && selectedIds.length > 0 && (
        <div className="sticky top-[64px] z-20 flex items-center justify-between gap-3 rounded-2xl border border-primary-300 bg-primary-50 px-4 py-3 dark:bg-primary-900/30">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-200">{selectedIds.length} selected</span>
          <div className="flex items-center gap-2">
            <div className="w-40">
              <Select
                onChange={(e) => {
                  if (!e.target.value) return
                  bulkAssign(selectedIds, e.target.value === 'unassign' ? null : e.target.value)
                  show(`Assigned ${selectedIds.length} chore${selectedIds.length > 1 ? 's' : ''}`)
                  setSelectedIds([])
                }}
                defaultValue=""
                className="!h-9"
              >
                <option value="" disabled>Assign to…</option>
                <option value="unassign">Unassign</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.avatarEmoji} {u.name}</option>
                ))}
              </Select>
            </div>
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                bulkComplete(selectedIds)
                show(`Completed ${selectedIds.length} chore${selectedIds.length > 1 ? 's' : ''} 🎉`)
                setSelectedIds([])
              }}
            >
              Complete all
            </Button>
            <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setSelectedIds([])}>Clear</Button>
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No chores match"
          description="Try clearing filters, or add a new chore to get started."
          action={<Button icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Add a chore</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-ink-faint">{friendlyDate(date)}</h3>
              <div className="space-y-2.5">
                {items.map((r) => (
                  <ChoreCard
                    key={r.chore.id}
                    chore={r.chore}
                    onOpen={() => setOpenChoreId(r.chore.id)}
                    onEdit={() => setEditChoreId(r.chore.id)}
                    onStartTimer={() => setTimerChoreId(r.chore.id)}
                    selectable={selectMode}
                    selected={selectedIds.includes(r.chore.id)}
                    onToggleSelect={() => toggleSelect(r.chore.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ChoreDetailModal chore={openChore} onClose={() => setOpenChoreId(null)} onEdit={() => { setEditChoreId(openChoreId); setOpenChoreId(null) }} />
      <ChoreFormModal open={!!editChore} onClose={() => setEditChoreId(null)} editChore={editChore} />
      <ChoreFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ChoreTimerModal chore={timerChore} onClose={() => setTimerChoreId(null)} />
    </div>
  )
}
