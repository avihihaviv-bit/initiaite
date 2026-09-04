"use client";

import { SettingsSection, SettingsRow } from "./SettingsSection";
import { DisclaimerBanner } from "@/components/learn/DisclaimerBanner";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function AboutSection() {
  const { t, lang } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      <SettingsSection title={t("settings_about")}>
        <SettingsRow
          label={t("settings_about_app")}
          sublabel={
            lang === "he"
              ? "TEFILLIN — יום אחרי יום, מצווה אחרי מצווה."
              : "TEFILLIN — day after day, mitzvah after mitzvah."
          }
          control={<span className="text-lg">🕍</span>}
        />
        <SettingsRow label={t("settings_version")} control={<span className="text-sm text-[var(--color-text-muted)]">1.0.0</span>} />
        <SettingsRow
          label={t("settings_credits")}
          sublabel={lang === "he" ? "עוצב ופותח באהבה" : "Designed & built with care"}
          control={<span>❤️</span>}
        />
        <SettingsRow
          label={t("settings_sources")}
          sublabel={
            lang === "he"
              ? "לוח שנה עברי: hebcal.com · טקסטים: מקורות מסורתיים"
              : "Hebrew calendar: hebcal.com · Texts: traditional sources"
          }
          control={<span>📖</span>}
        />
      </SettingsSection>

      <div>
        <h2 className="font-bold text-sm text-[var(--color-text-muted)] px-1 mb-2">
          {t("settings_disclaimer_title")}
        </h2>
        <DisclaimerBanner />
      </div>
    </div>
  );
}
