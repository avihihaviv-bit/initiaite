"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACHIEVEMENTS } from "@/lib/achievements";

export function AchievementUnlockModal({
  ids,
  onClose,
}: {
  ids: string[];
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [index, setIndex] = useState(0);
  const [lastIds, setLastIds] = useState(ids);

  if (ids !== lastIds) {
    setLastIds(ids);
    setIndex(0);
  }

  const achievement = ACHIEVEMENTS.find((a) => a.id === ids[index]);
  if (!achievement) return null;

  function handleNext() {
    if (index < ids.length - 1) setIndex(index + 1);
    else onClose();
  }

  return (
    <Modal open={ids.length > 0} onClose={onClose}>
      <div className="text-center py-4">
        <div className="text-6xl mb-4 animate-pop-in">{achievement.icon}</div>
        <div className="text-xs uppercase tracking-wide text-[var(--color-gold)] font-semibold mb-2">
          {lang === "he" ? "הישג חדש נפתח" : "New achievement unlocked"}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {lang === "he" ? achievement.titleHe : achievement.titleEn}
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          {lang === "he" ? achievement.descHe : achievement.descEn}
        </p>
        <Button size="lg" onClick={handleNext} className="w-full">
          {index < ids.length - 1
            ? (lang === "he" ? "הבא" : "Next")
            : t("first_completion_continue")}
        </Button>
      </div>
    </Modal>
  );
}
