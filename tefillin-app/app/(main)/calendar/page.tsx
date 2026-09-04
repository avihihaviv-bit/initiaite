"use client";

import { useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { Toast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";

const statusLegend: { key: "calendar_status_done" | "calendar_status_missed" | "calendar_status_none"; dotClass: string }[] = [
  { key: "calendar_status_done", dotClass: "bg-[var(--color-success)]" },
  { key: "calendar_status_missed", dotClass: "bg-[var(--color-danger)]" },
  { key: "calendar_status_none", dotClass: "bg-[var(--color-text-muted)]/40" },
];

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const lastEditFeedback = useAppStore((s) => s.lastEditFeedback);
  const clearEditFeedback = useAppStore((s) => s.clearEditFeedback);

  const monthLabel = monthDate.toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  return (
    <div className="max-w-lg mx-auto pb-8 px-5">
      <h1 className="text-2xl font-bold pt-8 mb-5">📅 {t("calendar_title")}</h1>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => shiftMonth(lang === "he" ? 1 : -1)}
          className="w-10 h-10 rounded-full card-surface flex items-center justify-center btn-press"
          aria-label="prev"
        >
          {lang === "he" ? "›" : "‹"}
        </button>
        <div className="font-bold text-lg">{monthLabel}</div>
        <button
          onClick={() => shiftMonth(lang === "he" ? -1 : 1)}
          className="w-10 h-10 rounded-full card-surface flex items-center justify-center btn-press"
          aria-label="next"
        >
          {lang === "he" ? "‹" : "›"}
        </button>
      </div>

      <MonthGrid monthDate={monthDate} onSelectDay={setSelectedDay} />

      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-[var(--color-text-muted)] flex-wrap">
        {statusLegend.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.dotClass}`} />
            {t(l.key)}
          </div>
        ))}
      </div>

      <DayDetailModal date={selectedDay} onClose={() => setSelectedDay(null)} />

      {lastEditFeedback && (
        <Toast
          message={t("calendar_edit_feedback", { date: lastEditFeedback.label })}
          onDismiss={clearEditFeedback}
        />
      )}
    </div>
  );
}
