"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Language } from "@/lib/types";

const STEP_COUNT = 6;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [reminderTime, setReminderTime] = useState("07:00");
  const router = useRouter();
  const { t, lang } = useI18n();

  const setProfile = useAppStore((s) => s.setProfile);
  const setSettings = useAppStore((s) => s.setSettings);
  const setReminders = useAppStore((s) => s.setReminders);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  function finish() {
    setProfile({ name: name.trim() || (lang === "he" ? "חבר" : "Friend") });
    setReminders({ first: { enabled: true, time: reminderTime } });
    completeOnboarding();
    router.replace("/home");
  }

  function next() {
    if (step < STEP_COUNT - 1) setStep(step + 1);
    else finish();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-navy)] text-white">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={back}
          className={clsx(
            "text-sm text-white/60 h-9 px-2",
            step === 0 && "invisible"
          )}
        >
          {t("onboarding_back")}
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-[var(--color-gold)]" : "w-1.5 bg-white/25"
              )}
            />
          ))}
        </div>
        <button onClick={finish} className="text-sm text-white/60 h-9 px-2">
          {t("onboarding_skip")}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {step === 0 && (
          <div key="s0" className="animate-fade-in-up">
            <div className="text-6xl mb-6">🕍</div>
            <h1 className="text-3xl font-bold mb-3">{t("onboarding_welcome_title")}</h1>
            <p className="text-white/70 text-lg">{t("onboarding_welcome_subtitle")}</p>
          </div>
        )}

        {step === 1 && (
          <div key="s1" className="animate-fade-in-up">
            <div className="text-6xl mb-6">🤝</div>
            <h1 className="text-2xl font-bold leading-relaxed max-w-xs">
              {t("onboarding_build_habit")}
            </h1>
          </div>
        )}

        {step === 2 && (
          <div key="s2" className="animate-fade-in-up w-full max-w-xs">
            <h1 className="text-2xl font-bold mb-6">{t("onboarding_name_title")}</h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("onboarding_name_placeholder")}
              className="w-full h-14 rounded-2xl bg-white/10 border border-white/15 px-4 text-center text-lg text-white placeholder-white/40 outline-none focus:border-[var(--color-gold)]"
            />
          </div>
        )}

        {step === 3 && (
          <div key="s3" className="animate-fade-in-up w-full max-w-xs">
            <h1 className="text-2xl font-bold mb-6">{t("onboarding_reminder_title")}</h1>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full h-14 rounded-2xl bg-white/10 border border-white/15 px-4 text-center text-2xl text-white outline-none focus:border-[var(--color-gold)]"
              style={{ colorScheme: "dark" }}
            />
          </div>
        )}

        {step === 4 && (
          <div key="s4" className="animate-fade-in-up w-full max-w-xs">
            <h1 className="text-2xl font-bold mb-6">{t("onboarding_language_title")}</h1>
            <div className="flex gap-3">
              {(["he", "en"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setSettings({ language: l })}
                  className={clsx(
                    "flex-1 h-14 rounded-2xl border text-lg font-semibold transition-colors",
                    lang === l
                      ? "bg-[var(--color-gold)] text-[var(--color-gold-contrast)] border-[var(--color-gold)]"
                      : "bg-white/10 border-white/15 text-white"
                  )}
                >
                  {l === "he" ? "עברית" : "English"}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div key="s5" className="animate-fade-in-up">
            <div className="text-6xl mb-6">✨</div>
            <h1 className="text-2xl font-bold mb-3">{t("onboarding_ready_title")}</h1>
            <p className="text-white/70">{t("onboarding_ready_subtitle")}</p>
          </div>
        )}
      </div>

      <div className="px-8 pb-10 pt-4">
        <Button
          size="lg"
          onClick={next}
          className="w-full !bg-[var(--color-gold)] !text-[var(--color-gold-contrast)]"
        >
          {step === STEP_COUNT - 1 ? t("onboarding_start_button") : t("onboarding_next")}
        </Button>
      </div>
    </div>
  );
}
