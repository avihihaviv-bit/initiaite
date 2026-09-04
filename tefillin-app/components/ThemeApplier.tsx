"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function ThemeApplier() {
  const theme = useAppStore((s) => s.settings.theme);
  const lang = useAppStore((s) => s.settings.language);
  const fontSize = useAppStore((s) => s.settings.accessibility.fontSize);
  const highContrast = useAppStore((s) => s.settings.accessibility.highContrast);
  const reduceMotion = useAppStore((s) => s.settings.accessibility.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;

    function applyDark(isDark: boolean) {
      root.classList.toggle("dark", isDark);
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyDark(mq.matches);
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
    applyDark(theme === "dark");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const scale = fontSize === "sm" ? 0.9 : fontSize === "lg" ? 1.15 : 1;
    document.documentElement.style.setProperty("--font-scale", String(scale));
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? "high" : "normal";
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  return null;
}
