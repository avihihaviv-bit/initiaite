import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MacroCard } from '@/components/dashboard/MacroCard';
import { SmartSuggestions } from '@/components/dashboard/SmartSuggestions';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { MealRecommendations } from '@/components/dashboard/MealRecommendations';
import { MealSection } from '@/components/diary/MealSection';
import { Button } from '@/components/ui/Button';
import { useTargets } from '@/hooks/useTargets';
import { useDiaryForDate, MEAL_TYPES } from '@/hooks/useDiary';
import { todayISO } from '@/utils/date';
import { formatKcal } from '@/utils/format';

export function DashboardPage() {
  const date = todayISO();
  const { targets } = useTargets();
  const diary = useDiaryForDate(date);

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-7 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{todayLabel}</p>
          <h1 className="text-2xl font-bold text-ink">Today</h1>
        </div>
        <Link
          to="/add"
          className="hidden items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-600 active:scale-95 sm:flex"
        >
          <Plus size={16} />
          Add Food
        </Link>
      </header>

      {/* Calorie summary */}
      <div className="flex flex-col items-center rounded-xl2 bg-white p-6 shadow-card">
        <div className="mb-4 flex w-full items-center justify-between text-sm">
          <div className="text-center">
            <p className="font-bold tabular-nums text-ink">{formatKcal(diary.totals.calories)}</p>
            <p className="text-xs text-muted">🔥 consumed</p>
          </div>
          <div className="text-center">
            <p className="font-bold tabular-nums text-ink">{formatKcal(targets.calories)}</p>
            <p className="text-xs text-muted">🎯 goal</p>
          </div>
        </div>

        <ProgressRing consumed={diary.totals.calories} goal={targets.calories} />

        <Link to="/add" className="mt-5 w-full sm:hidden">
          <Button fullWidth size="lg" icon={<Plus size={18} />}>
            Add Food
          </Button>
        </Link>
      </div>

      <SmartSuggestions totals={diary.totals} targets={targets} hasEntries={diary.entries.length > 0} />

      <Link
        to="/coach"
        className="flex items-center gap-3 rounded-xl2 bg-ink p-4 text-white shadow-card transition hover:-translate-y-0.5 active:scale-[0.98] lg:hidden"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Ask your AI Coach</p>
          <p className="text-xs text-white/60">&quot;What should I eat?&quot; &middot; &quot;How am I doing?&quot;</p>
        </div>
      </Link>

      {/* Macros */}
      <div>
        <h2 className="mb-2.5 text-sm font-bold text-ink">Macros</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <MacroCard emoji="🥩" label="Protein" consumed={diary.totals.proteinG} goal={targets.proteinG} color="#F97316" />
          <MacroCard emoji="🍚" label="Carbs" consumed={diary.totals.carbsG} goal={targets.carbsG} color="#3B82F6" />
          <MacroCard emoji="🥑" label="Fat" consumed={diary.totals.fatG} goal={targets.fatG} color="#F59E0B" />
        </div>
      </div>

      <ActivityCard />

      <WaterTracker />

      <MealRecommendations totals={diary.totals} targets={targets} date={date} />

      {/* Meals */}
      <div className="space-y-6">
        {MEAL_TYPES.map((mt) => (
          <MealSection key={mt} mealType={mt} entries={diary.byMeal[mt]} totals={diary.mealTotals[mt]} date={date} />
        ))}
      </div>
    </div>
  );
}
