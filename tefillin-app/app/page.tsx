"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

export default function RootPage() {
  const hydrated = useHydrated();
  const onboardingComplete = useAppStore((s) => s.settings.onboardingComplete);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(onboardingComplete ? "/home" : "/onboarding");
  }, [hydrated, onboardingComplete, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-navy)]">
      <div className="text-4xl animate-pulse">🕍</div>
    </div>
  );
}
