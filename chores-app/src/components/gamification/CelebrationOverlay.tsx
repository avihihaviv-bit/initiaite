import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useStore } from '../../store/useStore'
import { badgeDef } from '../../lib/gamification'

export function CelebrationOverlay() {
  const celebrations = useStore((s) => s.celebrations)
  const dismiss = useStore((s) => s.dismissCelebration)
  const confettiEnabled = useStore((s) => s.settings.confetti)
  const current = celebrations[0]
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!current) return
    if (confettiEnabled && (current.type === 'levelup' || current.type === 'badge')) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.35 },
        colors: ['#7c5cff', '#ff9f0a', '#33c17a', '#ff6bd6'],
      })
    }
    const duration = current.type === 'complete' ? 1600 : 2600
    timerRef.current = window.setTimeout(dismiss, duration)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-start justify-center pt-24 sm:pt-28">
      <AnimatePresence mode="wait">
        {current?.type === 'complete' && (
          <motion.div
            key={`c-${current.choreTitle}-${current.xp}`}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="pointer-events-none flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5 shadow-[var(--shadow-lift)]"
          >
            <span className="text-2xl">{current.emoji}</span>
            <div>
              <p className="text-sm font-bold text-ink">Nice! {current.choreTitle} done</p>
              <p className="text-xs font-semibold text-primary-500">
                +{current.xp} XP · +{current.points} pts{current.streak > 1 ? ` · 🔥 Streak ${current.streak}` : ''}
              </p>
            </div>
          </motion.div>
        )}
        {current?.type === 'levelup' && (
          <motion.div
            key={`l-${current.level}`}
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="pointer-events-none flex flex-col items-center gap-2 rounded-3xl border border-primary-200 bg-gradient-to-b from-primary-50 to-surface px-8 py-6 text-center shadow-[var(--shadow-lift)] dark:from-primary-900/40 dark:to-surface"
          >
            <span className="animate-[var(--animate-pop)] text-5xl">🎉</span>
            <p className="font-display text-xl font-extrabold text-primary-600 dark:text-primary-300">Level Up!</p>
            <p className="text-sm font-semibold text-ink-soft">{current.userName} reached Level {current.level}</p>
          </motion.div>
        )}
        {current?.type === 'badge' && (
          <motion.div
            key={`b-${current.badgeId}`}
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="pointer-events-none flex flex-col items-center gap-2 rounded-3xl border border-accent-400/40 bg-gradient-to-b from-accent-50 to-surface px-8 py-6 text-center shadow-[var(--shadow-lift)] dark:from-accent-500/10 dark:to-surface"
          >
            <span className="animate-[var(--animate-pop)] text-5xl">{badgeDef(current.badgeId).emoji}</span>
            <p className="font-display text-xl font-extrabold text-accent-600">Badge Unlocked!</p>
            <p className="text-sm font-semibold text-ink-soft">
              {current.userName} earned "{badgeDef(current.badgeId).name}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
