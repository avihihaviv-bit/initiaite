"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isSameDay } from "@/lib/hebrewCalendar";
import { getDayStatus, type DayStatus } from "./dayStatus";

const WEEKDAY_KEYS = [
  "calendar_weekday_sun",
  "calendar_weekday_mon",
  "calendar_weekday_tue",
  "calendar_weekday_wed",
  "calendar_weekday_thu",
  "calendar_weekday_fri",
  "calendar_weekday_sat",
] as const;

const statusDotClass: Record<DayStatus, string> = {
  done: "bg-[var(--color-success)]",
  missed: "bg-[var(--color-danger)]",
  no_obligation: "bg-[var(--color-text-muted)]/40",
  pending: "border-2 border-[var(--color-gold)]",
  future: "",
};

export function MonthGrid({
  monthDate,
  onSelectDay,
}: {
  monthDate: Date;
  onSelectDay: (date: Date) => void;
}) {
  const { t } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = firstDay.getDay();
    const totalCells = Math.ceil((leading + lastDay.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - leading + 1;
      if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
      return new Date(year, month, dayNum);
    });
  }, [monthDate]);

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs text-[var(--color-text-muted)] mb-2">
        {WEEKDAY_KEYS.map((k) => (
          <div key={k}>{t(k)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const status = getDayStatus(date, logs, diasporaMode, today);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={i}
              onClick={() => onSelectDay(date)}
              disabled={status === "future"}
              className={clsx(
                "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition-colors card-surface",
                status === "future" && "opacity-30 pointer-events-none",
                isToday && "ring-2 ring-[var(--color-gold)]"
              )}
            >
              <span className="font-medium tabular-nums">{date.getDate()}</span>
              {status !== "future" && (
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    statusDotClass[status]
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
