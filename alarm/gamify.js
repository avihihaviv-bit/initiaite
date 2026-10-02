/*
 * Pure, DOM-free gamification logic: XP/level math, rank tiers, streak
 * bonuses, achievement definitions, and daily/weekly quest templates.
 * No storage access, no DOM — safe to unit test with `node --test`, and
 * the single source of truth for every number quoted in the UI.
 *
 * Design choice that matters: level/progress is always DERIVED from
 * totalXp via computeLevelState(), never incremented as a separate
 * counter. That makes "gain enough XP to jump several levels at once"
 * correct by construction (same formula, no incremental drift) and makes
 * "total XP never resets on level-up" trivially true (totalXp is the only
 * thing ever stored).
 */
(function (root, factory) {
    const mod = factory();
    if (typeof module === 'object' && module.exports) module.exports = mod;
    else root.AlarmGamify = mod;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // --- Level formula -------------------------------------------------
    // XP required to go from `level` to `level + 1`. Chosen so early levels
    // are quick (250 XP for level 1->2, about two good mornings) and later
    // levels demand real consistency (level 50->51 needs ~73,000 XP).
    const LEVEL_BASE = 250;
    const LEVEL_EXPONENT = 1.6;
    function xpForLevel(level) { return Math.round(LEVEL_BASE * Math.pow(level, LEVEL_EXPONENT)); }

    function computeLevelState(totalXp) {
        totalXp = Math.max(0, Math.floor(totalXp || 0));
        let level = 1;
        let remaining = totalXp;
        while (remaining >= xpForLevel(level)) { remaining -= xpForLevel(level); level++; }
        const xpForNext = xpForLevel(level);
        return {
            level, totalXp,
            xpIntoLevel: remaining,
            xpForNext,
            xpRemaining: xpForNext - remaining,
            progressPct: Math.max(0, Math.min(100, Math.round((remaining / xpForNext) * 100)))
        };
    }

    // --- Ranks -----------------------------------------------------------
    const RANKS = [
        { id: 'beginner', minLevel: 1, maxLevel: 4, nameKey: 'rankBeginner', icon: '🌱', color: '#8a8ea8' },
        { id: 'rising_star', minLevel: 5, maxLevel: 9, nameKey: 'rankRisingStar', icon: '⭐', color: '#4ea1ff' },
        { id: 'early_riser', minLevel: 10, maxLevel: 19, nameKey: 'rankEarlyRiser', icon: '🌅', color: '#ffb84e' },
        { id: 'disciplined', minLevel: 20, maxLevel: 34, nameKey: 'rankDisciplined', icon: '🎯', color: '#34c77b' },
        { id: 'elite', minLevel: 35, maxLevel: 49, nameKey: 'rankElite', icon: '💎', color: '#4ed6d6' },
        { id: 'master', minLevel: 50, maxLevel: 74, nameKey: 'rankMaster', icon: '🏅', color: '#b06eff' },
        { id: 'legend', minLevel: 75, maxLevel: 99, nameKey: 'rankLegend', icon: '👑', color: '#ff9f4e' },
        { id: 'mythic', minLevel: 100, maxLevel: Infinity, nameKey: 'rankMythic', icon: '🔥', color: '#ff4e85' }
    ];
    function rankForLevel(level) {
        return RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[RANKS.length - 1];
    }
    function rankIndexForLevel(level) { return RANKS.findIndex(r => r === rankForLevel(level)); }

    // --- Streak milestone bonuses ----------------------------------------
    const STREAK_MILESTONES = [
        { days: 3, xp: 50 }, { days: 7, xp: 150 }, { days: 14, xp: 300 },
        { days: 30, xp: 750 }, { days: 60, xp: 1500 }, { days: 100, xp: 3000 }
    ];

    /**
     * Which streak-day-count makes a milestone newly reachable, given the
     * CURRENT streak length. Returns the milestone just reached, or null.
     * The caller is expected to dedupe by milestone + the streak's start
     * date (see streakStartDateIso) so a broken-then-rebuilt streak can
     * earn the same milestone again on its own new run, but a single
     * ongoing streak never earns one twice.
     */
    function streakMilestoneReached(currentStreakDays) {
        return STREAK_MILESTONES.find(m => m.days === currentStreakDays) || null;
    }

    /** First calendar date (YYYY-MM-DD) of the current streak, given its
     * length and today's date — both pure strings, no Date-object timezone
     * surprises. Used purely as a dedupe-key ingredient. */
    function streakStartDateIso(todayIso, currentStreakDays) {
        if (!currentStreakDays || currentStreakDays < 1) return todayIso;
        const d = new Date(todayIso + 'T00:00:00');
        d.setDate(d.getDate() - (currentStreakDays - 1));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // --- Achievements ------------------------------------------------------
    const RARITY_XP = { common: 20, rare: 50, epic: 100, legendary: 250 };

    const ACHIEVEMENTS = [
        { id: 'first_challenge', titleKey: 'ach_first_challenge', descKey: 'ach_first_challenge_desc', icon: '🏆', rarity: 'common', check: s => s.challengesCompleted >= 1 },
        { id: 'early_bird', titleKey: 'ach_early_bird', descKey: 'ach_early_bird_desc', icon: '🌅', rarity: 'rare', check: s => s.beforeSevenDays >= 7 },
        { id: 'consistent', titleKey: 'ach_consistent', descKey: 'ach_consistent_desc', icon: '🔥', rarity: 'rare', check: s => s.completedDays >= 14 },
        { id: 'no_snooze_5', titleKey: 'ach_no_snooze_5', descKey: 'ach_no_snooze_5_desc', icon: '💪', rarity: 'common', check: s => s.noSnoozeCount >= 5 },
        { id: 'sleep_master', titleKey: 'ach_sleep_master', descKey: 'ach_sleep_master_desc', icon: '🌙', rarity: 'rare', check: s => s.bedtimeRoutineCompletions >= 10 },
        { id: 'streak_7', titleKey: 'ach_streak_7', descKey: 'ach_streak_7_desc', icon: '🔥', rarity: 'rare', check: s => s.bestStreak >= 7 },
        { id: 'streak_30', titleKey: 'ach_streak_30', descKey: 'ach_streak_30_desc', icon: '🔥', rarity: 'epic', check: s => s.bestStreak >= 30 },
        { id: 'math_master', titleKey: 'ach_math_master', descKey: 'ach_math_master_desc', icon: '🧠', rarity: 'epic', check: s => s.mathCorrect >= 50 },
        { id: 'wake_up_boss', titleKey: 'ach_wake_up_boss', descKey: 'ach_wake_up_boss_desc', icon: '👑', rarity: 'epic', check: s => s.comboChallengesCompleted >= 10 },

        { id: 'first_alarm', titleKey: 'ach_first_alarm', descKey: 'ach_first_alarm_desc', icon: '⏰', rarity: 'common', check: s => s.totalSuccessfulMornings >= 1 },
        { id: 'mornings_5', titleKey: 'ach_mornings_5', descKey: 'ach_mornings_5_desc', icon: '☀️', rarity: 'common', check: s => s.totalSuccessfulMornings >= 5 },
        { id: 'mornings_100', titleKey: 'ach_mornings_100', descKey: 'ach_mornings_100_desc', icon: '☀️', rarity: 'epic', check: s => s.totalSuccessfulMornings >= 100 },
        { id: 'first_physical', titleKey: 'ach_first_physical', descKey: 'ach_first_physical_desc', icon: '🏃', rarity: 'common', check: s => s.physicalChallengesCompleted >= 1 },
        { id: 'reps_100', titleKey: 'ach_reps_100', descKey: 'ach_reps_100_desc', icon: '💪', rarity: 'rare', check: s => s.totalRepsCompleted >= 100 },
        { id: 'math_10', titleKey: 'ach_math_10', descKey: 'ach_math_10_desc', icon: '🧮', rarity: 'common', check: s => s.mathCorrect >= 10 },
        { id: 'math_level5', titleKey: 'ach_math_level5', descKey: 'ach_math_level5_desc', icon: '🎓', rarity: 'rare', check: s => !!s.mathLevel5SolvedEver },
        { id: 'triple_combo', titleKey: 'ach_triple_combo', descKey: 'ach_triple_combo_desc', icon: '⚡', rarity: 'rare', check: s => s.tripleComboCount >= 1 },
        { id: 'levels_10', titleKey: 'ach_levels_10', descKey: 'ach_levels_10_desc', icon: '🪜', rarity: 'epic', check: s => s.level >= 10 },
        { id: 'new_streak_record', titleKey: 'ach_new_streak_record', descKey: 'ach_new_streak_record_desc', icon: '🏁', rarity: 'rare', check: s => s.streak.current === s.streak.best && s.streak.best > 0 }
    ];

    function achievementXp(id) {
        const def = ACHIEVEMENTS.find(a => a.id === id);
        return def ? RARITY_XP[def.rarity] || 0 : 0;
    }

    function checkAchievements(stats) {
        return ACHIEVEMENTS.filter(a => a.check(stats)).map(a => a.id);
    }

    // --- Daily / weekly quests ---------------------------------------------
    // Templates are evaluated against a plain context object the caller
    // builds from real data (today's/this-week's dismissals) — gamify.js
    // never reaches into storage itself, so these stay fully pure/testable.

    const DAILY_QUEST_DEFS = [
        { id: 'wake_on_time', titleKey: 'quest_wake_on_time', xp: 20, target: 1, progress: ctx => ctx.alarmsCompletedToday || 0 },
        { id: 'complete_challenge', titleKey: 'quest_complete_challenge', xp: 25, target: 1, progress: ctx => ctx.challengesCompletedToday || 0 },
        { id: 'physical_exercise', titleKey: 'quest_physical_exercise', xp: 25, target: 1, progress: ctx => ctx.physicalCompletedToday || 0 },
        { id: 'solve_5_math', titleKey: 'quest_solve_5_math', xp: 30, target: 5, progress: ctx => ctx.mathSolvedToday || 0 },
        { id: 'two_alarms', titleKey: 'quest_two_alarms', xp: 35, target: 2, progress: ctx => ctx.distinctAlarmsCompletedToday || 0 }
    ];

    const WEEKLY_QUEST_DEFS = [
        { id: 'three_good_days', titleKey: 'quest_three_good_days', xp: 60, target: 3, progress: ctx => ctx.successfulDaysThisWeek || 0 }
    ];

    // Completing ALL of today's weekly goal days grants a flat bonus
    // separate from the quests above — see WEEKLY_GOAL below.
    const WEEKLY_GOAL = { id: 'weekly_goal', targetDays: 5, xp: 200 };

    // Tiny self-contained deterministic hash + PRNG so the SAME 3 quests
    // show all day for a given date, without depending on logic.js.
    function hashString(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
        return h >>> 0;
    }
    function seededRng(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /** Picks `count` daily quests deterministically for a given date, so
     * the set doesn't change through the day or across devices reading the
     * same local date. */
    function pickDailyQuests(dateIso, count) {
        count = Math.min(count || 3, DAILY_QUEST_DEFS.length);
        const rng = seededRng(hashString(dateIso));
        const pool = DAILY_QUEST_DEFS.slice();
        const picked = [];
        while (picked.length < count && pool.length) {
            const idx = Math.floor(rng() * pool.length);
            picked.push(pool.splice(idx, 1)[0]);
        }
        return picked;
    }

    function evaluateQuest(def, ctx) {
        const progress = Math.max(0, def.progress(ctx));
        return { id: def.id, titleKey: def.titleKey, xp: def.xp, target: def.target, progress: Math.min(progress, def.target), done: progress >= def.target };
    }

    function evaluateDailyQuests(dateIso, ctx) {
        return pickDailyQuests(dateIso, 3).map(def => evaluateQuest(def, ctx));
    }
    function evaluateWeeklyQuests(ctx) {
        return WEEKLY_QUEST_DEFS.map(def => evaluateQuest(def, ctx));
    }

    // --- Combo bonus (several distinct challenge-task TYPES completed in
    // one single ring dismissal, e.g. squats + math + QR) ------------------
    function comboBonusXp(distinctTaskTypeCount) {
        if (distinctTaskTypeCount >= 3) return 50;
        if (distinctTaskTypeCount === 2) return 25;
        return 0;
    }

    // --- Cosmetic unlocks ---------------------------------------------------
    // Purely decorative (profile icon / title) — never gates or bypasses the
    // alarm/challenge flow. Honestly scoped to what the app actually has a
    // picker for today (no wallpaper rewards here: there is no wallpaper
    // picker yet to unlock into).
    const ICON_UNLOCKS = [
        { level: 1, icon: '🙂' }, { level: 3, icon: '😎' }, { level: 5, icon: '🚀' },
        { level: 10, icon: '🏃' }, { level: 20, icon: '🧠' }, { level: 35, icon: '💎' },
        { level: 50, icon: '🏅' }, { level: 75, icon: '👑' }, { level: 100, icon: '🔥' }
    ];
    const TITLE_UNLOCKS = {
        streak_7: 'titleWeekWarrior', streak_30: 'titleIronWill', math_master: 'titleMathWizard',
        wake_up_boss: 'titleWakeBoss', levels_10: 'titleRising', reps_100: 'titleIronBody',
        new_streak_record: 'titleRecordBreaker'
    };
    function iconUnlocksUpToLevel(level) { return ICON_UNLOCKS.filter(u => u.level <= level).map(u => u.icon); }

    return {
        LEVEL_BASE, LEVEL_EXPONENT, xpForLevel, computeLevelState,
        RANKS, rankForLevel, rankIndexForLevel,
        STREAK_MILESTONES, streakMilestoneReached, streakStartDateIso,
        RARITY_XP, ACHIEVEMENTS, achievementXp, checkAchievements,
        DAILY_QUEST_DEFS, WEEKLY_QUEST_DEFS, WEEKLY_GOAL,
        pickDailyQuests, evaluateDailyQuests, evaluateWeeklyQuests,
        comboBonusXp, hashString, seededRng,
        ICON_UNLOCKS, TITLE_UNLOCKS, iconUnlocksUpToLevel
    };
});
