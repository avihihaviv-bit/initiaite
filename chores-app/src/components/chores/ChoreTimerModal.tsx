import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Chore } from '../../types'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/Toast'

function fmt(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${seconds < 0 ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ChoreTimerModal({ chore, onClose }: { chore: Chore | null; onClose: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const completeChore = useStore((s) => s.completeChore)
  const { show } = useToast()

  useEffect(() => {
    if (chore) {
      setSecondsLeft(chore.estimatedMinutes * 60)
      setElapsed(0)
      setRunning(false)
    }
  }, [chore])

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => s - 1)
        setElapsed((e) => e + 1)
      }, 1000)
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running])

  if (!chore) return null

  const overtime = secondsLeft < 0
  const totalSeconds = chore.estimatedMinutes * 60
  const progress = Math.min(100, ((totalSeconds - Math.max(0, secondsLeft)) / totalSeconds) * 100)

  const handleComplete = () => {
    completeChore(chore.id, undefined, Math.round(elapsed / 60) || 1)
    show(`${chore.title} complete!`)
    onClose()
  }

  return (
    <Modal open={!!chore} onClose={onClose} title={`${chore.emoji} ${chore.title}`} subtitle={`Estimated ${chore.estimatedMinutes} min`} size="sm">
      <div className="flex flex-col items-center py-4">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <svg className="absolute -rotate-90" width={192} height={192}>
            <circle cx={96} cy={96} r={86} stroke="var(--color-border)" strokeWidth={10} fill="none" />
            <circle
              cx={96}
              cy={96}
              r={86}
              stroke={overtime ? 'var(--color-danger-500)' : 'var(--color-primary-500)'}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 86}
              strokeDashoffset={2 * Math.PI * 86 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 0.4s linear' }}
            />
          </svg>
          <div className="text-center">
            <p className={`font-display text-4xl font-extrabold tabular-nums ${overtime ? 'text-danger-500' : 'text-ink'}`}>{fmt(secondsLeft)}</p>
            {overtime && <p className="mt-1 text-xs font-semibold text-danger-500">Over estimate</p>}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => { setSecondsLeft(chore.estimatedMinutes * 60); setElapsed(0); setRunning(false) }} aria-label="Reset">
            <RotateCcw size={17} />
          </Button>
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="!h-14 !w-14 !rounded-full !p-0">
            {running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </Button>
          <Button variant="success" size="icon" onClick={handleComplete} aria-label="Complete">
            <Check size={18} />
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-faint">+{chore.xp} XP on completion</p>
      </div>
    </Modal>
  )
}
