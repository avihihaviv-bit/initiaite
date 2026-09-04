"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { getDailyChartData, type ChartRange } from "@/lib/stats";

const RANGES: { key: ChartRange; labelKey: "stats_range_7" | "stats_range_30" | "stats_range_90" | "stats_range_year" }[] = [
  { key: "7", labelKey: "stats_range_7" },
  { key: "30", labelKey: "stats_range_30" },
  { key: "90", labelKey: "stats_range_90" },
  { key: "year", labelKey: "stats_range_year" },
];

export function TrendChart({
  range,
  onRangeChange,
}: {
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}) {
  const { t, lang } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);

  const data = useMemo(
    () => getDailyChartData(logs, diasporaMode, range, lang),
    [logs, diasporaMode, range, lang]
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => onRangeChange(r.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              range === r.key
                ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            }`}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>
      <div className="h-52 -ms-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={range === "7" ? "30%" : "20%"}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              interval={range === "year" ? 0 : "preserveStartEnd"}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Bar dataKey="done" radius={[6, 6, 0, 0]} fill="var(--color-gold)" maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
