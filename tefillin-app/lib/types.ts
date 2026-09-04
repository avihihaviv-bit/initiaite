export type Language = "he" | "en";
export type ThemeMode = "light" | "dark" | "system";
export type DiasporaMode = "diaspora" | "israel";
export type FontSize = "sm" | "md" | "lg";

export interface DayLogEntry {
  /** true = tefillin were put on this day */
  done: boolean;
  /** ISO timestamp of when the entry was created/last edited */
  markedAt: string;
  /** ISO timestamp of the very first time this entry was created (for edit-history feedback) */
  editedAt?: string;
}

export interface ReminderSlot {
  enabled: boolean;
  time: string; // "HH:MM"
}

export interface RemindersSettings {
  enabled: boolean;
  first: ReminderSlot;
  second: ReminderSlot;
  final: ReminderSlot;
  sound: boolean;
  haptic: boolean;
  smartSuggestionDismissed: boolean;
}

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface UserProfile {
  name: string;
  avatarEmoji: string;
}

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
  diasporaMode: DiasporaMode;
  calendarDisplay: "hebrew" | "gregorian" | "both";
  city: string;
  reminders: RemindersSettings;
  accessibility: AccessibilitySettings;
  onboardingComplete: boolean;
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

export interface AppState {
  profile: UserProfile;
  settings: AppSettings;
  logs: Record<string, DayLogEntry>;
  unlockedAchievements: Record<string, AchievementUnlock>;
  lastEditFeedback: { dateKey: string; label: string } | null;
  hasSeenFirstCompletion: boolean;
  learnedCardIds: Record<string, true>;
}
