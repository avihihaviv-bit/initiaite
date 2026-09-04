"use client";

import { useState } from "react";
import { DateHeader } from "@/components/home/DateHeader";
import { TodayCard } from "@/components/home/TodayCard";
import { MonthProgress } from "@/components/home/MonthProgress";
import { AchievementsRow } from "@/components/home/AchievementsRow";
import { DailyLearningCard } from "@/components/home/DailyLearningCard";
import { FirstCompletionModal } from "@/components/home/FirstCompletionModal";
import { AchievementUnlockModal } from "@/components/home/AchievementUnlockModal";

export default function HomePage() {
  const [today] = useState(() => new Date());
  const [showFirstCompletion, setShowFirstCompletion] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  return (
    <div className="max-w-lg mx-auto pb-8">
      <DateHeader date={today} />
      <TodayCard
        date={today}
        onFirstCompletion={() => setShowFirstCompletion(true)}
        onAchievementsUnlocked={setUnlockedIds}
      />
      <MonthProgress date={today} />
      <AchievementsRow />
      <DailyLearningCard date={today} />

      <FirstCompletionModal
        open={showFirstCompletion}
        onClose={() => setShowFirstCompletion(false)}
      />
      <AchievementUnlockModal ids={unlockedIds} onClose={() => setUnlockedIds([])} />
    </div>
  );
}
