import { useRef, useState, useEffect } from 'react';
import { Info, Send, Sparkles } from 'lucide-react';
import { answerCoachQuestion } from '@/services/CoachService';
import { useTargets } from '@/hooks/useTargets';
import { useDiaryForDate } from '@/hooks/useDiary';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/utils/date';
import { findFoodById } from '@/data/foods';
import type { RecommendedMeal } from '@/services/RecommendationService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendations?: RecommendedMeal[];
}

const SUGGESTIONS = ['What should I eat?', 'How am I doing today?', 'How much protein do I have left?', 'I want to eat out.'];

export function CoachPage() {
  const date = todayISO();
  const { targets } = useTargets();
  const diary = useDiaryForDate(date);
  const addDiaryEntry = useAppStore((s) => s.addDiaryEntry);
  const touchRecent = useAppStore((s) => s.touchRecent);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your nutrition coach — I use today's logged data to help answer questions like \"What should I eat?\" or \"How am I doing?\"",
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', text };
    const answer = answerCoachQuestion(text, { totals: diary.totals, targets });
    const assistantMsg: ChatMessage = { id: `a${Date.now()}`, role: 'assistant', text: answer.text, recommendations: answer.recommendations };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  }

  function addRecommendation(rec: RecommendedMeal) {
    for (const item of rec.items) {
      const food = findFoodById(item.foodId);
      if (!food) continue;
      const factor = item.grams / 100;
      addDiaryEntry({
        date,
        mealType: 'snacks',
        foodId: food.id,
        foodName: food.name,
        foodImageEmoji: food.imageEmoji,
        quantityGrams: item.grams,
        servingLabel: `${item.grams}g`,
        nutrition: {
          calories: Math.round(food.per100g.calories * factor),
          proteinG: Math.round(food.per100g.proteinG * factor * 10) / 10,
          carbsG: Math.round(food.per100g.carbsG * factor * 10) / 10,
          fatG: Math.round(food.per100g.fatG * factor * 10) / 10,
        },
        dataQuality: food.dataQuality,
        source: 'search',
      });
      touchRecent({ refId: food.id, refType: 'food' });
    }
    setMessages((m) => [...m, { id: `sys${Date.now()}`, role: 'assistant', text: `Added "${rec.name}" to your diary.` }]);
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col lg:h-[calc(100vh-3rem)]">
      <header className="mb-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Sparkles size={22} className="text-primary-500" />
          AI Coach
        </h1>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
          <Info size={13} className="mt-0.5 shrink-0" />
          On-device assistant using simple rules over your logged data — not a live AI model, and not medical advice.
        </p>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-3 pr-1">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-card ${
                m.role === 'user' ? 'bg-primary-500 text-white' : 'bg-white text-ink'
              }`}
            >
              <p>{m.text}</p>
              {m.recommendations && (
                <div className="mt-3 space-y-2">
                  {m.recommendations.map((rec) => (
                    <div key={rec.id} className="rounded-xl bg-gray-50 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          {rec.emoji} {rec.name}
                        </span>
                        <span className="text-[10px] font-bold text-primary-600">{rec.matchScore}% match</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {Math.round(rec.totals.calories)} kcal · {Math.round(rec.totals.proteinG)}g protein
                      </p>
                      <button
                        onClick={() => addRecommendation(rec)}
                        className="mt-1.5 w-full rounded-lg bg-primary-500 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-600"
                      >
                        Add to diary
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 py-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary-300 hover:text-primary-700"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-gray-100 pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your nutrition today…"
          className="input flex-1"
        />
        <button
          type="submit"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition hover:bg-primary-600 active:scale-90"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
