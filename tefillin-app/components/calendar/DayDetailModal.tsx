"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { dateKey, getDayHalachicInfo, getGregorianLabel, getWeekdayLabel } from "@/lib/hebrewCalendar";

export function DayDetailModal({
  date,
  onClose,
}: {
  date: Date | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const logs = useAppStore((s) => s.logs);
  const diasporaMode = useAppStore((s) => s.settings.diasporaMode);
  const editDay = useAppStore((s) => s.editDay);

  if (!date) return null;

  const key = dateKey(date);
  const halachic = getDayHalachicInfo(date, diasporaMode);
  const entry = logs[key];
  const weekday = getWeekdayLabel(date, lang);
  const greg = getGregorianLabel(date, lang);

  function statusLine() {
    if (!halachic.isObligated) {
      return (
        <span className="text-[var(--color-text-muted)]">
          {t("calendar_day_no_obligation")}
          {halachic.holidayName &&
            ` — ${lang === "he" ? halachic.holidayName.he : halachic.holidayName.en}`}
        </span>
      );
    }
    if (entry?.done) {
      return <span className="text-[var(--color-success)] font-medium">{t("calendar_day_done")}</span>;
    }
    return <span className="text-[var(--color-danger)] font-medium">{t("calendar_day_not_set")}</span>;
  }

  return (
    <Modal open={!!date} onClose={onClose}>
      <div className="text-center">
        <div className="text-sm text-[var(--color-text-muted)]">{weekday}</div>
        <h2 className="text-xl font-bold mt-1 mb-1">{greg}</h2>
        <div className="mb-6">{statusLine()}</div>

        {halachic.isObligated && (
          <div className="flex gap-3">
            <Button
              variant={entry?.done ? "success" : "secondary"}
              className="flex-1"
              onClick={() => editDay(date, true)}
            >
              {t("calendar_mark_done")}
            </Button>
            <Button
              variant={entry && !entry.done ? "danger" : "secondary"}
              className="flex-1"
              onClick={() => editDay(date, false)}
            >
              {t("calendar_mark_missed")}
            </Button>
          </div>
        )}

        <Button variant="ghost" className="w-full mt-3" onClick={onClose}>
          {t("calendar_close")}
        </Button>
      </div>
    </Modal>
  );
}
