"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppSettings, AppState, DayLogEntry, UserProfile } from "./types";
import { dateKey, getGregorianLabel } from "./hebrewCalendar";
import { getUnlockedAchievementIds } from "./achievements";
import { computeStreaks } from "./streaks";

const defaultSettings: AppSettings = {
  language: "he",
  theme: "system",
  diasporaMode: "diaspora",
  calendarDisplay: "both",
  city: "",
  reminders: {
    enabled: true,
    first: { enabled: true, time: "07:00" },
    second: { enabled: false, time: "10:00" },
    final: { enabled: false, time: "13:00" },
    sound: true,
    haptic: true,
    smartSuggestionDismissed: false,
  },
  accessibility: {
    fontSize: "md",
    highContrast: false,
    reduceMotion: false,
  },
  onboardingComplete: false,
};

const defaultProfile: UserProfile = {
  name: "",
  avatarEmoji: "🕍",
};

interface AppActions {
  setProfile: (profile: Partial<UserProfile>) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  setReminders: (reminders: Partial<AppState["settings"]["reminders"]>) => void;
  setAccessibility: (a: Partial<AppState["settings"]["accessibility"]>) => void;
  completeOnboarding: () => void;
  markDay: (date: Date, done: boolean) => void;
  editDay: (date: Date, done: boolean) => void;
  clearEditFeedback: () => void;
  markFirstCompletionSeen: () => void;
  checkAchievementUnlocks: () => string[];
  toggleCardLearned: (cardId: string) => void;
  resetAllData: () => void;
}

export type Store = AppState & AppActions;

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      settings: defaultSettings,
      logs: {},
      unlockedAchievements: {},
      lastEditFeedback: null,
      hasSeenFirstCompletion: false,
      learnedCardIds: {},

      setProfile: (profile) =>
        set((s) => ({ profile: { ...s.profile, ...profile } })),

      setSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),

      setReminders: (reminders) =>
        set((s) => ({
          settings: {
            ...s.settings,
            reminders: { ...s.settings.reminders, ...reminders },
          },
        })),

      setAccessibility: (a) =>
        set((s) => ({
          settings: {
            ...s.settings,
            accessibility: { ...s.settings.accessibility, ...a },
          },
        })),

      completeOnboarding: () =>
        set((s) => ({ settings: { ...s.settings, onboardingComplete: true } })),

      markDay: (date, done) => {
        const key = dateKey(date);
        const entry: DayLogEntry = {
          done,
          markedAt: new Date().toISOString(),
        };
        set((s) => ({ logs: { ...s.logs, [key]: entry } }));
      },

      editDay: (date, done) => {
        const key = dateKey(date);
        set((s) => {
          const prev = s.logs[key];
          const entry: DayLogEntry = {
            done,
            markedAt: prev?.markedAt ?? new Date().toISOString(),
            editedAt: new Date().toISOString(),
          };
          return {
            logs: { ...s.logs, [key]: entry },
            lastEditFeedback: {
              dateKey: key,
              label: getGregorianLabel(date, s.settings.language),
            },
          };
        });
      },

      clearEditFeedback: () => set({ lastEditFeedback: null }),

      markFirstCompletionSeen: () => set({ hasSeenFirstCompletion: true }),

      checkAchievementUnlocks: () => {
        const s = get();
        const { current, best, totalDays } = computeStreaks(
          s.logs,
          s.settings.diasporaMode
        );
        const unlockedNow = getUnlockedAchievementIds(current, best, totalDays);
        const newlyUnlocked: string[] = [];
        const additions: Record<string, { id: string; unlockedAt: string }> = {};

        for (const id of unlockedNow) {
          if (!s.unlockedAchievements[id]) {
            newlyUnlocked.push(id);
            additions[id] = { id, unlockedAt: new Date().toISOString() };
          }
        }

        if (newlyUnlocked.length > 0) {
          set((state) => ({
            unlockedAchievements: { ...state.unlockedAchievements, ...additions },
          }));
        }

        return newlyUnlocked;
      },

      toggleCardLearned: (cardId) =>
        set((s) => {
          const next = { ...s.learnedCardIds };
          if (next[cardId]) delete next[cardId];
          else next[cardId] = true;
          return { learnedCardIds: next };
        }),

      resetAllData: () =>
        set({
          profile: defaultProfile,
          settings: defaultSettings,
          logs: {},
          unlockedAchievements: {},
          lastEditFeedback: null,
          hasSeenFirstCompletion: false,
          learnedCardIds: {},
        }),
    }),
    {
      name: "tefillin-app-storage",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never)
      ),
      skipHydration: true,
    }
  )
);
