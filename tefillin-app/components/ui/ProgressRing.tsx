"use client";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  colorVar?: string;
}

export function ProgressRing({
  value,
  max,
  size = 132,
  strokeWidth = 12,
  label,
  sublabel,
  colorVar = "var(--color-gold)",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const offset = circumference * (1 - ratio);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorVar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring-grow"
          style={
            {
              "--ring-circumference": circumference,
              "--ring-offset": offset,
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-xl font-bold text-[var(--color-text)]">{label}</span>
        )}
        {sublabel && (
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
