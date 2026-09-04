"use client";

import clsx from "clsx";
import { SettingsSection, SettingsRow } from "./SettingsSection";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import type { FontSize } from "@/lib/types";

const SIZES: { key: FontSize; labelKey: "settings_font_small" | "settings_font_medium" | "settings_font_large" }[] = [
  { key: "sm", labelKey: "settings_font_small" },
  { key: "md", labelKey: "settings_font_medium" },
  { key: "lg", labelKey: "settings_font_large" },
];

export function AccessibilitySection() {
  const { t } = useI18n();
  const a11y = useAppStore((s) => s.settings.accessibility);
  const setAccessibility = useAppStore((s) => s.setAccessibility);

  return (
    <SettingsSection title={t("settings_accessibility")}>
      <SettingsRow
        label={t("settings_font_size")}
        control={
          <div className="flex gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s.key}
                onClick={() => setAccessibility({ fontSize: s.key })}
                className={clsx(
                  "px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  a11y.fontSize === s.key
                    ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                )}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        }
      />
      <SettingsRow
        label={t("settings_high_contrast")}
        control={
          <ToggleSwitch
            checked={a11y.highContrast}
            onChange={(v) => setAccessibility({ highContrast: v })}
          />
        }
      />
      <SettingsRow
        label={t("settings_reduce_motion")}
        control={
          <ToggleSwitch
            checked={a11y.reduceMotion}
            onChange={(v) => setAccessibility({ reduceMotion: v })}
          />
        }
      />
    </SettingsSection>
  );
}
