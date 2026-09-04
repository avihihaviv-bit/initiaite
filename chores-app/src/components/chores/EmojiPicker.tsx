import { useState } from 'react'
import clsx from 'clsx'

const PRESET_EMOJIS = [
  '🧹', '🍽', '🧺', '🗑', '🛏', '🧼', '🐶', '🌳', '🛒', '🔧', '📦', '🧽',
  '🚿', '🪟', '🧴', '🪴', '🧦', '🧻', '🚗', '📚', '🛁', '🍳', '🧊', '🎒',
]

export function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-3xl transition hover:bg-border/40"
      >
        {value}
      </button>
      {open && (
        <div className="absolute left-0 top-16 z-20 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-border bg-surface p-2.5 shadow-[var(--shadow-lift)]">
          {PRESET_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onChange(e)
                setOpen(false)
              }}
              className={clsx('flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-surface-2', value === e && 'bg-primary-50')}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
