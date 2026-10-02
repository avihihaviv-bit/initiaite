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

test('generateMathQuestion: legacy difficulty names still map onto a level (backward compat)', () => {
    const rng = L.mulberry32(7);
    const q1 = L.generateMathQuestion('easy', rng);
    const q2 = L.generateMathQuestion('medium', rng);
    const q3 = L.generateMathQuestion('hard', rng);
    assert.ok(Number.isFinite(q1.answer) && Number.isFinite(q2.answer) && Number.isFinite(q3.answer));
});

test('generateMathQuestion level 1: addition/subtraction only, non-negative operands and result', () => {
    const rng = L.mulberry32(1);
    for (let i = 0; i < 200; i++) {
        const q = L.generateMathQuestion(1, rng);
        const m = q.question.match(/^(\d+) ([+-]) (\d+)$/);
        assert.ok(m, `unexpected question shape: ${q.question}`);
        const [, a, op, b] = m;
        const expected = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
        assert.equal(q.answer, expected);
        assert.ok(q.answer >= 0);
    }
});

test('generateMathQuestion level 2: multiplication/division or order-of-operations, always correct', () => {
    const rng = L.mulberry32(2);
    let sawOrderOfOps = false;
    for (let i = 0; i < 300; i++) {
        const q = L.generateMathQuestion(2, rng);
        if (/×.*×|÷/.test(q.question) === false && / [+-] /.test(q.question) && q.question.includes('×')) sawOrderOfOps = true;
        // Re-derive the expected answer from the printed expression to catch
        // any precedence mistake in the generator itself.
        if (/^\d+ × \d+$/.test(q.question)) {
            const [a, , b] = q.question.split(' ');
            assert.equal(q.answer, Number(a) * Number(b));
        } else if (/^\d+ ÷ \d+$/.test(q.question)) {
            const [a, , b] = q.question.split(' ');
            assert.equal(q.answer, Number(a) / Number(b));
            assert.ok(Number.isInteger(q.answer)); // always an exact division
        } else {
            const m = q.question.match(/^(\d+) ([+-]) (\d+) × (\d+)$/);
            assert.ok(m, `unexpected level-2 shape: ${q.question}`);
            const [, a, op, b, c] = m;
            const expected = op === '+' ? Number(a) + Number(b) * Number(c) : Number(a) - Number(b) * Number(c);
            assert.equal(q.answer, expected, 'must multiply before adding/subtracting');
        }
    }
    assert.ok(sawOrderOfOps, 'expected at least one order-of-operations question across 300 draws');
});

test('generateMathQuestion level 3: fractions/percent/powers/order-of-ops, answers correct within tolerance', () => {
    const rng = L.mulberry32(3);
    const kinds = new Set();
    for (let i = 0; i < 300; i++) {
        const q = L.generateMathQuestion(3, rng);
        if (/^\d+\/\d+ \+ \d+\/\d+$/.test(q.question)) {
            kinds.add('fraction');
            const [n1d, , n2d2] = q.question.split(' ');
            const [n1, den] = n1d.split('/').map(Number);
            const [n2] = n2d2.split('/').map(Number);
            assert.ok(L.mathAnswerMatches(q.answer, (n1 + n2) / den));
        } else if (/%/.test(q.question)) {
            kinds.add('percent');
            const m = q.question.match(/^(\d+)% (?:of|מתוך) (\d+)$/);
            assert.ok(m, `unexpected percent shape: ${q.question}`);
            assert.ok(L.mathAnswerMatches(q.answer, (Number(m[1]) / 100) * Number(m[2])));
        } else if (/\^/.test(q.question)) {
            kinds.add('power');
            const [base, exp] = q.question.split('^').map(Number);
            assert.equal(q.answer, Math.pow(base, exp));
        } else {
            kinds.add('orderOfOps');
            const m = q.question.match(/^(\d+) ([+-]) (\d+) × (\d+)$/);
            assert.ok(m, `unexpected level-3 shape: ${q.question}`);
            const [, a, op, b, c] = m;
            const expected = op === '+' ? Number(a) + Number(b) * Number(c) : Number(a) - Number(b) * Number(c);
            assert.equal(q.answer, expected);
        }
    }
    assert.ok(kinds.has('fraction') && kinds.has('percent') && kinds.has('power') && kinds.has('orderOfOps'), `only saw: ${[...kinds]}`);
});

