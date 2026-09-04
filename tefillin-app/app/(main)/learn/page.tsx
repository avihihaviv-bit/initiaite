"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DisclaimerBanner } from "@/components/learn/DisclaimerBanner";
import { useI18n } from "@/lib/i18n/I18nProvider";

const SECTIONS = [
  { href: "/learn/steps", icon: "🧑‍🏫", titleKey: "learn_howto_title", subKey: "learn_howto_subtitle" },
  { href: "/learn/video", icon: "🎥", titleKey: "learn_video_title", subKey: "learn_howto_subtitle" },
  { href: "/learn/cards", icon: "🧩", titleKey: "learn_cards_title", subKey: "learn_howto_subtitle" },
  { href: "/learn/prayers", icon: "📖", titleKey: "learn_prayers_title", subKey: "learn_howto_subtitle" },
] as const;

export default function LearnPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-lg mx-auto pb-8 px-5">
      <h1 className="text-2xl font-bold pt-8 mb-5">📚 {t("learn_title")}</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="p-5 h-32 flex flex-col justify-between hover:brightness-[0.98] transition">
              <span className="text-3xl">{s.icon}</span>
              <span className="font-semibold text-sm leading-tight">{t(s.titleKey)}</span>
            </Card>
          </Link>
        ))}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
