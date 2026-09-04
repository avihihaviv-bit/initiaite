"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";

export default function OnboardingPage() {
  const hydrated = useHydrated();
  const onboardingComplete = useAppStore((s) => s.settings.onboardingComplete);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && onboardingComplete) router.replace("/home");
  }, [hydrated, onboardingComplete, router]);

  if (!hydrated) {
    return <div className="min-h-dvh bg-[var(--color-navy)]" />;
  }

  return <OnboardingFlow />;
}
