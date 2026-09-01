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

/** Safe, bounded calorie adjustments for adults — never a dangerous deficit/surplus. */
const GOAL_ADJUSTMENT: Record<Goal, Record<GoalPace, number>> = {
  maintain: { moderate: 0, fast: 0 },
  lose: { moderate: -0.15, fast: -0.22 }, // capped well inside safe range
  gain: { moderate: 0.1, fast: 0.18 },
  recomposition: { moderate: -0.05, fast: -0.05 },
  performance: { moderate: 0.05, fast: 0.08 },
};

/**
 * Teen (under-18) adjustments — deliberately much gentler than the adult
 * table, and there is no "fast" pace option at all for minors (the app
 * never offers an aggressive setting to a growing body). Every goal stays
 * selectable — see calculateCalorieTarget — but the resulting swing from
 * TDEE is small on purpose, because growth and development need a
 * consistent energy supply regardless of which goal was picked.
 */
const TEEN_GOAL_ADJUSTMENT: Record<Goal, number> = {
  maintain: 0,
  lose: -0.1,
  gain: 0.1,
  recomposition: -0.03,
  performance: 0.05,
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
  /** True for any user under 18 — the UI should show the teen-guardrail message, not necessarily "goal was overridden". */
  minorGuardrail: boolean;
}

/**
 * Computes the daily calorie target with safety guardrails:
 *  - adults: deficits/surpluses are capped to a moderate, sustainable range,
 *    never below the sex-specific safe floor, never above 1.25x TDEE
 *  - under 18: EVERY goal (maintain/lose/gain/recomposition/performance)
 *    stays selectable — the app never locks a goal behind an age check —
 *    but the math always uses the much gentler TEEN_GOAL_ADJUSTMENT table,
 *    a higher effective floor (never under 90% of TDEE), and a lower
 *    ceiling (never over 1.15x TDEE). The UI must still show a message
 *    recommending involving a parent/dietitian/doctor for any
 *    weight-related goal — this is informational, not a block.
 */
export function calculateCalorieTarget(profile: UserProfile): CalorieTargetResult {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  const pct = profile.isMinor ? TEEN_GOAL_ADJUSTMENT[profile.goal] : GOAL_ADJUSTMENT[profile.goal][profile.goalPace ?? 'moderate'];
  let target = Math.round(tdee * (1 + pct));

  let wasCapped = false;
  const floor = profile.isMinor ? Math.max(SAFE_CALORIE_FLOOR[profile.sex], Math.round(tdee * 0.9)) : SAFE_CALORIE_FLOOR[profile.sex];
  if (target < floor) {
    target = floor;
    wasCapped = true;
  }
  const ceiling = Math.round(tdee * (profile.isMinor ? 1.15 : 1.25));
  if (target > ceiling) {
    target = ceiling;
    wasCapped = true;
  }

  return { tdee, bmr, targetCalories: target, wasCapped, minorGuardrail: profile.isMinor };
}

/**
 * Macro split. Protein is anchored to bodyweight (supports muscle
 * maintenance/growth regardless of goal), fat gets a healthy minimum
 * percentage of calories, and carbs fill the remainder — never a flat
 * weight-only formula.
 *
 * If `customProteinTargetG` is provided (a user-entered override), it's
 * used directly instead of the computed value — carbs/fat are still
 * derived around whatever protein figure is actually in effect, so the
 * three macros always reconcile back to targetCalories. Validate a custom
 * target against `recommendedProteinRange` before accepting it — this
 * function does not judge the input itself, it just uses it.
 */
export function calculateMacroTargets(profile: UserProfile, targetCalories: number): MacroTargets {
  const proteinPerKg = recommendedProteinPerKg(profile);
  const computedProteinG = Math.round(profile.weightKg * proteinPerKg);
  const proteinG = profile.customProteinTargetG ?? computedProteinG;
  const proteinCals = proteinG * 4;

  const fatPct = profile.isMinor ? 0.3 : 0.28; // healthy minimum share of calories; teens get a slightly higher floor
  const fatCals = targetCalories * fatPct;
  const fatG = Math.round(fatCals / 9);

  const remainingCals = Math.max(targetCalories - proteinCals - fatCals, 0);
  const carbsG = Math.round(remainingCals / 4);

  return { calories: targetCalories, proteinG, carbsG, fatG };
}

/**
 * Grams of protein per kg bodyweight, by goal — lower, general-guidance
 * ranges for under-18 users (adolescent protein needs are less
 * well-established than adult sports-nutrition ranges, so these are
 * intentionally conservative estimates, not clinical DRI figures).
 */
function recommendedProteinPerKg(profile: Pick<UserProfile, 'goal' | 'isMinor'>): number {
  if (profile.isMinor) {
    if (profile.goal === 'recomposition' || profile.goal === 'gain') return 1.6;
    if (profile.goal === 'performance') return 1.5;
    return 1.3;
  }
  if (profile.goal === 'recomposition' || profile.goal === 'gain') return 2.0;
  if (profile.goal === 'performance') return 1.8;
  return 1.6;
}

export interface ProteinRange {
  minG: number;
  maxG: number;
}

/** The recommended protein range (±15% around the computed factor) used to validate a manual override. */
export function recommendedProteinRange(profile: Pick<UserProfile, 'goal' | 'isMinor' | 'weightKg'>): ProteinRange {
  const perKg = recommendedProteinPerKg(profile);
  const mid = profile.weightKg * perKg;
  return { minG: Math.round(mid * 0.85), maxG: Math.round(mid * 1.15) };
}

export function calculateFullTargets(profile: UserProfile): { calorieResult: CalorieTargetResult; macros: MacroTargets } {
  const calorieResult = calculateCalorieTarget(profile);
  const macros = calculateMacroTargets(profile, calorieResult.targetCalories);
  return { calorieResult, macros };
}

// ---------------------------------------------------------------------------
// HYDRATION
//
// A simple, transparent estimate: ~33ml per kg bodyweight (a commonly cited
// general guideline), with a modest bump for higher activity levels and
// training days. This is explicitly an estimate, never shown as a medical
// number — see components/dashboard/WaterTracker.tsx.
// ---------------------------------------------------------------------------

export function calculateHydrationTargetMl(profile: Pick<UserProfile, 'weightKg' | 'activityLevel' | 'trainingDaysPerWeek'>): number {
  const base = profile.weightKg * 33;
  const activityBumpPct: Record<ActivityLevel, number> = {
    sedentary: 0,
    light: 0.05,
    moderate: 0.1,
    high: 0.15,
    very_high: 0.2,
  };
  const trainingBump = profile.trainingDaysPerWeek >= 3 ? 0.05 : 0;
  const total = base * (1 + activityBumpPct[profile.activityLevel] + trainingBump);
  // Round to the nearest 50ml for a clean display number.
  return Math.round(total / 50) * 50;
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
