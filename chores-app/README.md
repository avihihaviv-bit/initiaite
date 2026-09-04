# Homebase — Household Chores, Solved

A premium, gamified household chores app: assign chores, keep the workload fair,
track streaks and XP, and let an AI co-pilot plan the day.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (client state, persisted to `localStorage`)
- React Router
- Framer Motion, Lucide icons, canvas-confetti

Fully client-side by design — no backend required. All data (family, chores,
rewards, streaks, badges) lives in `localStorage` under the `homebase:v1` key,
seeded with a realistic demo household on first load.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run lint      # oxlint
```

## Project layout

```
src/
  types/        domain types (Chore, User, Family, Reward, Badge, ...)
  lib/          pure logic: recurrence engine, smart priority engine,
                fairness/balance algorithm, gamification math, rule-based
                AI assistant, occurrence resolution
  store/        Zustand store — all state + actions
  components/   ui/ (design system), plus feature folders per domain
  pages/        one component per route
```

### Core algorithms

- **Smart priority engine** (`lib/priority.ts`) — scores each chore by
  deadline pressure, overdue status, priority, duration, and dependencies to
  decide what to surface as "next up."
- **Occurrence resolution** (`lib/occurrence.ts`) — recurring chores are
  evaluated against their recurrence rule for "is this due today / is this
  overdue," rather than a single stored due date.
- **Fairness & smart balance** (`lib/balance.ts`) — computes a 0–100
  household fairness score from this week's completed/scheduled workload and
  suggests a single chore reassignment to even things out.
- **AI assistant** (`lib/ai.ts`) — rule-based (no external API key needed):
  breaks a task into a time-boxed plan, generates today's smart plan, and
  answers questions about balance/overdue/next-best-task.
