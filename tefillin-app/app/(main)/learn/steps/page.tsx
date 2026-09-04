"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomVariesNote, DisclaimerBanner } from "@/components/learn/DisclaimerBanner";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TEFILLIN_STEPS } from "@/lib/learnContent";

export default function StepsPage() {
  const { t, lang } = useI18n();
  const [index, setIndex] = useState(0);
  const step = TEFILLIN_STEPS[index];
  const isLast = index === TEFILLIN_STEPS.length - 1;

  return (
    <div className="max-w-lg mx-auto pb-8 px-5">
      <div className="flex items-center justify-between pt-8 mb-5">
        <Link href="/learn" className="text-sm text-[var(--color-text-muted)]">
          {lang === "he" ? "‹ חזרה" : "‹ Back"}
        </Link>
        <div className="text-sm text-[var(--color-text-muted)]">
          {t("learn_step_of", { current: index + 1, total: TEFILLIN_STEPS.length })}
        </div>
      </div>

      <div className="flex gap-1.5 mb-6">
        {TEFILLIN_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= index ? "bg-[var(--color-gold)]" : "bg-[var(--color-surface-2)]"
            }`}
          />
        ))}
      </div>

      <Card key={step.id} className="p-8 text-center animate-fade-in-up">
        <div className="text-6xl mb-5">{step.icon}</div>
        <h1 className="text-xl font-bold mb-3">
          {lang === "he" ? step.titleHe : step.titleEn}
        </h1>
        <p className="text-[var(--color-text-muted)] leading-relaxed">
          {lang === "he" ? step.descHe : step.descEn}
        </p>
        {step.customNote && <CustomVariesNote />}
      </Card>

      <div className="flex gap-3 mt-6">
        {index > 0 && (
          <Button variant="secondary" className="flex-1" onClick={() => setIndex(index - 1)}>
            {t("learn_step_prev")}
          </Button>
        )}
        {!isLast ? (
          <Button className="flex-1" onClick={() => setIndex(index + 1)}>
            {t("learn_step_next")}
          </Button>
        ) : (
          <Link href="/learn" className="flex-1">
            <Button className="w-full">{lang === "he" ? "סיימתי" : "Done"}</Button>
          </Link>
        )}
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
