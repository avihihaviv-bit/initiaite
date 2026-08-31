import type {
  ActivityLevel,
  Goal,
  GoalPace,
  MacroTargets,
  NutritionFacts,
  ServingUnit,
  UserProfile,
} from '@/types';

// ---------------------------------------------------------------------------
// NUTRITION CALCULATION ENGINE
//
// BMR: Mifflin-St Jeor equation (1990) — widely regarded as the most
// accurate predictive equation for the general population, more so than
// the older Harris-Benedict formula.
//   Male:   BMR = 10*kg + 6.25*cm - 5*age + 5
//   Female: BMR = 10*kg + 6.25*cm - 5*age - 161
//
// TDEE = BMR * activity multiplier (Katch-McArdle activity factors).
//
// All results are ESTIMATES. Individual metabolism varies +/-10-15% from
// these formulas, which is why the UI always labels them as such and never
// presents them as exact figures.
// ---------------------------------------------------------------------------

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // light exercise 1-3 days/week
  moderate: 1.55, // moderate exercise 3-5 days/week
  high: 1.725, // hard exercise 6-7 days/week
  very_high: 1.9, // very hard exercise & physical job
};

export function calculateBMR(profile: Pick<UserProfile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const { sex, weightKg, heightCm, age } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(profile: Pick<UserProfile, 'sex' | 'weightKg' | 'heightCm' | 'age' | 'activityLevel'>): number {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

/** Safe, bounded calorie adjustments — never allows a dangerous deficit/surplus. */
const GOAL_ADJUSTMENT: Record<Goal, Record<GoalPace, number>> = {
  maintain: { moderate: 0, fast: 0 },
  lose: { moderate: -0.15, fast: -0.22 }, // capped well inside safe range
  gain: { moderate: 0.1, fast: 0.18 },
  recomposition: { moderate: -0.05, fast: -0.05 },
  performance: { moderate: 0.05, fast: 0.08 },
};

/**
 * Absolute floor calories that we will never go under, regardless of the
 * formula's output — protects against dangerously low targets for people
 * with a low BMR (short stature, older age, low body weight).
 */
const SAFE_CALORIE_FLOOR: Record<'male' | 'female', number> = {
  male: 1500,
  female: 1200,
};

export interface CalorieTargetResult {
  tdee: number;
  bmr: number;
  targetCalories: number;
  wasCapped: boolean;
  minorGuardrail: boolean;
}

/**
 * Computes the daily calorie target with hard safety guardrails:
 *  - deficits/surpluses are capped to a moderate, sustainable range
 *  - target is never allowed below the sex-specific safe floor
 *  - minors are always treated as "maintain" — the app never prescribes a
 *    weight-loss/aggressive target for a user under 18. The UI must show a
 *    message recommending involving a parent/dietitian/doctor instead.
 */
export function calculateCalorieTarget(profile: UserProfile): CalorieTargetResult {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  if (profile.isMinor) {
    return { tdee, bmr, targetCalories: tdee, wasCapped: false, minorGuardrail: true };
  }

  const pace = profile.goalPace ?? 'moderate';
  const pct = GOAL_ADJUSTMENT[profile.goal][pace];
  let target = Math.round(tdee * (1 + pct));

  const floor = SAFE_CALORIE_FLOOR[profile.sex];
  let wasCapped = false;
  if (target < floor) {
    target = floor;
    wasCapped = true;
  }
  // Also never allow the target to exceed a sane surplus above TDEE.
  const ceiling = Math.round(tdee * 1.25);
  if (target > ceiling) {
    target = ceiling;
    wasCapped = true;
  }

  return { tdee, bmr, targetCalories: target, wasCapped, minorGuardrail: false };
}

/**
 * Macro split. Protein is anchored to bodyweight (supports muscle
 * maintenance/growth regardless of goal), fat gets a healthy minimum
 * percentage of calories, and carbs fill the remainder.
 */
export function calculateMacroTargets(profile: UserProfile, targetCalories: number): MacroTargets {
  const proteinPerKg =
    profile.goal === 'recomposition' || profile.goal === 'gain'
      ? 2.0
      : profile.goal === 'performance'
        ? 1.8
        : 1.6;

  const proteinG = Math.round(profile.weightKg * proteinPerKg);
  const proteinCals = proteinG * 4;

  const fatPct = 0.28; // ~28% of calories from fat — healthy minimum
  const fatCals = targetCalories * fatPct;
  const fatG = Math.round(fatCals / 9);

  const remainingCals = Math.max(targetCalories - proteinCals - fatCals, 0);
  const carbsG = Math.round(remainingCals / 4);

  return { calories: targetCalories, proteinG, carbsG, fatG };
}

export function calculateFullTargets(profile: UserProfile): { calorieResult: CalorieTargetResult; macros: MacroTargets } {
  const calorieResult = calculateCalorieTarget(profile);
  const macros = calculateMacroTargets(profile, calorieResult.targetCalories);
  return { calorieResult, macros };
}

// ---------------------------------------------------------------------------
// PER-FOOD NUTRITION CALCULATION
//
// calculateNutrition scales a food's per-100g baseline nutrition to any
// requested quantity. It never hard-codes values for specific serving
// sizes — every serving option is just a gram-equivalent, so changing the
// quantity always recomputes from the same per-100g source of truth.
// ---------------------------------------------------------------------------

export function calculateNutrition(per100g: NutritionFacts, quantityGrams: number): NutritionFacts {
  const factor = quantityGrams / 100;
  const round = (n: number | undefined, digits = 1) =>
    n === undefined ? undefined : Math.round(n * factor * 10 ** digits) / 10 ** digits;

  return {
    calories: Math.round(per100g.calories * factor),
    proteinG: round(per100g.proteinG) ?? 0,
    carbsG: round(per100g.carbsG) ?? 0,
    fatG: round(per100g.fatG) ?? 0,
    fiberG: round(per100g.fiberG),
    sugarG: round(per100g.sugarG),
    sodiumMg: per100g.sodiumMg === undefined ? undefined : Math.round(per100g.sodiumMg * factor),
  };
}

export function gramsForUnit(unit: ServingUnit, grams: number, quantity: number): number {
  if (unit === 'g' || unit === 'ml') return quantity;
  return grams * quantity;
}

export function sumNutrition(items: NutritionFacts[]): NutritionFacts {
  return items.reduce<NutritionFacts>(
    (acc, cur) => ({
      calories: acc.calories + cur.calories,
      proteinG: acc.proteinG + cur.proteinG,
      carbsG: acc.carbsG + cur.carbsG,
      fatG: acc.fatG + cur.fatG,
      fiberG: (acc.fiberG ?? 0) + (cur.fiberG ?? 0),
      sugarG: (acc.sugarG ?? 0) + (cur.sugarG ?? 0),
      sodiumMg: (acc.sodiumMg ?? 0) + (cur.sodiumMg ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 },
  );
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}
