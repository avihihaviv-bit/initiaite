"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function DisclaimerBanner() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] p-4 text-xs leading-relaxed text-[var(--color-text-muted)] flex gap-2.5">
      <span className="text-base shrink-0">ℹ️</span>
      <span>{t("learn_disclaimer")}</span>
    </div>
  );
}

export function CustomVariesNote() {
  const { t } = useI18n();
  return (
    <div className="mt-3 text-xs text-[var(--color-gold)] flex items-center gap-1.5">
      <span>⚠️</span>
      <span>{t("learn_custom_varies")}</span>
    </div>
  );
}
