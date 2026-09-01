import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, Mic, Send, Sparkles } from 'lucide-react';
import { DailyAnalysisView } from '@/components/aicoach/DailyAnalysisView';
import { WhatToEatView } from '@/components/aicoach/WhatToEatView';
import { RecipeCreatorView } from '@/components/aicoach/RecipeCreatorView';
import { MealPlanAnalyzerView } from '@/components/aicoach/MealPlanAnalyzerView';
import { MealPlanBuilderView } from '@/components/aicoach/MealPlanBuilderView';
import { AIRestaurantFinderView } from '@/components/aicoach/AIRestaurantFinderView';
import { BiasedMealView } from '@/components/aicoach/BiasedMealView';
import { CalculationDebugView } from '@/components/aicoach/CalculationDebugView';
import { renderCard } from '@/components/assistant/AIAssistantPanel';
import { answerAssistant } from '@/services/AssistantService';
import { useAssistantContext } from '@/hooks/useAssistantContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAICoachData } from '@/hooks/useAICoachData';
import { useLocaleStore, isRTL } from '@/store/useLocaleStore';
import { useCoachT } from '@/i18n/coachStrings';
import type { AssistantCard } from '@/services/AssistantService';

type CoachView = 'hub' | 'eat' | 'analyze' | 'recipe' | 'plan' | 'restaurant' | 'protein' | 'calories' | 'debug';

const VIEW_TITLES: Record<Exclude<CoachView, 'hub'>, string> = {
  eat: 'What Should I Eat?',
  analyze: 'Analyze My Day',
  recipe: 'Create a Recipe',
  plan: 'Build / Analyze Meal Plan',
  restaurant: 'Find a Restaurant',
  protein: 'High Protein Options',
  calories: 'Low-Calorie Options',
  debug: 'Calculation Debug',
};

const VALID_VIEWS: CoachView[] = ['eat', 'analyze', 'recipe', 'plan', 'restaurant', 'protein', 'calories', 'debug'];

export function AICoachPage() {
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const initialView = VALID_VIEWS.includes(requestedView as CoachView) ? (requestedView as CoachView) : 'hub';
  const [view, setView] = useState<CoachView>(initialView);
  const [planMode, setPlanMode] = useState<'build' | 'analyze'>('build');
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);
  const rtl = isRTL(language);
  const t = useCoachT();

  if (view === 'hub') {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-5 pb-6">
        <div className="flex items-start justify-between gap-3">
          <header>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-fg">
              <Sparkles className="text-primary-500" size={24} />
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
          </header>
          <div className="flex shrink-0 gap-1 rounded-lg bg-surface-alt2 p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${language === 'en' ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('he')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${language === 'he' ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}
            >
              עברית
            </button>
          </div>
        </div>

        <LiveMacroStrip t={t} />

        <div>
          <p className="mb-2.5 text-sm font-bold text-fg">⚡ {t('quickActions')}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <QuickButton emoji="🍽️" label={t('whatToEat')} onClick={() => setView('eat')} />
            <QuickButton emoji="📊" label={t('howDidIEat')} onClick={() => setView('analyze')} />
            <QuickButton emoji="🍗" label={t('highProtein')} onClick={() => setView('protein')} />
            <QuickButton emoji="🔥" label={t('lowCalorie')} onClick={() => setView('calories')} />
            <QuickButton emoji="🏪" label={t('findRestaurant')} onClick={() => setView('restaurant')} />
            <QuickButton emoji="👨‍🍳" label={t('createRecipe')} onClick={() => setView('recipe')} />
            <QuickButton emoji="📋" label={t('checkPlan')} onClick={() => setView('plan')} />
            <QuickButton emoji="🧠" label={t('askAi')} onClick={() => document.getElementById('coach-ask-input')?.focus()} />
          </div>
        </div>

        <RecommendationCard onOpen={() => setView('eat')} label={t('recommendationForYou')} />

        <EmbeddedAskAI t={t} />

        <button
          onClick={() => setView('debug')}
          className="block w-full text-center text-[11px] text-faint hover:text-faint"
        >
          🔍 {t('debugLink')}
        </button>
      </div>
    );
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('hub')}
          aria-label="Back to AI Coach"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-fg shadow-card transition active:scale-90"
        >
          <ChevronLeft size={18} className={rtl ? 'rotate-180' : ''} />
        </button>
        <h1 className="text-xl font-bold text-fg">{VIEW_TITLES[view]}</h1>
      </div>

      {view === 'eat' && <WhatToEatView />}
      {view === 'analyze' && <DailyAnalysisView />}
      {view === 'recipe' && <RecipeCreatorView />}
      {view === 'restaurant' && <AIRestaurantFinderView />}
      {view === 'protein' && <BiasedMealView bias="protein" />}
      {view === 'calories' && <BiasedMealView bias="calories" />}
      {view === 'debug' && <CalculationDebugView />}
      {view === 'plan' && (
        <div>
          <div className="mb-4 flex gap-2 rounded-xl bg-surface-alt2 p-1">
            <ModeTab active={planMode === 'build'} onClick={() => setPlanMode('build')} label="Build a Plan" />
            <ModeTab active={planMode === 'analyze'} onClick={() => setPlanMode('analyze')} label="Analyze a Plan" />
          </div>
          {planMode === 'build' ? <MealPlanBuilderView /> : <MealPlanAnalyzerView />}
        </div>
      )}
    </div>
  );
}

