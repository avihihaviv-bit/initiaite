import { FOODS } from '@/data/foods';
import { RESTAURANT_DISHES } from '@/data/restaurants';
import type { FoodItem, RestaurantDish, ServingUnit } from '@/types';

/** Anything the parser can resolve a phrase to — a database food or a restaurant dish. */
export type MatchableFood = FoodItem | RestaurantDish;

const MATCH_POOL: MatchableFood[] = [...FOODS, ...RESTAURANT_DISHES];

// ---------------------------------------------------------------------------
// Lightweight, local, rule-based natural-language food parser.
//
// This is NOT an LLM call — it's a small on-device heuristic (number words +
// unit words + keyword matching against the local food database) that lets
// the assistant understand short phrases like "two slices of pizza" or
// "chicken and rice, one plate" well enough to pre-fill an editable confirm
// card. It will misparse unusual phrasing, which is exactly why every result
// is shown to the user for confirmation/editing before anything is logged —
// never auto-logged silently.
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  couple: 2,
  few: 3,
};

// Word-boundary anchored so these only match whole unit words — e.g. an
// unanchored /g|grams?/ would match "eggs" (it contains a "g") and silently
// misparse "two eggs" as literally 2 grams of food.
const UNIT_WORDS: { pattern: RegExp; unit: ServingUnit }[] = [
  { pattern: /\bslices?\b/i, unit: 'piece' },
  { pattern: /\bpieces?\b/i, unit: 'piece' },
  { pattern: /\bservings?\b/i, unit: 'serving' },
  { pattern: /\bplates?\b/i, unit: 'serving' },
  { pattern: /\bbowls?\b/i, unit: 'serving' },
  { pattern: /\bcups?\b/i, unit: 'serving' },
  { pattern: /\b(?:g|grams?)\b/i, unit: 'g' },
];

export interface ParsedFoodMention {
  raw: string;
  food: MatchableFood;
  quantity: number;
  grams: number;
}

/** A small set of common colloquial terms mapped to a canonical food id, for words that share no letters with the actual food name (e.g. "toast" vs "bread"). */
const SYNONYM_TO_FOOD_ID: Record<string, string> = {
  toast: 'whole-wheat-bread',
  toasts: 'whole-wheat-bread',
  yogurt: 'greek-yogurt',
  yoghurt: 'greek-yogurt',
  oats: 'oatmeal',
  porridge: 'oatmeal',
};

function extractQuantity(segment: string): { quantity: number; rest: string } {
  const trimmed = segment.trim();
  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*/);
  if (numMatch) {
    return { quantity: Number(numMatch[1]), rest: trimmed.slice(numMatch[0].length) };
  }
  const wordMatch = trimmed.match(/^([a-z]+)\s+/i);
  if (wordMatch && NUMBER_WORDS[wordMatch[1].toLowerCase()]) {
    return { quantity: NUMBER_WORDS[wordMatch[1].toLowerCase()], rest: trimmed.slice(wordMatch[0].length) };
  }
  return { quantity: 1, rest: trimmed };
}

function detectUnit(text: string): ServingUnit | null {
  for (const { pattern, unit } of UNIT_WORDS) {
    if (pattern.test(text)) return unit;
  }
  return null;
}

function findBestFoodMatch(text: string): MatchableFood | null {
  const words = text
    .toLowerCase()
    .replace(/\bof\b/g, ' ')
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !UNIT_WORDS.some(({ pattern }) => pattern.test(w)));

  if (words.length === 0) return null;

  for (const w of words) {
    const synonymId = SYNONYM_TO_FOOD_ID[w];
    if (synonymId) {
      const match = MATCH_POOL.find((f) => f.id === synonymId);
      if (match) return match;
    }
  }

  let best: { food: MatchableFood; score: number } | null = null;
  for (const food of MATCH_POOL) {
    // .filter(Boolean) drops empty strings produced by trailing punctuation
    // (e.g. "Chicken Breast (cooked)" splits to [...,"cooked", ""]) — without
    // it, nw === "" makes `w.startsWith(nw)` true for every word, so the
    // first food in the array would spuriously "match" any query.
    const nameWords = food.name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const categoryWord = ('category' in food ? food.category : undefined)?.toLowerCase() ?? '';
    let score = 0;
    for (const w of words) {
      if (nameWords.some((nw) => nw === w)) score += 2;
      else if (nameWords.some((nw) => nw.length >= 3 && (nw.startsWith(w) || w.startsWith(nw)))) score += 1;
      if (categoryWord === w) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { food, score };
    }
  }
  return best?.food ?? null;
}

/** Splits "two eggs, toast and a banana" into ["two eggs", "toast", "a banana"]. */
function splitMentions(input: string): string[] {
  return input
    .split(/,|\band\b|\+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseFoodPhrase(input: string): ParsedFoodMention[] {
  const segments = splitMentions(input);
  const results: ParsedFoodMention[] = [];

  for (const segment of segments) {
    const { quantity, rest } = extractQuantity(segment);
    const food = findBestFoodMatch(rest || segment);
    if (!food) continue;

    const unit = detectUnit(segment);
    const pieceOption = food.servingOptions.find((o) => o.unit === 'piece');
    let grams: number;
    if (unit === 'piece' && pieceOption) {
      grams = pieceOption.grams * quantity;
    } else if (unit === 'g') {
      grams = quantity;
    } else {
      grams = food.defaultServing.grams * quantity;
    }

    results.push({ raw: segment, food, quantity, grams: Math.round(grams) });
  }

  return results;
}
