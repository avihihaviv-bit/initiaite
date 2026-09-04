"use client";

import { Card } from "@/components/ui/Card";
import { Fraction } from "@/components/ui/Fraction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionaries";

interface StatTile {
  labelKey: DictKey;
  value: React.ReactNode;
}

export function OverviewStats({
  totalDays,
  currentStreak,
  bestStreak,
  monthCompleted,
  monthObligated,
  yearCompleted,
  yearObligated,
}: {
  totalDays: number;
  currentStreak: number;
  bestStreak: number;
  monthCompleted: number;
  monthObligated: number;
  yearCompleted: number;
  yearObligated: number;
}) {
  const { t } = useI18n();

  const tiles: StatTile[] = [
    { labelKey: "stats_total_days", value: totalDays },
    { labelKey: "stats_current_streak", value: currentStreak },
    { labelKey: "stats_best_streak", value: bestStreak },
    { labelKey: "stats_this_month", value: <Fraction a={monthCompleted} b={monthObligated} /> },
    { labelKey: "stats_this_year", value: <Fraction a={yearCompleted} b={yearObligated} /> },
  ];

  return (
    <div>
      <h2 className="font-bold text-lg mb-3">{t("stats_overall")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Card key={tile.labelKey} className="p-4">
            <div className="text-2xl font-extrabold tabular-nums">{tile.value}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              {t(tile.labelKey)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
