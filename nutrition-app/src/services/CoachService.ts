import { recommendationService, type RecommendedMeal } from './RecommendationService';
import { RESTAURANTS } from '@/data/restaurants';
import type { MacroTargets, NutritionFacts } from '@/types';

export interface CoachContext {
  totals: NutritionFacts;
  targets: MacroTargets;
}

export interface CoachAnswer {
  text: string;
  recommendations?: RecommendedMeal[];
}

/**
 * On-device, rule-based "coach" — intentionally NOT a live LLM call. It
 * reasons only over the user's own logged totals/targets and a small set of
 * intent patterns. Swappable behind this same function signature for a real
 * assistant/LLM backend later; the UI always discloses that answers come
 * from local logic today.
 */
export function answerCoachQuestion(question: string, ctx: CoachContext): CoachAnswer {
  const q = question.toLowerCase();
  const remaining: MacroTargets = {
    calories: Math.max(ctx.targets.calories - ctx.totals.calories, 0),
    proteinG: Math.max(ctx.targets.proteinG - ctx.totals.proteinG, 0),
    carbsG: Math.max(ctx.targets.carbsG - ctx.totals.carbsG, 0),
    fatG: Math.max(ctx.targets.fatG - ctx.totals.fatG, 0),
  };

  if (/how (am i|are you) doing|today\??$|progress/.test(q)) {
    const pct = ctx.targets.calories > 0 ? Math.round((ctx.totals.calories / ctx.targets.calories) * 100) : 0;
    return {
      text: `You've logged ${Math.round(ctx.totals.calories)} of ~${ctx.targets.calories} kcal today (${pct}%) — about ${Math.round(remaining.calories)} kcal and ${Math.round(remaining.proteinG)}g protein left.`,
    };
  }

  if (/calorie|kcal/.test(q) && /left|remain|how many/.test(q)) {
    return { text: `You have approximately ${Math.round(remaining.calories)} kcal remaining today.` };
  }

  if (/protein/.test(q)) {
    return {
      text:
        remaining.proteinG > 0
          ? `You have about ${Math.round(remaining.proteinG)}g of protein left to hit your target of ${ctx.targets.proteinG}g.`
          : `You've already hit your protein target of ${ctx.targets.proteinG}g today — nice work.`,
    };
  }

  if (/restaurant|eat out|order/.test(q)) {
    const picks = RESTAURANTS.slice(0, 2)
      .map((r) => r.name)
      .join(' or ');
    return {
      text: `Based on what you have left today, somewhere like ${picks} could work well — check the Restaurants tab and I'll show estimated nutrition per dish before you order.`,
    };
  }

  if (/what (should|can) i (eat|have|cook)|hungry|dinner|lunch|breakfast|snack/.test(q)) {
    const recs = recommendationService.recommendMeals(remaining, 3);
    if (recs.length === 0 || remaining.calories < 100) {
      return { text: "You're close to today's calorie goal — a light snack or some water might be all you need right now." };
    }
    return {
      text: `Here's what fits best with about ${Math.round(remaining.calories)} kcal and ${Math.round(remaining.proteinG)}g protein remaining:`,
      recommendations: recs,
    };
  }

  if (/^(hi|hello|hey)\b/.test(q)) {
    return { text: "Hi! Ask me things like \"What should I eat?\", \"How am I doing today?\", or \"How much protein do I have left?\"" };
  }

  return {
    text: "I can help with things based on your logged data today — try \"What should I eat?\", \"How am I doing?\", or \"How much protein do I have left?\"",
  };
}
