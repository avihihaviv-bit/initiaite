import { useEffect, useRef, useState } from 'react'
import { Bot, CalendarClock, Send, Sparkles, User as UserIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { generateDailyPlan, totalPlanMinutes, totalPlanXP } from '../lib/ai'
import { EmptyState } from '../components/ui/EmptyState'

const SUGGESTIONS = [
  "What should I do next?",
  "I have 30 minutes and my room is messy",
  "Any overdue chores?",
  "Is our chore balance fair?",
  "Show today's plan",
]

export default function AIAssistant() {
  const chores = useStore((s) => s.chores)
  const users = useStore((s) => s.users)
  const currentUserId = useStore((s) => s.settings.currentUserId)
  const chatHistory = useStore((s) => s.chatHistory)
  const sendChatMessage = useStore((s) => s.sendChatMessage)
  const currentUser = users.find((u) => u.id === currentUserId)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const plan = currentUserId ? generateDailyPlan(chores, currentUserId) : []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatHistory])

  const submit = (text?: string) => {
    const value = (text ?? input).trim()
    if (!value) return
    sendChatMessage(value)
    setInput('')
  }

  return (
    <div className="flex h-[calc(100svh-140px)] flex-col gap-5 animate-[var(--animate-in)] lg:h-[calc(100svh-120px)]">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">🤖 AI Assistant</h1>
        <p className="mt-0.5 text-sm text-ink-soft">Your household's smart co-pilot.</p>
      </div>

      {plan.length > 0 && (
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-surface dark:border-primary-800 dark:from-primary-900/20">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
              <CalendarClock size={15} className="text-primary-500" /> Today's smart plan
            </p>
            <span className="text-xs font-semibold text-ink-faint">{totalPlanMinutes(plan)} min · +{totalPlanXP(plan)} XP</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {plan.map((p) => (
              <div key={p.choreId} className="flex shrink-0 flex-col items-center gap-1 rounded-xl bg-surface px-3 py-2 text-center shadow-[var(--shadow-soft)]">
                <span className="text-lg">{p.emoji}</span>
                <span className="max-w-[90px] truncate text-[11px] font-bold text-ink">{p.title}</span>
                <span className="text-[10px] font-semibold text-ink-faint">{p.minutes} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="none" className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5">
          {chatHistory.length === 0 ? (
            <EmptyState
              emoji="✨"
              title="Ask me anything about your household"
              description="I can plan your day, break down a messy room, check overdue chores, and keep things fair."
            />
          ) : (
            <div className="space-y-4">
              {chatHistory.map((m) => (
                <div key={m.id} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white"><Bot size={16} /></span>
                  ) : currentUser ? (
                    <Avatar emoji={currentUser.avatarEmoji} color={currentUser.color} size={32} />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2"><UserIcon size={15} /></span>
                  )}
                  <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'rounded-tr-sm bg-primary-500 text-white' : 'rounded-tl-sm bg-surface-2 text-ink'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3 sm:p-4">
          <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="focus-ring flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-primary-50 hover:text-primary-600"
              >
                <Sparkles size={11} /> {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ask about chores, plans, or balance…"
              className="focus-ring h-11 flex-1 rounded-2xl border border-border bg-surface px-4 text-sm font-medium text-ink placeholder:text-ink-faint"
            />
            <Button size="icon" onClick={() => submit()} aria-label="Send" disabled={!input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
