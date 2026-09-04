import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className, children, id, ...rest }: Props) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>}
      <div className="relative">
        <select
          id={id}
          className={clsx(
            'focus-ring h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-9 text-sm font-medium text-ink',
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      </div>
    </label>
  )
}

export function TextInput({ label, className, id, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>}
      <input
        id={id}
        className={clsx('focus-ring h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink placeholder:text-ink-faint placeholder:font-normal', className)}
        {...rest}
      />
    </label>
  )
}

export function TextArea({ label, className, id, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>}
      <textarea
        id={id}
        className={clsx('focus-ring w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink placeholder:text-ink-faint placeholder:font-normal', className)}
        {...rest}
      />
    </label>
  )
}
