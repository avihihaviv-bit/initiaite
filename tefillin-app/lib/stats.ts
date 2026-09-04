import type { DayLogEntry, DiasporaMode, Language } from "./types";
import { addDays, dateKey, isObligatedDay } from "./hebrewCalendar";

export type ChartRange = "7" | "30" | "90" | "year";

export interface ChartPoint {
  label: string;
  done: number;
  obligated: number;
}

export function getDailyChartData(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  range: ChartRange,
  lang: Language,
  today: Date = new Date()
): ChartPoint[] {
  const days = range === "7" ? 7 : range === "30" ? 30 : range === "90" ? 90 : 365;
  const points: ChartPoint[] = [];
  const start = addDays(today, -(days - 1));

  if (range === "7" || range === "30") {
    let cursor = new Date(start);
    while (cursor <= today) {
      const obligated = isObligatedDay(cursor, mode) ? 1 : 0;
      const done = obligated && logs[dateKey(cursor)]?.done ? 1 : 0;
      points.push({
        label: cursor.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
          day: "numeric",
          month: "short",
        }),
        done,
        obligated,
      });
      cursor = addDays(cursor, 1);
    }
    return points;
  }

  // 90 days or year: bucket by week or month for readability.
  if (range === "90") {
    let cursor = new Date(start);
    while (cursor <= today) {
      let done = 0;
      let obligated = 0;
      const weekStart = new Date(cursor);
      for (let i = 0; i < 7 && cursor <= today; i++) {
        if (isObligatedDay(cursor, mode)) {
          obligated += 1;
          if (logs[dateKey(cursor)]?.done) done += 1;
        }
        cursor = addDays(cursor, 1);
      }
      points.push({
        label: weekStart.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
          day: "numeric",
          month: "short",
        }),
        done,
        obligated,
      });
    }
    return points;
  }

  // year: bucket by calendar month
  const monthNamesHe = [
    "ינו",
    "פבר",
    "מרץ",
    "אפר",
    "מאי",
    "יונ",
    "יול",
    "אוג",
    "ספט",
    "אוק",
    "נוב",
    "דצמ",
  ];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const lastDay = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    ).getDate();
    let done = 0;
    let obligated = 0;
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      if (date > today) continue;
      if (!isObligatedDay(date, mode)) continue;
      obligated += 1;
      if (logs[dateKey(date)]?.done) done += 1;
    }
    points.push({
      label:
        lang === "he"
          ? monthNamesHe[monthDate.getMonth()]
          : monthDate.toLocaleDateString("en-US", { month: "short" }),
      done,
      obligated,
    });
  }
  return points;
}

export interface WeekdayConsistency {
  weekday: number; // 0=Sunday
  rate: number; // 0-1
}

export function getBestWeekday(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  today: Date = new Date(),
  lookbackDays = 180
): WeekdayConsistency | null {
  const totals = new Array(7).fill(0);
  const dones = new Array(7).fill(0);
  let cursor = addDays(today, -lookbackDays);
  while (cursor <= today) {
    if (isObligatedDay(cursor, mode)) {
      const wd = cursor.getDay();
      totals[wd] += 1;
      if (logs[dateKey(cursor)]?.done) dones[wd] += 1;
    }
    cursor = addDays(cursor, 1);
  }
  let best: WeekdayConsistency | null = null;
  for (let wd = 0; wd < 7; wd++) {
    if (totals[wd] < 2) continue;
    const rate = dones[wd] / totals[wd];
    if (!best || rate > best.rate) best = { weekday: wd, rate };
  }
  return best;
}

export function getMonthOverMonthChange(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  today: Date = new Date()
): number | null {
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  function rateFor(start: Date, end: Date): number | null {
    let obligated = 0;
    let done = 0;
    let cursor = new Date(start);
    while (cursor <= end) {
      if (isObligatedDay(cursor, mode)) {
        obligated += 1;
        if (logs[dateKey(cursor)]?.done) done += 1;
      }
      cursor = addDays(cursor, 1);
    }
    return obligated > 0 ? done / obligated : null;
  }

  const thisRate = rateFor(thisMonthStart, today);
  const prevRate = rateFor(prevMonthStart, prevMonthEnd);
  if (thisRate === null || prevRate === null || prevRate === 0) return null;
  return Math.round(((thisRate - prevRate) / prevRate) * 100);
}

/** Finds all historical streak run-lengths (obligated-days only) and ranks the current one. */
export function getCurrentStreakRank(
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  currentStreak: number,
  today: Date = new Date()
): number | null {
  if (currentStreak <= 0) return null;
  const doneKeys = Object.keys(logs)
    .filter((k) => logs[k]?.done)
    .sort();
  if (doneKeys.length === 0) return null;

  const [y, m, d] = doneKeys[0].split("-").map(Number);
  const start = new Date(y, m - 1, d);

  const runs: number[] = [];
  let running = 0;
  let cursor = new Date(start);
  while (cursor <= today) {
    if (isObligatedDay(cursor, mode)) {
      if (logs[dateKey(cursor)]?.done) {
        running += 1;
      } else if (dateKey(cursor) !== dateKey(today)) {
        if (running > 0) runs.push(running);
        running = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  if (running > 0) runs.push(running);

  const uniqueSorted = Array.from(new Set(runs)).sort((a, b) => b - a);
  const rank = uniqueSorted.indexOf(currentStreak);
  return rank === -1 ? null : rank + 1;
}
