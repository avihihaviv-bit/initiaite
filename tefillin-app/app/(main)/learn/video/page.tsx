"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DisclaimerBanner } from "@/components/learn/DisclaimerBanner";
import { useI18n } from "@/lib/i18n/I18nProvider";

const TABS = ["full", "short", "steps"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, { he: string; en: string }> = {
  full: { he: "סרטון מלא", en: "Full video" },
  short: { he: "סרטון קצר", en: "Short clip" },
  steps: { he: "מדריך לפי שלבים", en: "Step-by-step" },
};

export default function VideoGuidePage() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("full");

  return (
    <div className="max-w-lg mx-auto pb-8 px-5">
      <div className="flex items-center justify-between pt-8 mb-5">
        <Link href="/learn" className="text-sm text-[var(--color-text-muted)]">
          {lang === "he" ? "‹ חזרה" : "‹ Back"}
        </Link>
        <h1 className="font-bold text-lg">{t("learn_video_title")}</h1>
        <span className="w-10" />
      </div>

      <div className="flex gap-2 mb-5">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={clsx(
              "flex-1 h-10 rounded-xl text-sm font-medium transition-colors",
              tab === tb
                ? "bg-[var(--color-navy)] text-white dark:bg-[var(--color-gold)] dark:text-[var(--color-gold-contrast)]"
                : "card-surface text-[var(--color-text-muted)]"
            )}
          >
            {lang === "he" ? TAB_LABEL[tb].he : TAB_LABEL[tb].en}
          </button>
        ))}
      </div>

      <Card className="aspect-video flex flex-col items-center justify-center gap-3 bg-[var(--color-navy)] border-none text-white">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-2xl">▶️</span>
        </div>
        <p className="text-sm text-white/70 px-8 text-center">
          {lang === "he"
            ? "מדריך הווידאו יתווסף בקרוב. בינתיים, מומלץ לעבור על המדריך הכתוב שלב אחר שלב."
            : "The video guide is coming soon. In the meantime, try the written step-by-step guide."}
        </p>
      </Card>

      <Link href="/learn/steps" className="block mt-4">
        <Button className="w-full">🧑‍🏫 {t("learn_howto_title")}</Button>
      </Link>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </div>
  );
}
