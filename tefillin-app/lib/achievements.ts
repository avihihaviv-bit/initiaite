export interface AchievementDef {
  id: string;
  icon: string;
  titleHe: string;
  titleEn: string;
  descHe: string;
  descEn: string;
  kind: "streak" | "total" | "weeks";
  threshold: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "streak-3",
    icon: "🥉",
    titleHe: "התחלה טובה",
    titleEn: "A Good Start",
    descHe: "3 ימים ברצף",
    descEn: "3 days in a row",
    kind: "streak",
    threshold: 3,
  },
  {
    id: "streak-7",
    icon: "🥈",
    titleHe: "שבוע של מצווה",
    titleEn: "A Week of Mitzvah",
    descHe: "7 ימים ברצף",
    descEn: "7 days in a row",
    kind: "streak",
    threshold: 7,
  },
  {
    id: "streak-30",
    icon: "🥇",
    titleHe: "חודש של התמדה",
    titleEn: "A Month of Devotion",
    descHe: "30 ימים ברצף",
    descEn: "30 days in a row",
    kind: "streak",
    threshold: 30,
  },
  {
    id: "streak-100",
    icon: "🔥",
    titleHe: "100 ימים",
    titleEn: "100 Days",
    descHe: "100 ימים ברצף",
    descEn: "100 days in a row",
    kind: "streak",
    threshold: 100,
  },
  {
    id: "streak-365",
    icon: "💎",
    titleHe: "365 ימים",
    titleEn: "365 Days",
    descHe: "שנה שלמה ברצף",
    descEn: "A full year in a row",
    kind: "streak",
    threshold: 365,
  },
  {
    id: "total-100",
    icon: "🏆",
    titleHe: "שיא אישי",
    titleEn: "Personal Best",
    descHe: "100 ימים סך הכול",
    descEn: "100 total days",
    kind: "total",
    threshold: 100,
  },
  {
    id: "weeks-10",
    icon: "🎯",
    titleHe: "10 שבועות",
    titleEn: "10 Weeks",
    descHe: "10 שבועות עם רצף מלא",
    descEn: "10 weeks with a full streak",
    kind: "weeks",
    threshold: 10,
  },
];

export function getUnlockedAchievementIds(
  currentStreak: number,
  bestStreak: number,
  totalDays: number
): string[] {
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (a.kind === "streak" && bestStreak >= a.threshold) unlocked.push(a.id);
    if (a.kind === "total" && totalDays >= a.threshold) unlocked.push(a.id);
    if (a.kind === "weeks" && Math.floor(bestStreak / 7) >= a.threshold)
      unlocked.push(a.id);
  }
  return unlocked;
}
