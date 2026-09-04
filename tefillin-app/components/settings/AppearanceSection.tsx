"use client";

import clsx from "clsx";
import { SettingsSection } from "./SettingsSection";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import type { ThemeMode } from "@/lib/types";

const THEMES: { key: ThemeMode; labelKey: "settings_theme_light" | "settings_theme_dark" | "settings_theme_system" }[] = [
  { key: "light", labelKey: "settings_theme_light" },
  { key: "dark", labelKey: "settings_theme_dark" },
  { key: "system", labelKey: "settings_theme_system" },
];

export function AppearanceSection() {
  const { t } = useI18n();
  const theme = useAppStore((s) => s.settings.theme);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <SettingsSection title={t("settings_appearance")}>
      <div className="flex gap-2 p-3">
        {THEMES.map((th) => (
          <button
            key={th.key}
            onClick={() => setSettings({ theme: th.key })}
            className={clsx(
              "flex-1 h-10 rounded-xl text-xs font-semibold transition-colors",
              theme === th.key
                ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            )}
          >
            {t(th.labelKey)}
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
