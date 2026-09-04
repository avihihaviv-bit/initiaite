"use client";

import { useMemo, useState } from "react";
import { OverviewStats } from "@/components/stats/OverviewStats";
import { TrendChart } from "@/components/stats/TrendChart";
import { InsightsList } from "@/components/stats/InsightsList";
import { PersonalRecords } from "@/components/stats/PersonalRecords";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { computeMonthProgress, computeStreaks, computeYearProgress } from "@/lib/streaks";
import type { ChartRange } from "@/lib/stats";

export default function StatsPage() {
  const { t } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);
  const [range, setRange] = useState<ChartRange>("30");

  const today = useMemo(() => new Date(), []);
  const streaks = useMemo(() => computeStreaks(logs, diasporaMode, today), [logs, diasporaMode, today]);
  const month = useMemo(() => computeMonthProgress(logs, diasporaMode, today, today), [logs, diasporaMode, today]);
  const year = useMemo(
    () => computeYearProgress(logs, diasporaMode, today.getFullYear(), today),
    [logs, diasporaMode, today]
  );

  if (streaks.totalDays === 0) {
    return (
      <div className="max-w-lg mx-auto pb-8 px-5">
        <h1 className="text-2xl font-bold pt-8 mb-5">📊 {t("stats_title")}</h1>
        <div className="rounded-2xl card-surface p-10 text-center mt-10">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-bold mb-2">{t("stats_no_data_title")}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{t("stats_no_data_body")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8 px-5 flex flex-col gap-8">
      <h1 className="text-2xl font-bold pt-8">📊 {t("stats_title")}</h1>

      <OverviewStats
        totalDays={streaks.totalDays}
        currentStreak={streaks.current}
        bestStreak={streaks.best}
        monthCompleted={month.completed}
        monthObligated={month.obligated}
        yearCompleted={year.completed}
        yearObligated={year.obligated}
      />

      <TrendChart range={range} onRangeChange={setRange} />

      <InsightsList />

      <PersonalRecords />
    </div>
  );
}
