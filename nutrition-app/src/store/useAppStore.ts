import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';
import type { DiaryEntry, FavoriteItem, FoodRef, RecentItem, UserProfile, WeightLogEntry } from '@/types';

interface AppState {
  profile: UserProfile | null;
  onboardingComplete: boolean;
  diaryEntries: DiaryEntry[];
  favorites: FavoriteItem[];
  recentItems: RecentItem[];
  weightLog: WeightLogEntry[];
  trackWeight: boolean;
  units: 'metric' | 'imperial';
  waterLog: Record<string, number>; // date -> ml

  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;

  addDiaryEntry: (entry: Omit<DiaryEntry, 'id' | 'loggedAt'>) => void;
  updateDiaryEntry: (id: string, partial: Partial<DiaryEntry>) => void;
  removeDiaryEntry: (id: string) => void;

  toggleFavorite: (ref: FoodRef) => void;
  isFavorite: (ref: FoodRef) => boolean;

  touchRecent: (ref: FoodRef) => void;

  addWeightLog: (weightKg: number, date?: string) => void;
  setTrackWeight: (track: boolean) => void;
  setUnits: (units: 'metric' | 'imperial') => void;

  addWater: (ml: number, date: string) => void;
  resetAllData: () => void;
}

const MAX_RECENT_ITEMS = 20;

function sameRef(a: FoodRef, b: FoodRef) {
  return a.refId === b.refId && a.refType === b.refType;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      onboardingComplete: false,
      diaryEntries: [],
      favorites: [],
      recentItems: [],
      weightLog: [],
      trackWeight: false,
      units: 'metric',
      waterLog: {},

      setProfile: (profile) => set({ profile }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...partial, updatedAt: new Date().toISOString() }
            : state.profile,
        })),

      completeOnboarding: () => set({ onboardingComplete: true }),

      resetProfile: () => set({ profile: null, onboardingComplete: false }),

      addDiaryEntry: (entry) =>
        set((state) => ({
          diaryEntries: [
            ...state.diaryEntries,
            { ...entry, id: generateId('entry'), loggedAt: new Date().toISOString() },
          ],
        })),

      updateDiaryEntry: (id, partial) =>
        set((state) => ({
          diaryEntries: state.diaryEntries.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),

      removeDiaryEntry: (id) =>
        set((state) => ({ diaryEntries: state.diaryEntries.filter((e) => e.id !== id) })),

      toggleFavorite: (ref) =>
        set((state) => {
          const exists = state.favorites.some((f) => sameRef(f, ref));
          return {
            favorites: exists
              ? state.favorites.filter((f) => !sameRef(f, ref))
              : [...state.favorites, { ...ref, addedAt: new Date().toISOString() }],
          };
        }),

      isFavorite: (ref) => get().favorites.some((f) => sameRef(f, ref)),

      touchRecent: (ref) =>
        set((state) => {
          const existing = state.recentItems.find((r) => sameRef(r, ref));
          const now = new Date().toISOString();
          let next: RecentItem[];
          if (existing) {
            next = [
              { ...existing, lastUsedAt: now, useCount: existing.useCount + 1 },
              ...state.recentItems.filter((r) => !sameRef(r, ref)),
            ];
          } else {
            next = [{ ...ref, lastUsedAt: now, useCount: 1 }, ...state.recentItems];
          }
          return { recentItems: next.slice(0, MAX_RECENT_ITEMS) };
        }),

      addWeightLog: (weightKg, date = todayISO()) =>
        set((state) => {
          const withoutDate = state.weightLog.filter((w) => w.date !== date);
          return { weightLog: [...withoutDate, { date, weightKg }].sort((a, b) => a.date.localeCompare(b.date)) };
        }),

      setTrackWeight: (track) => set({ trackWeight: track }),
      setUnits: (units) => set({ units }),

      addWater: (ml, date) =>
        set((state) => ({
          waterLog: { ...state.waterLog, [date]: Math.max(0, (state.waterLog[date] ?? 0) + ml) },
        })),

      resetAllData: () =>
        set({
          profile: null,
          onboardingComplete: false,
          diaryEntries: [],
          favorites: [],
          recentItems: [],
          weightLog: [],
          trackWeight: false,
          waterLog: {},
        }),
    }),
    {
      name: 'nutrition-ai-store',
      version: 1,
    },
  ),
);
