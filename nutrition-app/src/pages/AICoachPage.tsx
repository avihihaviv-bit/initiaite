import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChefHat, ClipboardList, Sparkles, UtensilsCrossed } from 'lucide-react';
import { DailyAnalysisView } from '@/components/aicoach/DailyAnalysisView';
import { WhatToEatView } from '@/components/aicoach/WhatToEatView';
import { RecipeCreatorView } from '@/components/aicoach/RecipeCreatorView';
import { MealPlanAnalyzerView } from '@/components/aicoach/MealPlanAnalyzerView';
import { MealPlanBuilderView } from '@/components/aicoach/MealPlanBuilderView';

type CoachView = 'hub' | 'eat' | 'analyze' | 'recipe' | 'plan';

const VIEW_TITLES: Record<Exclude<CoachView, 'hub'>, string> = {
  eat: 'What Should I Eat?',
  analyze: 'Analyze My Day',
  recipe: 'Create a Recipe',
  plan: 'Build / Analyze Meal Plan',
};

const VALID_VIEWS: CoachView[] = ['eat', 'analyze', 'recipe', 'plan'];

export function AICoachPage() {
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialView = VALID_VIEWS.includes(requestedView as CoachView) ? (requestedView as CoachView) : 'hub';
  const [view, setView] = useState<CoachView>(initialView);
  const [planMode, setPlanMode] = useState<'build' | 'analyze'>('build');

  if (view === 'hub') {
    return (
      <div className="space-y-6 pb-6">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Sparkles className="text-primary-500" size={24} />
            Your AI Nutrition Assistant
          </h1>
          <p className="mt-1 text-sm text-muted">
            Grounded in your real profile, goals, and food log — never generic advice, and never a reason to feel guilty about food.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HubButton
            emoji="🍽️"
            icon={<UtensilsCrossed size={22} />}
            title="What Should I Eat?"
            description="A recommendation based on what's left today."
            onClick={() => setView('eat')}
          />
          <HubButton
            emoji="📊"
            icon={<ClipboardList size={22} />}
            title="Analyze My Day"
            description="A supportive look at what you've eaten today."
            onClick={() => setView('analyze')}
          />
          <HubButton
            emoji="👨‍🍳"
            icon={<ChefHat size={22} />}
            title="Create a Recipe"
            description="A recipe built to your calories, protein, and time."
            onClick={() => setView('recipe')}
          />
          <HubButton
            emoji="🗓️"
            icon={<Sparkles size={22} />}
            title="Build / Analyze Meal Plan"
            description="Generate a multi-day plan, or review one you already made."
            onClick={() => setView('plan')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('hub')}
          aria-label="Back to AI Coach"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-card transition active:scale-90"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-ink">{VIEW_TITLES[view]}</h1>
      </div>

      {view === 'eat' && <WhatToEatView />}
      {view === 'analyze' && <DailyAnalysisView />}
      {view === 'recipe' && <RecipeCreatorView />}
      {view === 'plan' && (
        <div>
          <div className="mb-4 flex gap-2 rounded-xl bg-gray-100 p-1">
            <ModeTab active={planMode === 'build'} onClick={() => setPlanMode('build')} label="Build a Plan" />
            <ModeTab active={planMode === 'analyze'} onClick={() => setPlanMode('analyze')} label="Analyze a Plan" />
          </div>
          {planMode === 'build' ? <MealPlanBuilderView /> : <MealPlanAnalyzerView />}
        </div>
      )}
    </div>
  );
}

function HubButton({
  emoji,
  icon,
  title,
  description,
  onClick,
}: {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl2 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <span className="text-xl sm:hidden">{emoji}</span>
        <span className="hidden sm:block">{icon}</span>
      </div>
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </button>
  );
}

function ModeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${active ? 'bg-white text-ink shadow-card' : 'text-muted'}`}
    >
      {label}
    </button>
  );
}
