"use client";

import clsx from "clsx";
import { SettingsSection, SettingsRow } from "./SettingsSection";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import type { Language } from "@/lib/types";

const AVATARS = ["🕍", "🙋", "🧑", "👦", "👨", "🧔", "👴"];

export function AccountSection() {
  const { t, lang } = useI18n();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const setSettings = useAppStore((s) => s.setSettings);

  return (
    <SettingsSection title={t("settings_account")}>
      <SettingsRow
        label={t("settings_avatar")}
        control={
          <div className="flex gap-1.5">
            {AVATARS.slice(0, 5).map((a) => (
              <button
                key={a}
                onClick={() => setProfile({ avatarEmoji: a })}
                className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors",
                  profile.avatarEmoji === a
                    ? "bg-[var(--color-gold)]"
                    : "bg-[var(--color-surface-2)]"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        }
      />
      <SettingsRow
        label={t("settings_name")}
        control={
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            className="w-32 text-end bg-transparent outline-none text-sm font-medium"
            placeholder="—"
          />
        }
      />
      <SettingsRow
        label={t("settings_language")}
        control={
          <div className="flex gap-2">
            {(["he", "en"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setSettings({ language: l })}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  lang === l
                    ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                )}
              >
                {l === "he" ? "עברית" : "English"}
              </button>
            ))}
          </div>
        }
      />
    </SettingsSection>
  );
}
