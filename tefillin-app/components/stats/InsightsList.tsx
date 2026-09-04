"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { getBestWeekday, getCurrentStreakRank, getMonthOverMonthChange } from "@/lib/stats";
import { computeStreaks } from "@/lib/streaks";

const WEEKDAY_NAMES = {
  he: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const ORDINAL_HE = ["", "ראשון", "שני", "שלישי", "רביעי", "חמישי"];

export function InsightsList() {
  const { t, lang } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);

  const insights = useMemo(() => {
    const today = new Date();
    const list: string[] = [];

    const bestWeekday = getBestWeekday(logs, diasporaMode, today);
    if (bestWeekday && bestWeekday.rate >= 0.6) {
      const day = WEEKDAY_NAMES[lang][bestWeekday.weekday];
      list.push(t("stats_insight_best_weekday", { day }));
    }

    const monthChange = getMonthOverMonthChange(logs, diasporaMode, today);
    if (monthChange !== null && Math.abs(monthChange) >= 5) {
      list.push(
        monthChange > 0
          ? t("stats_insight_month_change_up", { n: monthChange })
          : t("stats_insight_month_change_down", { n: Math.abs(monthChange) })
      );
    }

    const { current } = computeStreaks(logs, diasporaMode, today);
    const rank = getCurrentStreakRank(logs, diasporaMode, current, today);
    if (rank === 1 && current > 0) {
      list.push(t("stats_insight_streak_rank_first"));
    } else if (rank && rank > 1) {
      const n = lang === "he" ? ORDINAL_HE[Math.min(rank, 5)] || `${rank}` : rank;
      list.push(t("stats_insight_streak_rank", { n }));
    }

    return list;
  }, [logs, diasporaMode, lang, t]);

  if (insights.length === 0) return null;

  return (
    <div>
      <h2 className="font-bold text-lg mb-3">🧠 {t("stats_insights_title")}</h2>
      <div className="flex flex-col gap-2.5">
        {insights.map((text, i) => (
          <Card key={i} className="p-4 text-sm leading-relaxed">
            {text}
          </Card>
        ))}
      </div>
    </div>
  );
}
