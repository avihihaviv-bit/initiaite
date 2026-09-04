"use client";

import { AccountSection } from "@/components/settings/AccountSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { CalendarSection } from "@/components/settings/CalendarSection";
import { AccessibilitySection } from "@/components/settings/AccessibilitySection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { AboutSection } from "@/components/settings/AboutSection";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-lg mx-auto pb-8 px-5 flex flex-col gap-6">
      <h1 className="text-2xl font-bold pt-8">⚙️ {t("settings_title")}</h1>
      <AccountSection />
      <NotificationsSection />
      <AppearanceSection />
      <CalendarSection />
      <AccessibilitySection />
      <PrivacySection />
      <AboutSection />
    </div>
  );
}
