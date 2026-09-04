import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = { none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-6 sm:p-7' }

export function Card({ interactive, padding = 'md', className, children, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]',
        interactive && 'transition-all duration-200 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5',
        paddings[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
