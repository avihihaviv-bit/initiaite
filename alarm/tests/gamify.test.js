const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../gamify.js');

test('xpForLevel increases with level (progressively harder)', () => {
    assert.ok(G.xpForLevel(2) > G.xpForLevel(1));
    assert.ok(G.xpForLevel(50) > G.xpForLevel(10));
    assert.equal(G.xpForLevel(1), 250);
});

test('computeLevelState: starts at level 1 with 0 XP', () => {
    const s = G.computeLevelState(0);
    assert.equal(s.level, 1);
    assert.equal(s.xpIntoLevel, 0);
    assert.equal(s.totalXp, 0);
});

test('computeLevelState: exact boundary lands precisely on the next level, 0 XP into it', () => {
    const boundary = G.xpForLevel(1);
    const s = G.computeLevelState(boundary);
    assert.equal(s.level, 2);
    assert.equal(s.xpIntoLevel, 0);
});

test('computeLevelState: one XP short of a level stays at the previous level', () => {
    const s = G.computeLevelState(G.xpForLevel(1) - 1);
    assert.equal(s.level, 1);
});

test('computeLevelState: a huge single XP gain jumps multiple levels correctly in one go', () => {
    // Enough XP for levels 1,2,3,4 plus some into level 5 — verify by
    // independently summing the per-level costs, not reusing the function
    // under test for its own check.
    const total = G.xpForLevel(1) + G.xpForLevel(2) + G.xpForLevel(3) + G.xpForLevel(4) + 123;
    const s = G.computeLevelState(total);
    assert.equal(s.level, 5);
    assert.equal(s.xpIntoLevel, 123);
    assert.equal(s.totalXp, total);
});

test('computeLevelState: total XP is never reduced or reset by the level calculation itself', () => {
    const totals = [0, 1, 300, 50000, 999999];
    for (const t of totals) assert.equal(G.computeLevelState(t).totalXp, t);
});

test('rankForLevel: covers every tier boundary from the spec exactly', () => {
    const cases = [[1, 'beginner'], [4, 'beginner'], [5, 'rising_star'], [9, 'rising_star'],
        [10, 'early_riser'], [19, 'early_riser'], [20, 'disciplined'], [34, 'disciplined'],
        [35, 'elite'], [49, 'elite'], [50, 'master'], [74, 'master'],
        [75, 'legend'], [99, 'legend'], [100, 'mythic'], [250, 'mythic']];
    for (const [level, id] of cases) assert.equal(G.rankForLevel(level).id, id, `level ${level}`);
});

test('streakMilestoneReached: only fires exactly on a milestone day count', () => {
    assert.equal(G.streakMilestoneReached(3).xp, 50);
    assert.equal(G.streakMilestoneReached(7).xp, 150);
    assert.equal(G.streakMilestoneReached(4), null);
    assert.equal(G.streakMilestoneReached(100).xp, 3000);
});

test('streakStartDateIso: derives the correct calendar start for a given streak length', () => {
    assert.equal(G.streakStartDateIso('2026-01-10', 1), '2026-01-10');
    assert.equal(G.streakStartDateIso('2026-01-10', 3), '2026-01-08');
    assert.equal(G.streakStartDateIso('2026-01-10', 0), '2026-01-10');
    // Crosses a month boundary correctly.
    assert.equal(G.streakStartDateIso('2026-02-02', 5), '2026-01-29');
});

