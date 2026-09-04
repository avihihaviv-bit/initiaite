import type { DayLogEntry } from "./types";

/** Returns the average time-of-day (HH:MM) the user marks tefillin as done, if there's enough data. */
export function computeAverageMarkTime(
  logs: Record<string, DayLogEntry>,
  minSamples = 5
): string | null {
  const times = Object.values(logs)
    .filter((e) => e.done && e.markedAt)
    .map((e) => {
      const d = new Date(e.markedAt);
      return d.getHours() * 60 + d.getMinutes();
    });

  if (times.length < minSamples) return null;

  const avgMinutes = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const h = Math.floor(avgMinutes / 60) % 24;
  const m = avgMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeDiffMinutes(a: string, b: string): number {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return Math.abs(ah * 60 + am - (bh * 60 + bm));
}
