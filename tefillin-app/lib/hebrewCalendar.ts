import { HDate, HebrewCalendar, flags } from "@hebcal/core";
import type { DiasporaMode, Language } from "./types";

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface DayHalachicInfo {
  isShabbat: boolean;
  isYomTov: boolean;
  isCholHamoed: boolean;
  isObligated: boolean;
  holidayName: { he: string; en: string } | null;
}

const HOLIDAY_HE: Record<string, string> = {
  "Rosh Hashana": "ראש השנה",
  "Yom Kippur": "יום כיפור",
  Sukkot: "סוכות",
  "Shmini Atzeret": "שמיני עצרת",
  "Simchat Torah": "שמחת תורה",
  Pesach: "פסח",
  Shavuot: "שבועות",
};

function translateHolidayName(basename: string): { he: string; en: string } {
  return { he: HOLIDAY_HE[basename] ?? basename, en: basename };
}

const infoCache = new Map<string, DayHalachicInfo>();

export function getDayHalachicInfo(
  date: Date,
  mode: DiasporaMode = "diaspora"
): DayHalachicInfo {
  const cacheKey = `${dateKey(date)}|${mode}`;
  const cached = infoCache.get(cacheKey);
  if (cached) return cached;

  const isShabbat = date.getDay() === 6;
  const il = mode === "israel";
  const hd = new HDate(date);
  const events = HebrewCalendar.getHolidaysOnDate(hd, il) ?? [];

  let isYomTov = false;
  let isCholHamoed = false;
  let holidayName: { he: string; en: string } | null = null;

  for (const ev of events) {
    const f = ev.getFlags();
    const isErev = (f & flags.EREV) !== 0;
    const isChag = (f & flags.CHAG) !== 0;
    const isChol = (f & flags.CHOL_HAMOED) !== 0;
    if (isChol) {
      isCholHamoed = true;
    }
    if (isChag && !isErev) {
      isYomTov = true;
      holidayName = translateHolidayName(ev.basename());
    }
  }

  if (isShabbat && !holidayName) {
    holidayName = { he: "שבת", en: "Shabbat" };
  }

  const info: DayHalachicInfo = {
    isShabbat,
    isYomTov,
    isCholHamoed,
    isObligated: !isShabbat && !isYomTov,
    holidayName,
  };
  infoCache.set(cacheKey, info);
  return info;
}

export function isObligatedDay(date: Date, mode: DiasporaMode = "diaspora"): boolean {
  return getDayHalachicInfo(date, mode).isObligated;
}

export function getHebrewDateLabel(date: Date): string {
  const hd = new HDate(date);
  return hd.renderGematriya(true);
}

export function getWeekdayLabel(date: Date, lang: Language): string {
  const he = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  if (lang === "he") return `יום ${he[date.getDay()]}`;
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function getGregorianLabel(date: Date, lang: Language): string {
  if (lang === "he") {
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Days between two dates (b - a), ignoring time-of-day. */
export function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
