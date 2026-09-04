"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Fraction } from "@/components/ui/Fraction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { computeMonthProgress } from "@/lib/streaks";

export function MonthProgress({ date }: { date: Date }) {
  const { t } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);

  const { completed, obligated } = useMemo(
    () => computeMonthProgress(logs, diasporaMode, date, date),
    [logs, diasporaMode, date]
  );
  const pct = obligated > 0 ? Math.round((completed / obligated) * 100) : 0;

  return (
    <Link href="/calendar">
      <Card className="mx-5 mt-4 p-5 flex items-center justify-between hover:brightness-[0.98] transition">
        <div>
          <div className="text-sm text-[var(--color-text-muted)] mb-1">
            📅 {t("home_month_title")}
          </div>
          <div className="text-2xl font-bold tabular-nums">
            <Fraction a={completed} b={obligated} />
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {t("home_month_days")} · {pct}%
          </div>
        </div>
        <ProgressRing value={completed} max={Math.max(obligated, 1)} size={72} strokeWidth={8} />
      </Card>
    </Link>
  );
}
