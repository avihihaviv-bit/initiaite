import type { DayLogEntry, DiasporaMode } from "@/lib/types";
import { dateKey, getDayHalachicInfo, isSameDay } from "@/lib/hebrewCalendar";

export type DayStatus = "done" | "no_obligation" | "missed" | "pending" | "future";

export function getDayStatus(
  date: Date,
  logs: Record<string, DayLogEntry>,
  mode: DiasporaMode,
  today: Date
): DayStatus {
  if (date > today && !isSameDay(date, today)) return "future";

  const halachic = getDayHalachicInfo(date, mode);
  if (!halachic.isObligated) return "no_obligation";

  const done = logs[dateKey(date)]?.done ?? false;
  if (done) return "done";
  if (isSameDay(date, today)) return "pending";
  return "missed";
}
