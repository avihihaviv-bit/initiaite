"use client";

import { useState } from "react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import type { CardDef } from "@/lib/learnContent";

export function FlipCard({ card }: { card: CardDef }) {
  const { t, lang } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const learned = useAppStore((s) => !!s.learnedCardIds[card.id]);
  const toggleLearned = useAppStore((s) => s.toggleCardLearned);

  return (
    <div
      className="card-surface rounded-2xl p-5 cursor-pointer select-none transition-shadow hover:shadow-md"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl">{card.icon}</span>
        {learned && (
          <span className="text-xs font-medium text-[var(--color-success)] shrink-0">
            {t("learn_learned")}
          </span>
        )}
      </div>
      <p className="font-semibold mt-3 mb-2">
        {lang === "he" ? card.questionHe : card.questionEn}
      </p>
      <div
        className={clsx(
          "grid transition-all duration-300",
          flipped ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed pb-3">
            {lang === "he" ? card.answerHe : card.answerEn}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLearned(card.id);
            }}
            className={clsx(
              "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
              learned
                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text)]"
            )}
          >
            {learned ? t("learn_learned") : t("learn_mark_learned")}
          </button>
        </div>
      </div>
      {!flipped && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {lang === "he" ? "הקש להצגת התשובה" : "Tap to reveal the answer"}
        </p>
      )}
    </div>
  );
}
