"use client";

import Link from "next/link";
import { FlipCard } from "@/components/learn/FlipCard";
import { Fraction } from "@/components/ui/Fraction";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { LEARNING_CARDS } from "@/lib/learnContent";

export default function CardsPage() {
  const { t, lang } = useI18n();
  const learnedCount = useAppStore(
    (s) => Object.keys(s.learnedCardIds).length
  );

  return (
    <div className="max-w-lg mx-auto pb-8 px-5">
      <div className="flex items-center justify-between pt-8 mb-1">
        <Link href="/learn" className="text-sm text-[var(--color-text-muted)]">
          {lang === "he" ? "‹ חזרה" : "‹ Back"}
        </Link>
        <h1 className="font-bold text-lg">{t("learn_cards_title")}</h1>
        <span className="w-10" />
      </div>
      <p className="text-center text-sm text-[var(--color-text-muted)] mb-5">
        <Fraction a={learnedCount} b={LEARNING_CARDS.length} />
      </p>

      <div className="flex flex-col gap-3">
        {LEARNING_CARDS.map((card) => (
          <FlipCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
