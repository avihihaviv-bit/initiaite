import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { DiaryEntryRow } from './DiaryEntryRow';
import { MEAL_LABELS } from '@/utils/mealTime';
import type { DiaryEntry, MealType, NutritionFacts } from '@/types';

interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntry[];
  totals: NutritionFacts;
  date: string;
}

export function MealSection({ mealType, entries, totals, date }: MealSectionProps) {
  const { label, emoji } = MEAL_LABELS[mealType];

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <span>{emoji}</span>
          {label}
        </h3>
        <span className="text-sm font-semibold tabular-nums text-muted">{Math.round(totals.calories)} kcal</span>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <DiaryEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <Link
          to={`/add?date=${date}&meal=${mealType}`}
          className="flex items-center justify-center gap-1.5 rounded-xl2 border-2 border-dashed border-gray-200 bg-white/60 py-3.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:text-primary-600"
        >
          <Plus size={15} />
          Add food to {label.toLowerCase()}
        </Link>
      )}
    </section>
  );
}
