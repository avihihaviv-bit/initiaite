"use client";

import clsx from "clsx";

export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative w-12 h-7 rounded-full transition-colors shrink-0 btn-press flex items-center px-0.5",
        checked ? "bg-[var(--color-success)] justify-end" : "bg-[var(--color-surface-2)] border border-[var(--color-border)] justify-start"
      )}
    >
      <span className="w-6 h-6 rounded-full bg-white shadow transition-transform" />
    </button>
  );
}
