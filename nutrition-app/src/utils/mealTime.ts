import type { MealType } from '@/types';

export function suggestMealType(date: Date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snacks';
}

export const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  dinner: { label: 'Dinner', emoji: '🌙' },
  snacks: { label: 'Snacks', emoji: '🍎' },
};
