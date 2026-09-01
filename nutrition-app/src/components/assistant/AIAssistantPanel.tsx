import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, Send, Sparkles, TrendingDown, TrendingUp, X } from 'lucide-react';
import { answerAssistant, QUICK_ACTIONS } from '@/services/AssistantService';
import { useAssistantContext } from '@/hooks/useAssistantContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { FoodConfirmCard } from './FoodConfirmCard';
import { MealRecList } from './MealRecList';
import { RestaurantMatchList } from './RestaurantMatchList';
import type { AssistantCard } from '@/services/AssistantService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  card?: AssistantCard;
}

export function AIAssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ctx = useAssistantContext();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: "Hey! What can I help you with?" },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const speech = useSpeechRecognition((finalText) => {
    setInput('');
    send(finalText);
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', text };
    const answer = answerAssistant(text, ctx);
    const assistantMsg: ChatMessage = { id: `a${Date.now()}`, role: 'assistant', text: answer.text, card: answer.card };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  }

  const panelMotion = isDesktop
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-0"
            onClick={onClose}
          />
          <motion.div
            {...panelMotion}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            role="dialog"
            aria-label="AI Assistant"
            className="fixed inset-x-0 bottom-0 z-50 flex h-[88vh] flex-col rounded-t-3xl bg-white shadow-floating lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto lg:h-full lg:w-[400px] lg:rounded-l-3xl lg:rounded-t-none"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-ink">
                <Sparkles size={18} className="text-primary-500" />
                AI Assistant
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-card ${
                      m.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-50 text-ink'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.card && (
                      <div className="mt-2.5">
                        {renderCard(m.card, (view) => {
                          onClose();
                          navigate(`/coach?view=${view}`);
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {speech.listening && (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl bg-primary-100 px-3.5 py-2.5 text-sm italic text-primary-700">
                    {speech.interimText || 'Listening…'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa}
                  onClick={() => send(qa)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary-300 hover:text-primary-700"
                >
                  {qa}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-gray-100 p-3"
            >
              {speech.supported && (
                <button
                  type="button"
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  aria-label={speech.listening ? 'Stop listening' : 'Voice input'}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                    speech.listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-ink hover:bg-gray-200'
                  }`}
                >
                  <Mic size={17} />
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything, or tell me what you ate…"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function renderCard(card: AssistantCard, openCoach: (view: 'eat' | 'analyze' | 'recipe' | 'plan') => void) {
  switch (card.type) {
    case 'open_coach':
      return (
        <button
          onClick={() => openCoach(card.view)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-white p-3 text-left text-sm font-semibold text-primary-700 shadow-card transition hover:bg-primary-50"
        >
          {card.label}
          <ArrowRight size={15} />
        </button>
      );
    case 'food_confirm':
      return <FoodConfirmCard mentions={card.mentions} onConfirmed={() => {}} />;
    case 'meal_recommendations':
      return <MealRecList recs={card.recs} />;
    case 'restaurant_matches':
      return <RestaurantMatchList matches={card.matches} />;
    case 'daily_summary':
      if (card.summary.lines.length === 0) return null;
      return (
        <div className="space-y-1 rounded-xl bg-white p-2.5 shadow-card">
          {card.summary.lines.map((line, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[11px] text-muted">
              {i === 0 &&
                (card.summary.positive ? (
                  <TrendingUp size={12} className="mt-0.5 shrink-0 text-primary-500" />
                ) : (
                  <TrendingDown size={12} className="mt-0.5 shrink-0 text-amber-500" />
                ))}
              {line}
            </p>
          ))}
        </div>
      );
    case 'stats_insights':
      return (
        <ul className="space-y-1 rounded-xl bg-white p-2.5 shadow-card">
          {card.insights.map((ins, i) => (
            <li key={i} className="text-[11px] text-muted">
              • {ins.text}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}
