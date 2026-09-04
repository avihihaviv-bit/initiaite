"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfettiBurst } from "./ConfettiBurst";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { dateKey, getDayHalachicInfo } from "@/lib/hebrewCalendar";
import { computeStreaks } from "@/lib/streaks";
import { getQuoteOfDay } from "@/lib/content";

interface TodayCardProps {
  date: Date;
  onFirstCompletion: () => void;
  onAchievementsUnlocked: (ids: string[]) => void;
}

export function TodayCard({ date, onFirstCompletion, onAchievementsUnlocked }: TodayCardProps) {
  const { t, lang } = useI18n();
  const settings = useAppStore((s) => s.settings);
  const logs = useAppStore((s) => s.logs);
  const markDay = useAppStore((s) => s.markDay);
  const hasSeenFirstCompletion = useAppStore((s) => s.hasSeenFirstCompletion);
  const markFirstCompletionSeen = useAppStore((s) => s.markFirstCompletionSeen);
  const checkAchievementUnlocks = useAppStore((s) => s.checkAchievementUnlocks);
  const [burstSeed, setBurstSeed] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const key = dateKey(date);
  const halachic = useMemo(
    () => getDayHalachicInfo(date, settings.diasporaMode),
    [date, settings.diasporaMode]
  );
  const done = logs[key]?.done ?? false;

  const { current, best } = useMemo(
    () => computeStreaks(logs, settings.diasporaMode, date),
    [logs, settings.diasporaMode, date]
  );

  const quote = useMemo(() => getQuoteOfDay(date), [date]);

  function handleToggle() {
    const nextDone = !done;
    markDay(date, nextDone);

    if (nextDone) {
      setCelebrating(true);
      setBurstSeed((s) => s + 1);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([20, 40, 20]);
      }
      setTimeout(() => setCelebrating(false), 1000);

      const totalDone = Object.values(logs).filter((e) => e.done).length + 1;
      if (totalDone === 1 && !hasSeenFirstCompletion) {
        markFirstCompletionSeen();
        onFirstCompletion();
      } else {
        const unlocked = checkAchievementUnlocks();
        if (unlocked.length > 0) onAchievementsUnlocked(unlocked);
      }
    }
  }

  if (!halachic.isObligated) {
    return (
      <Card className="mx-5 mt-6 p-8 text-center bg-[var(--color-navy)] text-white border-none">
        <div className="text-5xl mb-4">🕊️</div>
        <h2 className="text-xl font-bold mb-2">
          {halachic.holidayName
            ? `${halachic.holidayName.he} · ${halachic.holidayName.en}`
            : t("home_no_obligation")}
        </h2>
        <p className="text-white/70">{t("home_no_obligation")}</p>
      </Card>
    );
  }

  return (
    <Card
      className={clsx(
        "relative mx-5 mt-6 p-8 text-center overflow-hidden border-none transition-colors duration-500",
        done
          ? "bg-[var(--color-success)] text-white"
          : "bg-[var(--color-navy)] text-white"
      )}
    >
      {celebrating && <ConfettiBurst seed={burstSeed} />}

      <div className="text-5xl mb-4">🕍</div>
      <h2 className="text-xl font-bold mb-1">{t("home_today_title")}</h2>
      <p className="text-white/70 text-sm mb-6">{lang === "he" ? quote.he : quote.en}</p>

      <div className="flex items-center justify-center gap-2 mb-7">
        <span className="text-4xl font-extrabold tabular-nums">{current}</span>
        <div className="text-start">
          <div className="text-sm font-medium">🔥 {t("home_streak_label")}</div>
          {best > current && current > 0 && (
            <div className="text-xs text-white/60">
              {t("home_streak_to_record", { n: best - current })}
            </div>
          )}
          {current > 0 && current === best && (
            <div className="text-xs text-[var(--color-gold-soft)]">
              {t("home_streak_is_record")}
            </div>
          )}
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleToggle}
        variant={done ? "secondary" : "primary"}
        className={clsx(
          "w-full !bg-white !text-[var(--color-navy)]",
          done && "!bg-white/15 !text-white border border-white/30"
        )}
      >
        {done ? t("home_marked_button") : t("home_mark_button")}
      </Button>
    </Card>
  );
}
