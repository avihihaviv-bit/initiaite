import type { User } from '../../types'
import { Avatar } from './Avatar'

export function AvatarStack({ users, size = 30, max = 3 }: { users: User[]; size?: number; max?: number }) {
  if (users.length === 0) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full border border-dashed border-border text-ink-faint"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        title="Unassigned"
      >
        ?
      </span>
    )
  }

  if (users.length === 1) {
    return <Avatar emoji={users[0].avatarEmoji} color={users[0].color} size={size} />
  }

  const shown = users.slice(0, max)
  const extra = users.length - shown.length

  return (
    <span className="flex shrink-0 items-center" title={users.map((u) => u.name).join(', ')}>
      {shown.map((u, i) => (
        <span key={u.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar emoji={u.avatarEmoji} color={u.color} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex items-center justify-center rounded-full bg-surface-2 font-bold text-ink-soft ring-2 ring-surface"
          style={{ width: size, height: size, fontSize: size * 0.34, marginLeft: -size * 0.35 }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
