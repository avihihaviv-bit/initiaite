"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";
type Size = "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-navy)] text-[var(--color-gold-soft)] hover:brightness-110 dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]",
  secondary:
    "bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border)]",
  ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
  success: "bg-[var(--color-success)] text-white hover:brightness-105",
  danger: "bg-[var(--color-danger)] text-white hover:brightness-105",
};

const sizeClasses: Record<Size, string> = {
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
  icon: "h-11 w-11 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "btn-press inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
