"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useReminderScheduler } from "@/lib/useReminderScheduler";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const onboardingComplete = useAppStore((s) => s.settings.onboardingComplete);
  const router = useRouter();
  useReminderScheduler();

  useEffect(() => {
    if (hydrated && !onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, onboardingComplete, router]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-gold)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!onboardingComplete) return null;

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-24 sm:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
