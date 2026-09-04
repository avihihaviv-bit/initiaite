import type { DayLogEntry, DiasporaMode } from "./types";
import { addDays, dateKey, isObligatedDay } from "./hebrewCalendar";

export interface StreakResult {
  current: number;
  best: number;
  bestReachedOn: string | null;
  totalDays: number;
}

function earliestLogDate(logs: Record<string, DayLogEntry>): Date | null {
  const keys = Object.keys(logs).filter((k) => logs[k]?.done);
  if (keys.length === 0) return null;
  keys.sort();
  const [y, m, d] = keys[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Streaks only count halachically-obligated days. Shabbat and Yamim Tovim
 * are skipped entirely — they neither extend nor break a streak.
 */
export function computeStreaks(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  today: Date = new Date()
): StreakResult {
  const start = earliestLogDate(logs);
  const totalDays = Object.values(logs).filter((e) => e.done).length;

  if (!start) {
    return { current: 0, best: 0, bestReachedOn: null, totalDays: 0 };
  }

  const todayKey = dateKey(today);

  // Walk forward from the earliest logged day to today, tracking runs.
  let running = 0;
  let best = 0;
  let bestReachedOn: string | null = null;
  let current = 0;

  let cursor = new Date(start);
  while (cursor <= today) {
    const key = dateKey(cursor);
    const obligated = isObligatedDay(cursor, mode);

    if (obligated) {
      const entry = logs[key];
      const isToday = key === todayKey;

      if (entry?.done) {
        running += 1;
        if (running > best) {
          best = running;
          bestReachedOn = key;
        }
        current = running;
      } else if (isToday) {
        // Today isn't over yet — don't break the streak, just don't extend it.
        current = running;
      } else {
        running = 0;
        current = 0;
      }
    }

    cursor = addDays(cursor, 1);
  }

  return { current, best, bestReachedOn, totalDays };
}

export interface MonthProgress {
  completed: number;
  obligated: number;
}

export function computeMonthProgress(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  monthDate: Date,
  today: Date = new Date()
): MonthProgress {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let completed = 0;
  let obligated = 0;

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    if (date > today) continue;
    if (!isObligatedDay(date, mode)) continue;
    obligated += 1;
    if (logs[dateKey(date)]?.done) completed += 1;
  }

  return { completed, obligated };
}

export interface BestMonthResult {
  completed: number;
  year: number;
  month: number; // 0-indexed
}

export function computeBestMonth(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  today: Date = new Date()
): BestMonthResult | null {
  const start = earliestLogDate(logs);
  if (!start) return null;

  let best: BestMonthResult | null = null;
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  while (cursor <= end) {
    const { completed } = computeMonthProgress(logs, mode, cursor, today);
    if (!best || completed > best.completed) {
      best = { completed, year: cursor.getFullYear(), month: cursor.getMonth() };
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return best;
}

export function computeYearProgress(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  year: number,
  today: Date = new Date()
): MonthProgress {
  let completed = 0;
  let obligated = 0;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const end = today < yearEnd ? today : yearEnd;

  let cursor = new Date(yearStart);
  while (cursor <= end) {
    if (isObligatedDay(cursor, mode)) {
      obligated += 1;
      if (logs[dateKey(cursor)]?.done) completed += 1;
    }
    cursor = addDays(cursor, 1);
  }

  return { completed, obligated };
}
