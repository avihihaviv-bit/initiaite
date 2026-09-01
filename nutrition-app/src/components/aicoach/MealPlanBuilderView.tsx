import { useMemo, useState } from 'react';
import { Check, RefreshCw, Shuffle, Trash2, X } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useAICoachData } from '@/hooks/useAICoachData';
import { useAppStore } from '@/store/useAppStore';
import { buildMealPlan, checkPlan, dayTotals, regenerateSlot, slotTotals } from '@/utils/mealPlanBuilder';
import type { PlanCheckRow } from '@/utils/mealPlanBuilder';
import { findFoodById } from '@/data/foods';
import { calculateNutrition } from '@/utils/nutritionCalculator';
import { formatDayLabel } from '@/utils/date';
import { MEAL_LABELS } from '@/utils/mealTime';
import type { MealPlanDay, MealPlanSlot, MealType } from '@/types';

type DaysOption = 1 | 3 | 7;
type MealsOption = 3 | 4 | 5;

export function MealPlanBuilderView() {
  const { targets, profile } = useAICoachData();
  const saveMealPlan = useAppStore((s) => s.saveMealPlan);
  const addDiaryEntry = useAppStore((s) => s.addDiaryEntry);
  const touchRecent = useAppStore((s) => s.touchRecent);

  const [days, setDays] = useState<DaysOption>(3);
  const [mealsPerDay, setMealsPerDay] = useState<MealsOption>(3);
  const [plan, setPlan] = useState<MealPlanDay[] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [addedSlotIds, setAddedSlotIds] = useState<Set<string>>(new Set());

  const check = useMemo<PlanCheckRow[]>(() => (plan ? checkPlan(plan, targets) : []), [plan, targets]);

  function generate() {
    setPlan(buildMealPlan({ days, mealsPerDay, dayTargets: targets, profile }));
    setSavedId(null);
    setAddedSlotIds(new Set());
  }

  function slotCountOfType(day: MealPlanDay, mealType: MealType): number {
    return day.slots.filter((s) => s.mealType === mealType).length;
  }

  function updateSlot(dayIndex: number, slotId: string, next: MealPlanSlot | null) {
    if (!next) return;
    setPlan((prev) =>
      prev
        ? prev.map((day) => (day.dayIndex === dayIndex ? { ...day, slots: day.slots.map((s) => (s.id === slotId ? next : s)) } : day))
        : prev,
    );
  }

  function regenerate(day: MealPlanDay, slot: MealPlanSlot, bias?: 'protein' | 'cheaper' | 'faster' | 'different') {
    const next = regenerateSlot(slot.mealType, targets, slotCountOfType(day, slot.mealType), profile, bias);
    updateSlot(day.dayIndex, slot.id, next ? { ...next, id: slot.id } : null);
  }

  function deleteSlot(dayIndex: number, slotId: string) {
    setPlan((prev) => (prev ? prev.map((day) => (day.dayIndex === dayIndex ? { ...day, slots: day.slots.filter((s) => s.id !== slotId) } : day)) : prev));
  }

  function duplicateDay(day: MealPlanDay) {
    if (!plan) return;
    const clone: MealPlanDay = { ...day, dayIndex: plan.length, date: day.date, slots: day.slots.map((s) => ({ ...s, id: `${s.id}_${plan.length}` })) };
    setPlan([...plan, clone]);
  }

  function addSlotToDiary(day: MealPlanDay, slot: MealPlanSlot) {
    for (const item of slot.items) {
      const food = findFoodById(item.foodId);
      if (!food) continue;
      addDiaryEntry({
        date: day.date,
        mealType: slot.mealType,
        foodId: food.id,
        foodName: food.name,
        foodImageEmoji: food.imageEmoji,
        quantityGrams: item.grams,
        servingLabel: `${item.grams}g`,
        nutrition: calculateNutrition(food.per100g, item.grams),
        dataQuality: food.dataQuality,
        source: 'ai_coach',
        naturalness: food.naturalness,
      });
      touchRecent({ refId: food.id, refType: 'food' });
    }
    setAddedSlotIds((prev) => new Set(prev).add(slot.id));
  }

  function save() {
    if (!plan) return;
    const id = saveMealPlan({ name: `Meal Plan — ${new Date().toLocaleDateString()}`, days: plan });
    setSavedId(id);
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="rounded-xl2 bg-white p-4 shadow-card">
        <p className="mb-3 text-sm font-bold text-ink">Build My Meal Plan</p>

        <p className="mb-1.5 text-xs font-semibold text-ink">Days</p>
        <div className="mb-4 flex gap-2">
          {([1, 3, 7] as DaysOption[]).map((d) => (
            <Chip key={d} selected={days === d} onClick={() => setDays(d)}>
              {d === 1 ? 'Today' : `${d} Days`}
            </Chip>
          ))}
        </div>

        <p className="mb-1.5 text-xs font-semibold text-ink">Meals per day</p>
        <div className="mb-4 flex gap-2">
          {([3, 4, 5] as MealsOption[]).map((m) => (
            <Chip key={m} selected={mealsPerDay === m} onClick={() => setMealsPerDay(m)}>
              {m}
            </Chip>
          ))}
        </div>

        <p className="mb-4 text-[11px] text-muted">
          Uses your daily targets ({targets.calories.toLocaleString()} kcal, {targets.proteinG}g protein) and your profile's
          preferences. Every meal can be replaced or regenerated afterward.
        </p>

        <Button fullWidth size="lg" onClick={generate}>
          🗓️ Build My Meal Plan
        </Button>
      </div>

      {plan && (
        <>
          {check.length > 0 && (
            <div className="rounded-xl2 bg-white p-4 shadow-card">
              <p className="mb-2 text-sm font-bold text-ink">Plan Check</p>
              <ul className="space-y-1.5">
                {check.map((row) => (
                  <li key={row.label} className="flex items-center gap-2 text-xs">
                    {row.ok ? <Check size={14} className="text-primary-500" /> : <X size={14} className="text-amber-500" />}
                    <span className="text-ink">{row.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.map((day) => (
            <div key={day.dayIndex} className="rounded-xl2 bg-white p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">{formatDayLabel(day.date)}</p>
                  <p className="text-[11px] text-muted">
                    {Math.round(dayTotals(day).calories)} kcal · {Math.round(dayTotals(day).proteinG)}g protein
                  </p>
                </div>
                <button
                  onClick={() => duplicateDay(day)}
                  className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:bg-gray-100"
                >
                  Duplicate day
                </button>
              </div>

              <div className="space-y-2.5">
                {day.slots.map((slot) => {
                  const totals = slotTotals(slot);
                  const added = addedSlotIds.has(slot.id);
                  return (
                    <div key={slot.id} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-muted">
                            {MEAL_LABELS[slot.mealType].emoji} {MEAL_LABELS[slot.mealType].label}
                          </p>
                          <p className="text-sm font-semibold text-ink">
                            {slot.emoji} {slot.name}
                          </p>
                          <p className="text-[11px] text-muted">
                            {Math.round(totals.calories)} kcal · {Math.round(totals.proteinG)}g protein · {Math.round(totals.carbsG)}g carbs ·{' '}
                            {Math.round(totals.fatG)}g fat
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSlot(day.dayIndex, slot.id)}
                          aria-label="Remove meal"
                          className="shrink-0 text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <IconAction icon={<RefreshCw size={11} />} label="Replace" onClick={() => regenerate(day, slot)} />
                        <IconAction icon={<Shuffle size={11} />} label="Surprise Me" onClick={() => regenerate(day, slot, 'different')} />
                        <IconAction label="🥩 More Protein" onClick={() => regenerate(day, slot, 'protein')} />
                        <IconAction label="💰 Cheaper" onClick={() => regenerate(day, slot, 'cheaper')} />
                        <IconAction label="⚡ Faster" onClick={() => regenerate(day, slot, 'faster')} />
                      </div>

                      <button
                        onClick={() => addSlotToDiary(day, slot)}
                        disabled={added}
                        className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-semibold transition ${
                          added ? 'bg-primary-500 text-white' : 'bg-white text-primary-700 shadow-sm hover:bg-primary-50'
                        }`}
                      >
                        {added ? 'Added ✓' : 'Add to Diary'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Button fullWidth onClick={save} disabled={!!savedId}>
            {savedId ? '❤️ Saved' : '❤️ Save My Plan'}
          </Button>
        </>
      )}
    </div>
  );
}

function IconAction({ icon, label, onClick }: { icon?: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-ink transition hover:border-primary-300 hover:text-primary-700"
    >
      {icon}
      {label}
    </button>
  );
}
