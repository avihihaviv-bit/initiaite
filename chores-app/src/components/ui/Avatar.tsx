import clsx from 'clsx'

interface Props {
  emoji: string
  color: string
  size?: number
  ring?: boolean
  className?: string
}

export function Avatar({ emoji, color, size = 40, ring, className }: Props) {
  return (
    <div
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full', ring && 'ring-2 ring-surface', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
      }}
    >
      {emoji}
    </div>
  )
}
