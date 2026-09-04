import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/Tabs'
import { MonthView, monthLabel } from '../components/calendar/MonthView'
import { WeekView } from '../components/calendar/WeekView'
import { AgendaView } from '../components/calendar/AgendaView'
import { DayDetailModal } from '../components/calendar/DayDetailModal'
import { ChoreDetailModal } from '../components/chores/ChoreDetailModal'
import { ChoreFormModal } from '../components/chores/ChoreFormModal'
import { addDays, todayISO } from '../lib/date'
import { occurrencesForRange } from '../lib/occurrence'
import { useMediaQuery } from '../hooks/useMediaQuery'

type ViewMode = 'month' | 'week' | 'agenda'

export default function CalendarPage() {
  const chores = useStore((s) => s.chores)
  const isSmallScreen = useMediaQuery('(max-width: 639px)')
  const [view, setView] = useState<ViewMode | null>(null)
  const activeView = view ?? (isSmallScreen ? 'agenda' : 'month')
  const [anchor, setAnchor] = useState(todayISO())
  const [dayModalDate, setDayModalDate] = useState<string | null>(null)
  const [openChoreId, setOpenChoreId] = useState<string | null>(null)
  const [editChoreId, setEditChoreId] = useState<string | null>(null)
  const [createDate, setCreateDate] = useState<string | null>(null)

  const openChore = chores.find((c) => c.id === openChoreId) ?? null
  const editChore = chores.find((c) => c.id === editChoreId) ?? null
  const dayOccurrences = dayModalDate ? occurrencesForRange(chores, dayModalDate, dayModalDate) : []

  const shift = (dir: 1 | -1) => {
    const amount = activeView === 'month' ? 30 * dir : 7 * dir
    setAnchor((a) => addDays(a, amount))
  }

  const openChoreById = (id: string) => {
    const c = chores.find((ch) => ch.id === id)
    if (c) {
      setOpenChoreId(c.id)
      setDayModalDate(null)
    }
  }

  return (
    <div className="space-y-5 animate-[var(--animate-in)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Calendar</h1>
          <p className="mt-0.5 text-sm text-ink-soft">Every chore, color-coded and always in view.</p>
        </div>
        <SegmentedControl
          options={[{ id: 'month', label: 'Month' }, { id: 'week', label: 'Week' }, { id: 'agenda', label: 'Agenda' }]}
          value={activeView}
          onChange={(v) => setView(v as ViewMode)}
        />
      </div>

      {activeView !== 'agenda' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="icon" onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft size={16} /></Button>
            <Button variant="secondary" size="icon" onClick={() => shift(1)} aria-label="Next"><ChevronRight size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={() => setAnchor(todayISO())}>Today</Button>
          </div>
          <p className="font-display text-base font-bold text-ink">{monthLabel(anchor)}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-500" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-500" /> Today</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info-400" /> Upcoming</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger-500" /> Overdue</span>
      </div>

      {activeView === 'month' && <MonthView anchor={anchor} onOpenDay={(date) => setDayModalDate(date)} />}
      {activeView === 'week' && <WeekView anchor={anchor} onOpenDay={(date) => setDayModalDate(date)} />}
      {activeView === 'agenda' && <AgendaView onOpenChore={openChoreById} />}

      <DayDetailModal
        date={dayModalDate}
        occurrences={dayOccurrences}
        onClose={() => setDayModalDate(null)}
        onOpenChore={openChoreById}
        onAddForDay={(date) => {
          setDayModalDate(null)
          setCreateDate(date)
        }}
      />
      <ChoreDetailModal chore={openChore} onClose={() => setOpenChoreId(null)} onEdit={() => { setEditChoreId(openChoreId); setOpenChoreId(null) }} />
      <ChoreFormModal open={!!editChore} onClose={() => setEditChoreId(null)} editChore={editChore} />
      <ChoreFormModal open={!!createDate} onClose={() => setCreateDate(null)} defaultDate={createDate ?? undefined} />
    </div>
  )
}
