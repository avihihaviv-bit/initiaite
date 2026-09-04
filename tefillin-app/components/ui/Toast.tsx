"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div
      className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] rounded-xl bg-[var(--color-navy)] text-white text-sm px-4 py-3 shadow-lg animate-fade-in-up"
      role="status"
    >
      {message}
    </div>
  );
}