function LiveMacroStrip({ t }: { t: ReturnType<typeof useCoachT> }) {
  const { remaining } = useAICoachData();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <MacroPill emoji="🔥" value={Math.round(remaining.calories)} label={t('caloriesLeft')} />
      <MacroPill emoji="🥩" value={Math.round(remaining.proteinG)} label={t('proteinLeft')} />
      <MacroPill emoji="🍚" value={Math.round(remaining.carbsG)} label={t('carbsLeft')} />
      <MacroPill emoji="🥑" value={Math.round(remaining.fatG)} label={t('fatLeft')} />
    </div>
  );
}

function MacroPill({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="rounded-xl2 bg-surface p-3 text-center shadow-card">
      <p className="text-base leading-none">{emoji}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-fg" dir="ltr">
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function QuickButton({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl2 bg-surface p-3.5 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated active:scale-95"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-xs font-semibold leading-tight text-fg">{label}</span>
    </button>
  );
}

function RecommendationCard({ onOpen, label }: { onOpen: () => void; label: string }) {
  const { remaining, profile, entries } = useAICoachData();
  if (entries.length === 0) return null;
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-xl2 bg-ink p-4 text-left text-white shadow-card transition hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
        <Sparkles size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">✨ {label}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug">
          {remaining.calories > 0
            ? `You have about ${Math.round(remaining.calories)} kcal and ${Math.round(remaining.proteinG)}g protein left — tap for a matching meal.`
            : "You're close to today's targets — tap for a light option that still fits."}
        </p>
        {profile?.goal && <p className="mt-1 text-xs text-white/60">Tailored to your {profile.goal.replace('_', ' ')} goal.</p>}
      </div>
    </button>
  );
}

function EmbeddedAskAI({ t }: { t: ReturnType<typeof useCoachT> }) {
  const ctx = useAssistantContext();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<{ text: string; card?: AssistantCard } | null>(null);
  const speech = useSpeechRecognition((finalText) => {
    setInput('');
    send(finalText);
  });

  function send(text: string) {
    if (!text.trim()) return;
    setResponse(answerAssistant(text, ctx));
    setInput('');
  }

  return (
    <div className="rounded-xl2 bg-surface p-4 shadow-card">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-fg">
        <Sparkles size={14} className="text-primary-500" />
        💬 {t('askAi')}
      </p>

      {response && (
        <div className="mb-3 space-y-2">
          <p className="rounded-xl bg-surface-alt p-3 text-sm text-fg">{response.text}</p>
          {response.card && renderCard(response.card, () => {})}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        {speech.supported && (
          <button
            type="button"
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
            aria-label="Voice input"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
              speech.listening ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-alt2 text-fg hover:bg-surface-alt3'
            }`}
          >
            <Mic size={17} />
          </button>
        )}
        <input
          id="coach-ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('typeSomething')}
          className="input flex-1 py-2.5"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 active:scale-90"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function ModeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${active ? 'bg-surface text-fg shadow-card' : 'text-muted'}`}
    >
      {label}
    </button>
  );
}
