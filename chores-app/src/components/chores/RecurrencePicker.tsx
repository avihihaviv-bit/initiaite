import clsx from 'clsx'
import type { RecurrenceRule, RepeatFrequency } from '../../types'
import { WEEKDAY_LABELS } from '../../lib/date'
import { Select } from '../ui/Select'

const FREQUENCIES: { id: RepeatFrequency; label: string }[] = [
  { id: 'none', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekdays', label: 'Every weekday' },
  { id: 'weekends', label: 'Every weekend' },
  { id: 'weekly', label: 'Every week' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Every month' },
  { id: 'custom', label: 'Custom days' },
]

export function RecurrencePicker({ value, onChange }: { value: RecurrenceRule; onChange: (v: RecurrenceRule) => void }) {
  const showDayPicker = value.frequency === 'weekly' || value.frequency === 'biweekly' || value.frequency === 'custom'

  return (
    <div className="space-y-3">
      <Select
        label="Repeat"
        value={value.frequency}
        onChange={(e) => onChange({ ...value, frequency: e.target.value as RepeatFrequency, daysOfWeek: value.daysOfWeek ?? [] })}
      >
        {FREQUENCIES.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </Select>

      {showDayPicker && (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">On these days</span>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, idx) => {
              const active = (value.daysOfWeek ?? []).includes(idx)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const set = new Set(value.daysOfWeek ?? [])
                    if (set.has(idx)) set.delete(idx)
                    else set.add(idx)
                    onChange({ ...value, daysOfWeek: Array.from(set).sort() })
                  }}
                  className={clsx(
                    'focus-ring flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition',
                    active ? 'bg-primary-500 text-white' : 'bg-surface-2 text-ink-soft hover:bg-border/50'
                  )}
                >
                  {label[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
