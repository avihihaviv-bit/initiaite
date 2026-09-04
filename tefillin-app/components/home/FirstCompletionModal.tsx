"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function FirstCompletionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center py-4">
        <div className="text-6xl mb-4 animate-pop-in">🎉</div>
        <h2 className="text-2xl font-bold mb-2">{t("first_completion_title")}</h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          {t("first_completion_subtitle")}
        </p>
        <Button size="lg" onClick={onClose} className="w-full">
          {t("first_completion_continue")}
        </Button>
      </div>
    </Modal>
  );
}
