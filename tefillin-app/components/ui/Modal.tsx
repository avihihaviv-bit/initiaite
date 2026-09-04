"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] animate-fade-in-up"
      style={{ animationDuration: "0.2s" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "card-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85dvh] overflow-y-auto animate-fade-in-up safe-bottom",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
