const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../logic.js');

test('formatTime 24h and 12h', () => {
    const d = new Date(2026, 0, 1, 7, 5);
    assert.equal(L.formatTime(d, true), '07:05');
    assert.equal(L.formatTime(d, false), '7:05 AM');
    const noon = new Date(2026, 0, 1, 0, 0);
    assert.equal(L.formatTime(noon, false), '12:00 AM');
});

test('daysArrayFromPreset / presetFromDaysArray round-trip', () => {
    assert.deepEqual(L.daysArrayFromPreset('weekdays'), [1, 2, 3, 4, 5]);
    assert.equal(L.presetFromDaysArray([1, 2, 3, 4, 5]), 'weekdays');
    assert.equal(L.presetFromDaysArray([0, 6]), 'weekends');
    assert.equal(L.presetFromDaysArray(L.EVERYDAY), 'everyday');
    assert.equal(L.presetFromDaysArray([]), 'once');
    assert.equal(L.presetFromDaysArray([1, 3]), 'custom');
});

test('getNextOccurrence: recurring alarm fires next matching weekday', () => {
    // Wednesday 2026-01-07 10:00, alarm at 07:00 on Mon/Wed/Fri
    const now = new Date(2026, 0, 7, 10, 0);
    const alarm = { time: '07:00', days: [1, 3, 5], enabled: true };
    const next = L.getNextOccurrence(alarm, now);
    assert.equal(next.getDay(), 5); // today's 07:00 already passed -> next Friday
    assert.equal(next.getHours(), 7);
});

test('getNextOccurrence: same-day still upcoming', () => {
    const now = new Date(2026, 0, 7, 6, 0); // Wed 06:00
    const alarm = { time: '07:00', days: [1, 3, 5], enabled: true };
    const next = L.getNextOccurrence(alarm, now);
    assert.equal(next.getDate(), 7);
    assert.equal(next.getDay(), 3);
});

test('getNextOccurrence: disabled alarm returns null', () => {
    const alarm = { time: '07:00', days: [1, 2, 3, 4, 5], enabled: false };
    assert.equal(L.getNextOccurrence(alarm, new Date()), null);
});

test('getNextOccurrence: one-time alarm today vs tomorrow', () => {
    const early = new Date(2026, 0, 7, 5, 0);
    const alarm = { time: '07:00', days: [], enabled: true, onceDate: null };
    const next1 = L.getNextOccurrence(alarm, early);
    assert.equal(next1.getDate(), 7);

    const late = new Date(2026, 0, 7, 9, 0);
    const next2 = L.getNextOccurrence(alarm, late);
    assert.equal(next2.getDate(), 8); // rolled to tomorrow
});

test('getNextOccurrence: spent one-time alarm with explicit past date returns null', () => {
    const alarm = { time: '07:00', days: [], enabled: true, onceDate: '2020-01-01' };
    assert.equal(L.getNextOccurrence(alarm, new Date(2026, 0, 1)), null);
});

test('nextOccurrenceAcrossAlarms picks the earliest', () => {
    const now = new Date(2026, 0, 7, 6, 0);
    const alarms = [
        { time: '09:00', days: [3], enabled: true },
        { time: '07:00', days: [3], enabled: true },
        { time: '08:00', days: [3], enabled: false }
    ];
    const result = L.nextOccurrenceAcrossAlarms(alarms, now);
    assert.equal(result.time.getHours(), 7);
});

test('computeCountdown formats correctly', () => {
    const now = new Date(2026, 0, 1, 0, 0, 0);
    const target = new Date(2026, 0, 1, 2, 5, 30);
    const cd = L.computeCountdown(target, now);
    assert.equal(cd.hours, 2);
    assert.equal(cd.minutes, 5);
    assert.match(cd.text, /2h 5m/);
});

test('recommendedBedtimes returns three descending-duration options before wake time', () => {
    const recs = L.recommendedBedtimes('07:00', 14);
    assert.equal(recs.length, 3);
    assert.equal(recs[0].sleepHours, 9);
    assert.equal(recs[0].time, '21:46');
});

test('sleepDurationMinutes handles overnight wraparound', () => {
    assert.equal(L.sleepDurationMinutes('23:00', '07:00'), 8 * 60);
    assert.equal(L.sleepDurationMinutes('07:00', '23:00'), 16 * 60);
});

