import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-500 text-white shadow-[var(--shadow-glow)] hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50',
  secondary:
    'bg-surface text-ink border border-border hover:bg-surface-2 active:bg-border/60 disabled:opacity-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink disabled:opacity-40',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 disabled:opacity-50',
  success: 'bg-success-500 text-white hover:bg-success-600 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, loading, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'focus-ring inline-flex select-none items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  )
})
