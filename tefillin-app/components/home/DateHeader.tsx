"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { getGregorianLabel, getHebrewDateLabel, getWeekdayLabel } from "@/lib/hebrewCalendar";

export function DateHeader({ date }: { date: Date }) {
  const { t, lang } = useI18n();
  const profile = useAppStore((s) => s.profile);
  const calendarDisplay = useAppStore((s) => s.settings.calendarDisplay);

  const hebrewLabel = getHebrewDateLabel(date);
  const gregLabel = getGregorianLabel(date, lang);
  const weekday = getWeekdayLabel(date, lang);

  return (
    <div className="px-5 pt-8 sm:pt-10">
      <h1 className="text-2xl font-bold">
        {t("home_greeting")}
        {profile.name ? `, ${profile.name}` : ""} 👋
      </h1>
      <p className="text-[var(--color-text-muted)] mt-1">{t("home_subtitle")}</p>
      <div className="mt-3 text-sm text-[var(--color-text-muted)] flex flex-wrap items-center gap-x-2">
        <span>{weekday}</span>
        <span aria-hidden="true">·</span>
        {calendarDisplay !== "hebrew" && <span>{gregLabel}</span>}
        {calendarDisplay === "both" && <span aria-hidden="true">·</span>}
        {calendarDisplay !== "gregorian" && (
          <span className="font-[var(--font-serif-he)]">{hebrewLabel}</span>
        )}
      </div>
    </div>
  );
}
