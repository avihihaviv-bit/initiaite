import { recommendationService, type RecommendedMeal } from './RecommendationService';
import { matchRestaurants, type RestaurantMatch } from './RestaurantService';
import { parseFoodPhrase, type ParsedFoodMention } from '@/utils/nlFoodParser';
import { generateDailySummary, generateStatsInsights, type DailySummary, type StatsInsight } from '@/utils/insights';
import type { DayStat } from '@/hooks/useHistoryStats';
import type { MacroTargets, NutritionFacts } from '@/types';

export interface AssistantContext {
  totals: NutritionFacts;
  targets: MacroTargets;
  last7Days: DayStat[]; // includes today, oldest first
  streakDays: number;
  isMinor: boolean;
}

export type AssistantCard =
  | { type: 'food_confirm'; mentions: ParsedFoodMention[] }
  | { type: 'meal_recommendations'; recs: RecommendedMeal[] }
  | { type: 'restaurant_matches'; matches: RestaurantMatch[] }
  | { type: 'daily_summary'; summary: DailySummary }
  | { type: 'stats_insights'; insights: StatsInsight[] }
  | { type: 'open_coach'; view: 'eat' | 'analyze' | 'recipe' | 'plan'; label: string };

export interface AssistantAnswer {
  text: string;
  card?: AssistantCard;
}

function remainingOf(ctx: AssistantContext): MacroTargets {
  return {
    calories: Math.max(ctx.targets.calories - ctx.totals.calories, 0),
    proteinG: Math.max(ctx.targets.proteinG - ctx.totals.proteinG, 0),
    carbsG: Math.max(ctx.targets.carbsG - ctx.totals.carbsG, 0),
    fatG: Math.max(ctx.targets.fatG - ctx.totals.fatG, 0),
  };
}

const ADD_VERB = /^(add|log|i (?:ate|had|just ate|just had)|ate|had)\b/i;

// A question ("How can I reach my protein goal?") should never be treated as
// a food-logging statement just because a word in it happens to match a
// food/category name (e.g. "protein"). Only auto-detect food-without-an-
// explicit-verb when the input doesn't look like a question.
const QUESTION_START = /^(what|how|why|when|where|who|which|can|could|should|is|are|do|does|find|analyze|show|will|would)\b/i;

/**
 * The single brain behind both the dedicated Coach page and the global
 * floating assistant. Everything here is local, rule-based reasoning over
 * the user's own stored data — there is no live LLM call. Every numeric
 * claim is computed directly from real state; nothing is invented.
 */
