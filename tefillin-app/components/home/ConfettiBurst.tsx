"use client";

import { useMemo } from "react";

const COLORS = ["var(--color-gold)", "var(--color-gold-soft)", "var(--color-success)", "#ffffff"];

export function ConfettiBurst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const spread = 40 + ((seed + i * 7) % 30);
      return {
        id: i,
        left: 50 + Math.cos(angle) * spread * 0.4,
        delay: (i % 6) * 0.03,
        color: COLORS[i % COLORS.length],
        rotate: (i * 47) % 360,
        size: 5 + (i % 3) * 2,
      };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-2 animate-confetti rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 2.2,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
