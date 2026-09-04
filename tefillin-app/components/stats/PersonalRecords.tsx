"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { computeBestMonth, computeStreaks } from "@/lib/streaks";
import { keyToDate } from "@/lib/hebrewCalendar";

const MONTH_NAMES = {
  he: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function PersonalRecords() {
  const { t, lang } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);

  const { best, bestReachedOn, totalDays } = useMemo(
    () => computeStreaks(logs, diasporaMode),
    [logs, diasporaMode]
  );
  const bestMonth = useMemo(() => computeBestMonth(logs, diasporaMode), [logs, diasporaMode]);

  return (
    <div>
      <h2 className="font-bold text-lg mb-3">🏅 {t("stats_records_title")}</h2>
      <div className="flex flex-col gap-2.5">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--color-text-muted)]">
              🔥 {t("stats_records_best_streak")}
            </div>
            {bestReachedOn && (
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {t("stats_records_reached_on")}{" "}
                {keyToDate(bestReachedOn).toLocaleDateString(lang === "he" ? "he-IL" : "en-US")}
              </div>
            )}
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{best}</div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--color-text-muted)]">
              📅 {t("stats_records_best_month")}
            </div>
            {bestMonth && (
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {MONTH_NAMES[lang][bestMonth.month]} {bestMonth.year}
              </div>
            )}
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            {bestMonth?.completed ?? 0}
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div className="text-sm text-[var(--color-text-muted)]">
            🏆 {t("stats_records_total")}
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{totalDays}</div>
        </Card>
      </div>
    </div>
  );
}
