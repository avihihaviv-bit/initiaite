"use client";

import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ThemeApplier } from "./ThemeApplier";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeApplier />
      {children}
    </I18nProvider>
  );
}
