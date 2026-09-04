"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsSection, SettingsRow } from "./SettingsSection";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";

export function PrivacySection() {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const state = useAppStore();
  const resetAllData = useAppStore((s) => s.resetAllData);
  const router = useRouter();

  function exportData() {
    const { profile, settings, logs, unlockedAchievements, learnedCardIds } = state;
    const payload = { profile, settings, logs, unlockedAchievements, learnedCardIds };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tefillin-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleDelete() {
    resetAllData();
    setConfirmOpen(false);
    router.replace("/onboarding");
  }

  return (
    <SettingsSection title={t("settings_privacy")}>
      <button className="w-full text-start" onClick={exportData}>
        <SettingsRow label={t("settings_export_data")} control={<span>📤</span>} />
      </button>
      <button className="w-full text-start" onClick={() => setConfirmOpen(true)}>
        <SettingsRow
          label={<span className="text-[var(--color-danger)]">{t("settings_delete_data")}</span>}
          control={<span>🗑️</span>}
        />
      </button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="text-center py-2">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="mb-6 text-sm leading-relaxed">{t("settings_delete_confirm")}</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
              {t("common_cancel")}
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              {t("settings_delete_data")}
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsSection>
  );
}
