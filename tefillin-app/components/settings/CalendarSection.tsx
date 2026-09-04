"use client";

import clsx from "clsx";
import { SettingsSection, SettingsRow } from "./SettingsSection";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import type { AppSettings } from "@/lib/types";

const DISPLAY_OPTIONS: { key: AppSettings["calendarDisplay"]; labelKey: "settings_calendar_hebrew" | "settings_calendar_gregorian" | "settings_calendar_both" }[] = [
  { key: "hebrew", labelKey: "settings_calendar_hebrew" },
  { key: "gregorian", labelKey: "settings_calendar_gregorian" },
  { key: "both", labelKey: "settings_calendar_both" },
];

export function CalendarSection() {
  const { t } = useI18n();
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <SettingsSection title={t("settings_calendar")}>
      <SettingsRow
        label={t("settings_calendar_display")}
        control={
          <div className="flex gap-1.5">
            {DISPLAY_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => setSettings({ calendarDisplay: o.key })}
                className={clsx(
                  "px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  settings.calendarDisplay === o.key
                    ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                )}
              >
                {t(o.labelKey)}
              </button>
            ))}
          </div>
        }
      />
      <SettingsRow
        label={t("settings_calendar_region")}
        control={
          <div className="flex gap-1.5">
            <button
              onClick={() => setSettings({ diasporaMode: "diaspora" })}
              className={clsx(
                "px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                settings.diasporaMode === "diaspora"
                  ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              )}
            >
              {t("settings_calendar_diaspora")}
            </button>
            <button
              onClick={() => setSettings({ diasporaMode: "israel" })}
              className={clsx(
                "px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                settings.diasporaMode === "israel"
                  ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
              )}
            >
              {t("settings_calendar_israel")}
            </button>
          </div>
        }
      />
    </SettingsSection>
  );
}
