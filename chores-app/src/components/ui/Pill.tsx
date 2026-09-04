import type { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-soft border-border',
  primary: 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-700',
  success: 'bg-success-100 text-success-600 border-success-400/30 dark:bg-success-500/15 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-500 border-warning-500/30 dark:bg-warning-500/15',
  danger: 'bg-danger-100 text-danger-600 border-danger-400/30 dark:bg-danger-500/15 dark:text-danger-400',
  info: 'bg-info-400/10 text-info-500 border-info-400/30',
}

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
