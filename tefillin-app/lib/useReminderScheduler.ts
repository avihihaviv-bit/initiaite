"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "./store";
import { dateKey, isObligatedDay } from "./hebrewCalendar";
import { dictionaries } from "./i18n/dictionaries";

function timeMatches(now: Date, time: string): boolean {
  const [h, m] = time.split(":").map(Number);
  return now.getHours() === h && now.getMinutes() === m;
}

function notify(title: string, body: string, haptic: boolean) {
  if (typeof window === "undefined") return;
  if (haptic && "vibrate" in navigator) {
    navigator.vibrate(80);
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/icon.svg" });
  }
}

/**
 * Best-effort, foreground reminder scheduler. Real OS-level scheduled push
 * notifications require a backend + service-worker push subscription; this
 * checks reminder times once a minute while the app is open, and never fires
 * more than once per slot per day, and never fires once the day is marked done.
 */
export function useReminderScheduler() {
  const settings = useAppStore((s) => s.settings);
  const logs = useAppStore((s) => s.logs);
  const firedTodayRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      if (!settings.reminders.enabled) return;
      const now = new Date();
      if (!isObligatedDay(now, settings.diasporaMode)) return;

      const key = dateKey(now);
      const doneToday = logs[key]?.done ?? false;
      if (doneToday) return;

      const dict = dictionaries[settings.language] as Record<string, string>;
      const slots: Array<"first" | "second" | "final"> = ["first", "second", "final"];

      for (const slotName of slots) {
        const slot = settings.reminders[slotName];
        if (!slot.enabled) continue;
        const fireId = `${key}-${slotName}`;
        if (firedTodayRef.current[fireId]) continue;
        if (timeMatches(now, slot.time)) {
          firedTodayRef.current[fireId] = "1";
          const title = settings.language === "he" ? "TEFILLIN" : "TEFILLIN";
          const body =
            slotName === "first"
              ? dict.home_subtitle
              : settings.language === "he"
                ? "עוד לא סימנת שהנחת תפילין היום."
                : "You haven't marked tefillin as done today yet.";
          notify(title, body, settings.reminders.haptic);
        }
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [settings, logs]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}
