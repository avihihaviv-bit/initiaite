"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { DisclaimerBanner } from "@/components/learn/DisclaimerBanner";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PRAYER_TEXTS } from "@/lib/learnContent";

const SIZES = { sm: "text-lg", md: "text-xl", lg: "text-2xl" } as const;
type SizeKey = keyof typeof SIZES;

export default function PrayersPage() {
  const { t, lang } = useI18n();
  const [size, setSize] = useState<SizeKey>("md");
  const [readingMode, setReadingMode] = useState(false);

  return (
    <div className={clsx("pb-8 px-5", readingMode ? "max-w-2xl mx-auto" : "max-w-lg mx-auto")}>
      <div className="flex items-center justify-between pt-8 mb-5">
        <Link href="/learn" className="text-sm text-[var(--color-text-muted)]">
          {lang === "he" ? "‹ חזרה" : "‹ Back"}
        </Link>
        <h1 className="font-bold text-lg">{t("learn_prayers_title")}</h1>
        <span className="w-10" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">{t("learn_font_size")}</span>
          {(Object.keys(SIZES) as SizeKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={clsx(
                "w-8 h-8 rounded-full text-xs font-semibold card-surface",
                size === s && "bg-[var(--color-gold)] text-[var(--color-gold-contrast)] border-[var(--color-gold)]"
              )}
            >
              א
            </button>
          ))}
        </div>
        <button
          onClick={() => setReadingMode((r) => !r)}
          className={clsx(
            "text-xs font-semibold px-3 py-1.5 rounded-full card-surface",
            readingMode && "bg-[var(--color-gold)] text-[var(--color-gold-contrast)] border-[var(--color-gold)]"
          )}
        >
          🌙 {t("learn_reading_mode")}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {PRAYER_TEXTS.map((p) => (
          <Card key={p.id} className="p-6">
            <h2 className="font-bold text-sm text-[var(--color-gold)] mb-3">
              {lang === "he" ? p.titleHe : p.titleEn}
            </h2>
            <p
              dir="rtl"
              className={clsx(
                SIZES[size],
                "leading-loose whitespace-pre-line",
                readingMode && "font-[var(--font-serif-he)]"
              )}
            >
              {p.textHe}
            </p>
            {(p.noteHe || p.noteEn) && (
              <p className="text-xs text-[var(--color-text-muted)] mt-3 border-t border-[var(--color-border)] pt-3">
                {lang === "he" ? p.noteHe : p.noteEn}
              </p>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
