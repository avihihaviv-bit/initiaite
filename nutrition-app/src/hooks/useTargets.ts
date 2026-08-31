import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { nutritionService } from '@/services/NutritionService';
import type { MacroTargets } from '@/types';

export interface TargetsResult {
  hasProfile: boolean;
  targets: MacroTargets;
  bmr: number;
  tdee: number;
  wasCapped: boolean;
  minorGuardrail: boolean;
}

const FALLBACK_TARGETS: MacroTargets = { calories: 2000, proteinG: 100, carbsG: 250, fatG: 65 };

export function useTargets(): TargetsResult {
  const profile = useAppStore((s) => s.profile);

  return useMemo(() => {
    if (!profile) {
      return { hasProfile: false, targets: FALLBACK_TARGETS, bmr: 0, tdee: 0, wasCapped: false, minorGuardrail: false };
    }
    const { calorieResult, macros } = nutritionService.computeTargets(profile);
    return {
      hasProfile: true,
      targets: macros,
      bmr: calorieResult.bmr,
      tdee: calorieResult.tdee,
      wasCapped: calorieResult.wasCapped,
      minorGuardrail: calorieResult.minorGuardrail,
    };
  }, [profile]);
}
