"use client";

import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { ACHIEVEMENTS } from "@/lib/achievements";

export function AchievementsRow() {
  const { t, lang } = useI18n();
  const unlocked = useAppStore((s) => s.unlockedAchievements);

  const items = useMemo(() => ACHIEVEMENTS.slice(0, 6), []);

  return (
    <div className="mt-6 px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">🏆 {t("home_achievements_title")}</h2>
        <Link href="/stats" className="text-sm text-[var(--color-gold)] font-medium">
          {lang === "he" ? "הצג הכול" : "See all"}
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
        {items.map((a) => {
          const isUnlocked = !!unlocked[a.id];
          return (
            <div
              key={a.id}
              className={clsx(
                "shrink-0 w-24 rounded-2xl p-3 text-center card-surface transition-opacity",
                !isUnlocked && "opacity-40 grayscale"
              )}
            >
              <div className="text-3xl mb-1">{a.icon}</div>
              <div className="text-[11px] font-medium leading-tight">
                {lang === "he" ? a.titleHe : a.titleEn}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
