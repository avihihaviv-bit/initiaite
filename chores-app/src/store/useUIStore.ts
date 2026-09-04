import { create } from 'zustand'

// Ephemeral, unpersisted UI coordination state — separate from the domain
// store so it never touches localStorage. Used so the globally-fixed
// QuickAddFab can hide itself while a dense calendar grid (Month/Week view)
// is on screen, since the FAB would otherwise float on top of day cells
// and block clicks into them.
interface UIStore {
  denseGridCount: number
  pushDenseGrid: () => void
  popDenseGrid: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  denseGridCount: 0,
  pushDenseGrid: () => set((s) => ({ denseGridCount: s.denseGridCount + 1 })),
  popDenseGrid: () => set((s) => ({ denseGridCount: Math.max(0, s.denseGridCount - 1) })),
}))
