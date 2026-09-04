"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { dictionaries, type DictKey } from "./dictionaries";
import { useAppStore } from "../store";
import type { Language } from "../types";

interface I18nContextValue {
  lang: Language;
  dir: "rtl" | "ltr";
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    str
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useAppStore((s) => s.settings.language);
  const dir: "rtl" | "ltr" = lang === "he" ? "rtl" : "ltr";

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang] as Record<string, string>;
      const raw = dict[key] ?? key;
      return interpolate(raw, vars);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, dir, t }), [lang, dir, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