test('checkAchievements: only unlocks what the stats actually satisfy', () => {
    const base = {
        challengesCompleted: 0, beforeSevenDays: 0, completedDays: 0, noSnoozeCount: 0,
        bedtimeRoutineCompletions: 0, bestStreak: 0, mathCorrect: 0, comboChallengesCompleted: 0,
        totalSuccessfulMornings: 0, physicalChallengesCompleted: 0, totalRepsCompleted: 0,
        mathLevel5SolvedEver: false, tripleComboCount: 0, level: 1,
        streak: { current: 0, best: 0 }
    };
    assert.deepEqual(G.checkAchievements(base), []);
    const withSome = Object.assign({}, base, { totalSuccessfulMornings: 5, mathCorrect: 10 });
    const unlocked = G.checkAchievements(withSome);
    assert.ok(unlocked.includes('first_alarm'));
    assert.ok(unlocked.includes('mornings_5'));
    assert.ok(unlocked.includes('math_10'));
    assert.ok(!unlocked.includes('math_master')); // needs 50, not 10
    assert.ok(!unlocked.includes('streak_7'));
});

test('checkAchievements: new_streak_record only true while current equals best and best > 0', () => {
    const mk = (current, best) => Object.assign({
        challengesCompleted: 0, beforeSevenDays: 0, completedDays: 0, noSnoozeCount: 0,
        bedtimeRoutineCompletions: 0, bestStreak: best, mathCorrect: 0, comboChallengesCompleted: 0,
        totalSuccessfulMornings: 0, physicalChallengesCompleted: 0, totalRepsCompleted: 0,
        mathLevel5SolvedEver: false, tripleComboCount: 0, level: 1
    }, { streak: { current, best } });
    assert.ok(G.checkAchievements(mk(5, 5)).includes('new_streak_record'));
    assert.ok(!G.checkAchievements(mk(3, 5)).includes('new_streak_record'));
    assert.ok(!G.checkAchievements(mk(0, 0)).includes('new_streak_record'));
});

test('achievementXp: pulls the real per-rarity amount, not a guess', () => {
    assert.equal(G.achievementXp('first_alarm'), G.RARITY_XP.common);
    assert.equal(G.achievementXp('streak_30'), G.RARITY_XP.epic);
    assert.equal(G.achievementXp('nonexistent_id'), 0);
});

test('pickDailyQuests: deterministic for the same date, varies across dates, always a valid subset', () => {
    const a = G.pickDailyQuests('2026-03-01', 3).map(q => q.id);
    const b = G.pickDailyQuests('2026-03-01', 3).map(q => q.id);
    assert.deepEqual(a, b);
    const validIds = new Set(G.DAILY_QUEST_DEFS.map(d => d.id));
    for (const id of a) assert.ok(validIds.has(id));
    assert.equal(new Set(a).size, 3); // no duplicate quest within one day

    const c = G.pickDailyQuests('2026-03-02', 3).map(q => q.id);
    // Not asserting inequality (could coincidentally match) — just that it's a valid, well-formed pick.
    assert.equal(c.length, 3);
});

test('evaluateDailyQuests: progress and done reflect the real context, capped at target', () => {
    const ctx = { alarmsCompletedToday: 1, challengesCompletedToday: 0, physicalCompletedToday: 2, mathSolvedToday: 7, distinctAlarmsCompletedToday: 1 };
    const quests = G.evaluateDailyQuests('2026-03-01', ctx);
    const wake = quests.find(q => q.id === 'wake_on_time');
    if (wake) { assert.equal(wake.progress, 1); assert.equal(wake.done, true); }
    const mathQuest = quests.find(q => q.id === 'solve_5_math');
    if (mathQuest) { assert.equal(mathQuest.progress, 5); assert.equal(mathQuest.done, true); } // capped at target=5 even though 7 solved
});

test('comboBonusXp: scales with distinct task types, capped at the spec max', () => {
    assert.equal(G.comboBonusXp(1), 0);
    assert.equal(G.comboBonusXp(2), 25);
    assert.equal(G.comboBonusXp(3), 50);
    assert.equal(G.comboBonusXp(5), 50);
});

test('WEEKLY_GOAL: fixed real numbers from the spec', () => {
    assert.equal(G.WEEKLY_GOAL.xp, 200);
    assert.ok(G.WEEKLY_GOAL.targetDays > 0);
});
