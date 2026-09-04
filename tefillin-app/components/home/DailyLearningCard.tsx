"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getFactOfDay } from "@/lib/content";

export function DailyLearningCard({ date }: { date: Date }) {
  const { t, lang } = useI18n();
  const fact = useMemo(() => getFactOfDay(date), [date]);

  return (
    <div className="px-5 mt-6">
      <h2 className="font-bold text-lg mb-3">📚 {t("home_learn_title")}</h2>
      <Link href="/learn/steps">
        <Card className="p-5 mb-3 hover:brightness-[0.98] transition">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t("home_learn_cta")}</div>
              <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {lang === "he" ? "מדריך שלב אחר שלב" : "Step-by-step guide"}
              </div>
            </div>
            <span className="text-2xl">🧑‍🏫</span>
          </div>
        </Card>
      </Link>
      <Card className="p-5 bg-[var(--color-surface-2)] border-none">
        <div className="text-xs font-semibold text-[var(--color-gold)] mb-1.5">
          💡 {t("home_fact_title")}
        </div>
        <p className="text-sm leading-relaxed">{lang === "he" ? fact.he : fact.en}</p>
      </Card>
    </div>
  );
}