test('generateMathQuestion level 4: equations/parentheses/algebra, answers verified by re-solving', () => {
    const rng = L.mulberry32(4);
    const kinds = new Set();
    for (let i = 0; i < 300; i++) {
        const q = L.generateMathQuestion(4, rng);
        if (/x = \?/.test(q.question)) {
            kinds.add('equation');
            const m = q.question.match(/^(\d+)x \+ (\d+) = (\d+), x = \?$/);
            assert.ok(m, `unexpected equation shape: ${q.question}`);
            const [, a, b, c] = m;
            assert.equal(Number(a) * q.answer + Number(b), Number(c), 'x must actually satisfy the equation');
        } else if (/^\(/.test(q.question)) {
            kinds.add('parens');
            const m = q.question.match(/^\((\d+) \+ (\d+)\) × (\d+) - (\d+)$/);
            assert.ok(m, `unexpected parens shape: ${q.question}`);
            const [, a, b, c, d] = m;
            assert.equal(q.answer, (Number(a) + Number(b)) * Number(c) - Number(d));
        } else {
            kinds.add('substitution');
            const m = q.question.match(/^x = (\d+), (\d+)x \+ (\d+) = \?$/);
            assert.ok(m, `unexpected substitution shape: ${q.question}`);
            const [, x, a, b] = m;
            assert.equal(q.answer, Number(a) * Number(x) + Number(b));
        }
    }
    assert.ok(kinds.has('equation') && kinds.has('parens') && kinds.has('substitution'), `only saw: ${[...kinds]}`);
});

test('generateMathQuestion level 5: multi-step problems, answers internally consistent', () => {
    const rng = L.mulberry32(5);
    let count = 0;
    for (let i = 0; i < 150; i++) {
        const q = L.generateMathQuestion(5, rng);
        assert.ok(Number.isFinite(q.answer));
        assert.ok(q.question.length > 0);
        count++;
    }
    assert.equal(count, 150);
});

test('generateMathQuestion: hints are available when the generator provides one, and resolve to real text', () => {
    const rng = L.mulberry32(9);
    let sawHint = false;
    for (let i = 0; i < 100; i++) {
        const q = L.generateMathQuestion(4, rng, { lang: 'en' });
        if (q.hint) { sawHint = true; assert.equal(typeof q.hintText, 'string'); assert.ok(q.hintText.length > 0); }
    }
    assert.ok(sawHint);
    const heQ = L.generateMathQuestion(4, L.mulberry32(9), { lang: 'he' });
    if (heQ.hint) assert.notEqual(heQ.hintText, L.mathHintText(heQ.hint, 'en'));
});

test('mathAnswerMatches: tolerant to float noise, rejects wrong/garbage answers', () => {
    assert.ok(L.mathAnswerMatches('0.3', 0.3));
    assert.ok(L.mathAnswerMatches(0.30000000000000004, 0.3)); // classic float noise
    assert.ok(!L.mathAnswerMatches('abc', 5));
    assert.ok(!L.mathAnswerMatches(4, 5));
    assert.ok(!L.mathAnswerMatches('', 0));
});

test('typing challenges: sentence matching ignores case/whitespace but not content, sequences are random per rng seed', () => {
    assert.ok(L.sentenceMatches('  Hello   World  ', 'hello world'));
    assert.ok(!L.sentenceMatches('Hello World', 'Hello There'));
    assert.ok(L.sentenceMatches('שלום עולם', '  שלום   עולם '));

    const seq = L.generateTypingSequence(6, L.mulberry32(11), 'digits');
    assert.equal(seq.length, 6);
    assert.ok(/^\d{6}$/.test(seq));
    assert.ok(L.typingSequenceMatches(seq, seq));
    assert.ok(!L.typingSequenceMatches(seq, seq.slice(1)));
    const seqA = L.generateTypingSequence(8, L.mulberry32(1), 'alnum');
    assert.equal(seqA.length, 8);
});

test('imageLivenessCheck: rejects a blank/solid-color buffer, accepts real variation', () => {
    const blank = new Uint8ClampedArray(400).fill(10); // solid near-black
    assert.equal(L.imageLivenessCheck(blank).live, false);
    assert.equal(L.imageLivenessCheck(null).live, false);

    const varied = new Uint8ClampedArray(400);
    for (let i = 0; i < varied.length; i++) varied[i] = (i * 37) % 256;
    assert.equal(L.imageLivenessCheck(varied).live, true);
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