export function answerAssistant(rawInput: string, ctx: AssistantContext): AssistantAnswer {
  const input = rawInput.trim();
  const q = input.toLowerCase();
  const remaining = remainingOf(ctx);

  // 1. Explicit or implicit food logging ("add two bananas", "two eggs and toast")
  const hasAddVerb = ADD_VERB.test(q);
  const looksLikeQuestion = q.includes('?') || QUESTION_START.test(q);
  const strippedForAdd = q.replace(ADD_VERB, '').trim();
  const mentions = hasAddVerb || !looksLikeQuestion ? parseFoodPhrase(hasAddVerb ? strippedForAdd : input) : [];
  if (mentions.length > 0) {
    return {
      text: `Got it — here's what I understood:`,
      card: { type: 'food_confirm', mentions },
    };
  }

  // 2. Daily summary / "how am I doing" / "analyze my day"
  if (/analyze my day|how (am i|are you) doing|day in review|my day\b/.test(q)) {
    const last7ExcludingToday = ctx.last7Days.slice(0, -1);
    const summary = generateDailySummary(ctx.totals, ctx.targets, last7ExcludingToday, ctx.streakDays);
    return { text: summary.headline, card: { type: 'daily_summary', summary } };
  }

  // 3. Stats / trends / insights
  if (/insight|trend|stats|statistics|how (was|is) my week/.test(q)) {
    const insights = generateStatsInsights(ctx.last7Days, ctx.targets.proteinG);
    return { text: "Here's what your last 7 days show:", card: { type: 'stats_insights', insights } };
  }

  // 4. Restaurants / eating out
  if (/restaurant|eat out|order|nearby|near me/.test(q)) {
    const matches = matchRestaurants(remaining);
    if (matches.length === 0) {
      return { text: "I couldn't find a restaurant that fits well right now — try browsing the Restaurants tab directly." };
    }
    return { text: `Based on what you have left today, here's what fits best:`, card: { type: 'restaurant_matches', matches } };
  }

  // 4.5 Goal intent: bulk/gain muscle, cut/fat loss, recomposition — teens
  // get supportive, non-extreme guidance instead of a hard numeric target.
  if (/\b(bulk|gain (weight|muscle)|build muscle|get bigger)\b/.test(q)) {
    return {
      text: ctx.isMinor
        ? "Let's focus on supporting muscle growth with enough food, protein, carbohydrates, recovery, and strength training — rather than trying to gain weight as fast as possible. Your plan already reflects gentle, growth-safe numbers."
        : "Got it — building muscle works best with a modest calorie surplus, enough protein, progressive strength training, and consistent recovery. Your current plan is already set up for that; check your macros on the Dashboard.",
    };
  }
  if (/\b(cut|lose fat|fat loss|shred|get lean|get shredded)\b/.test(q)) {
    return {
      text: ctx.isMinor
        ? "Let's focus on healthy habits and adequate nutrition while you're still growing — enough energy, nutrient-dense food, activity, and sleep — rather than aggressive calorie restriction. Your plan already uses gentle, growth-safe numbers."
        : "For fat loss, a moderate calorie deficit combined with enough protein and regular activity tends to work best long-term — your current plan already reflects a sustainable pace rather than an extreme one.",
    };
  }
  if (/\brecomp(osition)?\b/.test(q)) {
    return {
      text: ctx.isMinor
        ? "Recomposition at your age is mostly about consistent strength training, enough protein, balanced meals, and good recovery — not chasing a specific number on the scale."
        : "Recomposition (building muscle while losing fat) relies on strength training, enough protein, and staying close to maintenance calories — it's a slow, steady process rather than a quick transformation.",
    };
  }

  // 4.6 Recipe creation
  if (/\b(recipe|cook (me|something)|make me (a|some))\b/.test(q)) {
    return {
      text: 'The AI Recipe Creator can build one to your calories, protein, cooking time, and what you have on hand.',
      card: { type: 'open_coach', view: 'recipe', label: 'Open Recipe Creator' },
    };
  }

  // 4.7 Meal plan build/analyze
  if (/\bmeal plan|weekly plan|plan (my|the) (week|meals)\b/.test(q)) {
    return {
      text: 'I can build a multi-day plan around your targets, or review one you already have.',
      card: { type: 'open_coach', view: 'plan', label: 'Open Meal Plan Builder' },
    };
  }

  // 4.8 What's missing today — a quick cross-macro summary
  if (/what('s| is)? (missing|left)|what do i (still )?need/.test(q)) {
    const bits: string[] = [];
    if (remaining.calories > 0) bits.push(`${Math.round(remaining.calories)} kcal`);
    if (remaining.proteinG > 0) bits.push(`${Math.round(remaining.proteinG)}g protein`);
    if (remaining.carbsG > 0) bits.push(`${Math.round(remaining.carbsG)}g carbs`);
    if (remaining.fatG > 0) bits.push(`${Math.round(remaining.fatG)}g fat`);
    return {
      text: bits.length > 0 ? `You still have about ${bits.join(', ')} remaining today.` : "You've reached all your targets for today — nice work.",
    };
  }

  // 5. What should I eat / cook / hungry / meal-type words
  if (/what (should|can) i (eat|have|cook)|hungry|dinner|lunch|breakfast|snack|build me a meal|plan (my|a) (dinner|lunch|meal)/.test(q)) {
    const recs = recommendationService.recommendMeals(remaining, 3);
    if (recs.length === 0 || remaining.calories < 100) {
      return { text: "You're close to today's calorie goal — a light snack or some water might be all you need right now." };
    }
    return {
      text: `Here's what fits best with about ${Math.round(remaining.calories)} kcal and ${Math.round(remaining.proteinG)}g protein remaining:`,
      card: { type: 'meal_recommendations', recs },
    };
  }

  // 6. Calories remaining
  if (/calorie|kcal/.test(q) && /left|remain|how many/.test(q)) {
    return { text: `You have approximately ${Math.round(remaining.calories)} kcal remaining today.` };
  }

  // 7. Protein
  if (/protein/.test(q)) {
    return {
      text:
        remaining.proteinG > 0
          ? `You have about ${Math.round(remaining.proteinG)}g of protein left to hit your target of ${ctx.targets.proteinG}g.`
          : `You've already hit your protein target of ${ctx.targets.proteinG}g today — nice work.`,
    };
  }

  // 8. Greeting
  if (/^(hi|hello|hey)\b/.test(q)) {
    return { text: "Hey! Ask me things like \"What should I eat?\", \"Analyze my day\", or just tell me what you ate." };
  }

  return {
    text:
      "I can help with what's in your log today — try \"What should I eat?\", \"Analyze my day\", \"Find me a restaurant\", or tell me what you ate, like \"two eggs and toast\".",
  };
}

export const QUICK_ACTIONS = [
  "What should I eat now?",
  'Analyze my day',
  'Find me a restaurant',
  'How can I reach my protein goal?',
] as const;