test('computeStreak: consecutive successful days counted, gap resets', () => {
    const log = [
        { date: '2026-01-01', success: true },
        { date: '2026-01-02', success: true },
        { date: '2026-01-03', success: true },
        { date: '2026-01-05', success: true } // gap on the 4th breaks the run
    ];
    const s = L.computeStreak(log);
    assert.equal(s.best, 3);
    assert.equal(s.current, 1);
});

test('computeStreak: a failed day breaks the current streak', () => {
    const log = [
        { date: '2026-01-01', success: true },
        { date: '2026-01-02', success: false },
        { date: '2026-01-03', success: true }
    ];
    const s = L.computeStreak(log);
    assert.equal(s.current, 1);
});

test('successRate computes percentage, null on empty', () => {
    assert.equal(L.successRate([]), null);
    assert.equal(L.successRate([{ success: true }, { success: true }, { success: false }, { success: true }]), 75);
});

test('generateMathQuestion is deterministic with a seeded rng and answer is correct', () => {
    const rng = L.mulberry32(42);
    const set = L.generateMathSet('easy', 5, rng);
    assert.equal(set.length, 5);
    for (const q of set) {
        const [a, op, b] = q.question.split(' ');
        const na = Number(a), nb = Number(b);
        const expected = op === '+' ? na + nb : na - nb;
        assert.equal(q.answer, expected);
        assert.ok(na >= 0 && nb >= 0);
    }
});

test('generateMemorySequence length matches level, sequencesMatch works', () => {
    const seq = L.generateMemorySequence(L.MEMORY_LEVEL_LENGTHS.hard, L.mulberry32(1));
    assert.equal(seq.length, 7);
    assert.ok(L.sequencesMatch(seq, seq.slice()));
    assert.ok(!L.sequencesMatch(seq, ['red']));
});

test('snoozeAllowed respects maxSnoozes, unlimited when null', () => {
    assert.equal(L.snoozeAllowed({ enabled: true, maxSnoozes: 2 }, 1), true);
    assert.equal(L.snoozeAllowed({ enabled: true, maxSnoozes: 2 }, 2), false);
    assert.equal(L.snoozeAllowed({ enabled: true, maxSnoozes: null }, 999), true);
    assert.equal(L.snoozeAllowed({ enabled: false }, 0), false);
});

test('antiSnoozeDuration shrinks but floors at 2 minutes', () => {
    assert.equal(L.antiSnoozeDuration(10, 0), 10);
    assert.equal(L.antiSnoozeDuration(10, 3), 4);
    assert.equal(L.antiSnoozeDuration(10, 10), 2);
});

test('checkAchievements only unlocks what the stats actually satisfy', () => {
    const stats = { challengesCompleted: 1, beforeSevenDays: 0, completedDays: 0, noSnoozeCount: 0, bedtimeRoutineCompletions: 0, bestStreak: 0, mathCorrect: 0, comboChallengesCompleted: 0 };
    const unlocked = L.checkAchievements(stats);
    assert.deepEqual(unlocked, ['first_challenge']);
});

test('generateCoachInsights needs at least 3 entries and never fabricates', () => {
    assert.equal(L.generateCoachInsights([]).length, 1);
    assert.equal(L.generateCoachInsights([{ date: '1' }]).length, 1); // still just the "need more data" message
    const logs = [
        { date: '2026-01-01', success: true, actualWakeTime: '07:00', snoozeCount: 0 },
        { date: '2026-01-02', success: true, actualWakeTime: '07:05', snoozeCount: 0 },
        { date: '2026-01-03', success: true, actualWakeTime: '06:58', snoozeCount: 0 }
    ];
    const insights = L.generateCoachInsights(logs);
    assert.ok(insights.some(i => /waking up around/.test(i.text)));
});

test('DST-safe: getNextOccurrence still lands on 07:00 local time across a spring-forward date (US)', () => {
    // 2026-03-08 is a DST transition date in the US. An alarm at 07:00 the
    // day before should still resolve to 07:00 local time on the 8th.
    const now = new Date(2026, 2, 7, 8, 0); // March 7, 08:00 (after that day's 07:00)
    const alarm = { time: '07:00', days: [0, 1, 2, 3, 4, 5, 6], enabled: true };
    const next = L.getNextOccurrence(alarm, now);
    assert.equal(next.getHours(), 7);
    assert.equal(next.getMinutes(), 0);
    assert.equal(next.getDate(), 8);
});
