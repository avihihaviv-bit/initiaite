// Bumped when the shape of what's "normal" to have saved changes enough that
// old data shouldn't just be loaded as-is — e.g. onboarding used to be
// skippable with an invented demo household baked in, which is no longer a
// valid state to silently carry forward. Bumping this abandons anything
// saved under the old key, so everyone gets a clean run through onboarding.
const KEY = 'homebase:v2'

export function loadState<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveState(state: unknown): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable — fail silently, app still works in-memory
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
