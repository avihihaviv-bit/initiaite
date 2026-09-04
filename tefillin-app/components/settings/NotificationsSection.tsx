"use client";

import { useMemo } from "react";
import { SettingsSection, SettingsRow } from "./SettingsSection";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { computeAverageMarkTime, timeDiffMinutes } from "@/lib/smartReminder";
import { requestNotificationPermission } from "@/lib/useReminderScheduler";

export function NotificationsSection() {
  const { t, lang } = useI18n();
  const reminders = useAppStore((s) => s.settings.reminders);
  const setReminders = useAppStore((s) => s.setReminders);
  const logs = useAppStore((s) => s.logs);

  const suggestion = useMemo(() => {
    if (reminders.smartSuggestionDismissed) return null;
    const avg = computeAverageMarkTime(logs);
    if (!avg) return null;
    if (timeDiffMinutes(avg, reminders.first.time) < 15) return null;
    return avg;
  }, [logs, reminders.first.time, reminders.smartSuggestionDismissed]);

  function handleEnableToggle(v: boolean) {
    setReminders({ enabled: v });
    if (v) requestNotificationPermission();
  }

  return (
    <SettingsSection title={t("settings_notifications")}>
      <SettingsRow
        label={t("settings_reminders_enable")}
        control={<ToggleSwitch checked={reminders.enabled} onChange={handleEnableToggle} />}
      />

      {reminders.enabled && (
        <>
          <SlotRow
            labelKey="settings_reminder_first"
            slot={reminders.first}
            onChange={(slot) => setReminders({ first: slot })}
          />
          <SlotRow
            labelKey="settings_reminder_second"
            slot={reminders.second}
            onChange={(slot) => setReminders({ second: slot })}
          />
          <SlotRow
            labelKey="settings_reminder_final"
            slot={reminders.final}
            onChange={(slot) => setReminders({ final: slot })}
          />
          <SettingsRow
            label={t("settings_sound")}
            control={
              <ToggleSwitch
                checked={reminders.sound}
                onChange={(v) => setReminders({ sound: v })}
              />
            }
          />
          <SettingsRow
            label={t("settings_haptic")}
            control={
              <ToggleSwitch
                checked={reminders.haptic}
                onChange={(v) => setReminders({ haptic: v })}
              />
            }
          />
        </>
      )}

      {suggestion && (
        <div className="p-4">
          <Card className="p-4 bg-[var(--color-surface-2)] border-none">
            <p className="text-sm mb-3">
              {lang === "he"
                ? `שמנו לב שאתה בדרך כלל מסמן בסביבות השעה ${suggestion}. רוצה שנזכיר לך כל יום בשעה הזו?`
                : `We noticed you usually mark tefillin around ${suggestion}. Want us to remind you daily at that time?`}
            </p>
            <div className="flex gap-2">
              <Button
                size="md"
                className="flex-1"
                onClick={() => setReminders({ first: { ...reminders.first, time: suggestion } })}
              >
                {lang === "he" ? "כן, עדכן" : "Yes, update"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setReminders({ smartSuggestionDismissed: true })}
              >
                {lang === "he" ? "לא תודה" : "No thanks"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </SettingsSection>
  );
}

function SlotRow({
  labelKey,
  slot,
  onChange,
}: {
  labelKey: "settings_reminder_first" | "settings_reminder_second" | "settings_reminder_final";
  slot: { enabled: boolean; time: string };
  onChange: (slot: { enabled: boolean; time: string }) => void;
}) {
  const { t } = useI18n();
  return (
    <SettingsRow
      label={t(labelKey)}
      control={
        <div className="flex items-center gap-3">
          {slot.enabled && (
            <input
              type="time"
              value={slot.time}
              onChange={(e) => onChange({ ...slot, time: e.target.value })}
              className="bg-transparent text-sm font-medium outline-none w-20"
            />
          )}
          <ToggleSwitch checked={slot.enabled} onChange={(v) => onChange({ ...slot, enabled: v })} />
        </div>
      }
    />
  );
}
