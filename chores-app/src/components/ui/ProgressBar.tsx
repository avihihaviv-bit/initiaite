import clsx from 'clsx'

interface Props {
  value: number // 0-100
  className?: string
  colorClassName?: string
  trackClassName?: string
  height?: number
  label?: string
}

export function ProgressBar({ value, className, colorClassName = 'bg-primary-500', trackClassName, height = 10, label }: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={clsx('w-full overflow-hidden rounded-full bg-border/70', trackClassName)}
        style={{ height }}
      >
        <div
          className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', colorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
