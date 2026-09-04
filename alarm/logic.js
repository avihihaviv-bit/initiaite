/*
 * Pure, DOM-free logic for the alarm app: time math, scheduling, streaks,
 * sleep calculations, challenge generation/validation. No side effects,
 * no storage access — safe to unit test with `node --test`.
 */
(function (root, factory) {
    const mod = factory();
    if (typeof module === 'object' && module.exports) module.exports = mod;
    else root.AlarmLogic = mod;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const DAY_MS = 24 * 60 * 60 * 1000;
    const WEEKDAYS = [1, 2, 3, 4, 5];
    const WEEKENDS = [0, 6];
    const EVERYDAY = [0, 1, 2, 3, 4, 5, 6];

    function pad2(n) { return String(n).padStart(2, '0'); }

    function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

    function parseHHMM(hhmm) {
        const [h, m] = String(hhmm).split(':').map(Number);
        return { h: clamp(h || 0, 0, 23), m: clamp(m || 0, 0, 59) };
    }

    function formatTime(date, use24h) {
        let h = date.getHours();
        const m = date.getMinutes();
        if (use24h) return `${pad2(h)}:${pad2(m)}`;
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        return `${h}:${pad2(m)} ${period}`;
    }

    function daysArrayFromPreset(preset) {
        switch (preset) {
            case 'everyday': return EVERYDAY.slice();
            case 'weekdays': return WEEKDAYS.slice();
            case 'weekends': return WEEKENDS.slice();
            case 'once': return [];
            default: return [];
        }
    }

    function presetFromDaysArray(days) {
        if (!days || days.length === 0) return 'once';
        const s = days.slice().sort().join(',');
        if (s === EVERYDAY.slice().sort().join(',')) return 'everyday';
        if (s === WEEKDAYS.slice().sort().join(',')) return 'weekdays';
        if (s === WEEKENDS.slice().sort().join(',')) return 'weekends';
        return 'custom';
    }

    /**
     * Next time an alarm should ring at/after `now`.
     * alarm: { time: "HH:MM", days: [0-6], enabled, onceDate: "YYYY-MM-DD"|null }
     * Returns a Date, or null if the alarm is disabled or a spent one-time alarm.
     */
    function getNextOccurrence(alarm, now) {
        now = now || new Date();
        if (!alarm || alarm.enabled === false) return null;
        const { h, m } = parseHHMM(alarm.time);

        if (!alarm.days || alarm.days.length === 0) {
            // One-time alarm: fires on onceDate if given, else the next
            // upcoming instance of that time (today if not yet passed,
            // otherwise tomorrow).
            const candidate = alarm.onceDate
                ? new Date(`${alarm.onceDate}T00:00:00`)
                : new Date(now);
            candidate.setHours(h, m, 0, 0);
            if (!alarm.onceDate && candidate <= now) candidate.setDate(candidate.getDate() + 1);
            if (alarm.onceDate && candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return null;
            return candidate;
        }

        for (let offset = 0; offset <= 7; offset++) {
            const candidate = new Date(now);
            candidate.setDate(candidate.getDate() + offset);
            candidate.setHours(h, m, 0, 0);
            if (candidate <= now) continue;
            if (alarm.days.includes(candidate.getDay())) return candidate;
        }
        return null;
    }

    function nextOccurrenceAcrossAlarms(alarms, now) {
        now = now || new Date();
        let best = null, bestAlarm = null;
        for (const alarm of alarms) {
            const next = getNextOccurrence(alarm, now);
            if (next && (!best || next < best)) { best = next; bestAlarm = alarm; }
        }
        return best ? { time: best, alarm: bestAlarm } : null;
    }

    function computeCountdown(targetDate, now) {
        now = now || new Date();
        const totalMs = Math.max(0, targetDate.getTime() - now.getTime());
        const totalMinutes = Math.floor(totalMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((totalMs % 60000) / 1000);
        let text;
        if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
        else if (hours > 0) text = `${hours}h ${minutes}m`;
        else if (minutes > 0) text = `${minutes}m ${seconds}s`;
        else text = `${seconds}s`;
        return { totalMs, days, hours, minutes, seconds, text };
    }

    /**
     * Sleep-cycle based bedtime recommendation (90-minute cycles, average
     * literature figure — NOT a personalized or measured value). Returns a
     * few candidate bedtimes for the user's target wake time.
     */
    function recommendedBedtimes(wakeHHMM, fallAsleepMinutes) {
        fallAsleepMinutes = fallAsleepMinutes == null ? 14 : fallAsleepMinutes;
        const { h, m } = parseHHMM(wakeHHMM);
        const wake = new Date(2000, 0, 2, h, m, 0, 0); // arbitrary anchor date
        const cycles = [6, 5, 4]; // 9h, 7.5h, 6h
        return cycles.map(c => {
            const minutesBack = c * 90 + fallAsleepMinutes;
            const bedtime = new Date(wake.getTime() - minutesBack * 60000);
            return { cycles: c, sleepHours: +(c * 1.5).toFixed(1), time: `${pad2(bedtime.getHours())}:${pad2(bedtime.getMinutes())}` };
        });
    }

    function sleepDurationMinutes(bedtimeHHMM, wakeHHMM) {
        const b = parseHHMM(bedtimeHHMM), w = parseHHMM(wakeHHMM);
        let mins = (w.h * 60 + w.m) - (b.h * 60 + b.m);
        if (mins <= 0) mins += 24 * 60;
        return mins;
    }

    // --- Streaks & stats -----------------------------------------------

    /**
     * log: array of { date: 'YYYY-MM-DD', success: boolean } sorted or not,
     * one entry per alarm-day. Computes current streak (consecutive
     * successful days ending today or yesterday) and best streak ever.
     */
    function computeStreak(log) {
        if (!log || log.length === 0) return { current: 0, best: 0 };
        const byDate = new Map();
        for (const entry of log) {
            const prev = byDate.get(entry.date);
            byDate.set(entry.date, prev ? (prev && entry.success) : entry.success);
        }
        const dates = Array.from(byDate.keys()).sort();
        let best = 0, run = 0, prevDate = null;
        for (const d of dates) {
            const success = byDate.get(d);
            if (!success) { run = 0; prevDate = d; continue; }
            if (prevDate) {
                const gapDays = Math.round((new Date(d) - new Date(prevDate)) / DAY_MS);
                run = gapDays === 1 ? run + 1 : 1;
            } else run = 1;
            best = Math.max(best, run);
            prevDate = d;
        }
        // current streak: walk back from the most recent success-eligible day
        const todayStr = dates[dates.length - 1];
        let current = 0;
        for (let i = dates.length - 1; i >= 0; i--) {
            if (!byDate.get(dates[i])) break;
            if (i < dates.length - 1) {
                const gap = Math.round((new Date(dates[i + 1]) - new Date(dates[i])) / DAY_MS);
                if (gap !== 1) break;
            }
            current++;
        }
        void todayStr;
        return { current, best };
    }

    function successRate(log) {
        if (!log || log.length === 0) return null;
        const successCount = log.filter(e => e.success).length;
        return Math.round((successCount / log.length) * 100);
    }

    function weeklyBuckets(log, refDate) {
        refDate = refDate || new Date();
        const labels = [];
        const buckets = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(refDate);
            d.setDate(d.getDate() - i);
            const key = isoDate(d);
            labels.push(key);
            const entries = (log || []).filter(e => e.date === key);
            const success = entries.filter(e => e.success).length;
            buckets.push({ date: key, total: entries.length, success });
        }
        return buckets;
    }

    function isoDate(d) {
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    // --- Challenges -------------------------------------------------------

    function mulberry32(seed) {
        return function () {
            seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

    function generateMathQuestion(difficulty, rng, opts) {
        rng = rng || Math.random;
        let a, b, op;
        if (difficulty === 'custom') {
            const ops = (opts && opts.operators && opts.operators.length) ? opts.operators : ['+', '-'];
            op = ops[randInt(rng, 0, ops.length - 1)];
            if (op === '×') { a = randInt(rng, 2, 12); b = randInt(rng, 2, 12); }
            else if (op === '÷') { b = randInt(rng, 2, 12); const result = randInt(rng, 2, 12); a = b * result; }
            else { a = randInt(rng, 1, 50); b = randInt(rng, 1, 50); if (op === '-' && b > a) [a, b] = [b, a]; }
        } else if (difficulty === 'easy') {
            op = rng() < 0.5 ? '+' : '-';
            a = randInt(rng, 1, 20); b = randInt(rng, 1, 20);
            if (op === '-' && b > a) [a, b] = [b, a];
        } else if (difficulty === 'hard') {
            const ops = ['×', '÷', '+'];
            op = ops[randInt(rng, 0, ops.length - 1)];
            if (op === '×') { a = randInt(rng, 6, 15); b = randInt(rng, 6, 15); }
            else if (op === '÷') { b = randInt(rng, 2, 12); const result = randInt(rng, 2, 12); a = b * result; }
            else { a = randInt(rng, 50, 200); b = randInt(rng, 50, 200); }
        } else { // medium
            const ops = ['+', '-', '×'];
            op = ops[randInt(rng, 0, ops.length - 1)];
            if (op === '×') { a = randInt(rng, 2, 12); b = randInt(rng, 2, 12); }
            else { a = randInt(rng, 10, 60); b = randInt(rng, 10, 60); if (op === '-' && b > a) [a, b] = [b, a]; }
        }
        let answer;
        if (op === '+') answer = a + b;
        else if (op === '-') answer = a - b;
        else if (op === '×') answer = a * b;
        else answer = a / b;
        return { question: `${a} ${op} ${b}`, answer };
    }

    function generateMathSet(difficulty, count, rng, opts) {
        const out = [];
        for (let i = 0; i < count; i++) out.push(generateMathQuestion(difficulty, rng, opts));
        return out;
    }

    const MEMORY_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    function generateMemorySequence(length, rng) {
        rng = rng || Math.random;
        const seq = [];
        for (let i = 0; i < length; i++) seq.push(MEMORY_COLORS[randInt(rng, 0, MEMORY_COLORS.length - 1)]);
        return seq;
    }

    function sequencesMatch(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        return a.every((v, i) => v === b[i]);
    }

    const MEMORY_LEVEL_LENGTHS = { easy: 3, medium: 5, hard: 7, extreme: 10 };

    // --- Snooze / anti-snooze ---------------------------------------------

    function snoozeAllowed(snoozeConfig, snoozeCountToday) {
        if (!snoozeConfig || snoozeConfig.enabled === false) return false;
        if (snoozeConfig.maxSnoozes == null) return true;
        return snoozeCountToday < snoozeConfig.maxSnoozes;
    }

    function nextSnoozeTime(now, durationMin) {
        return new Date(now.getTime() + durationMin * 60000);
    }

    // Anti-snooze mode: each successive snooze period shrinks (user is being
    // nudged awake faster), floor at 2 minutes.
    function antiSnoozeDuration(baseMinutes, snoozeIndex) {
        const shrink = Math.max(2, baseMinutes - snoozeIndex * 2);
        return shrink;
    }

    // --- Achievements -------------------------------------------------------

    const ACHIEVEMENT_DEFS = [
        { id: 'first_challenge', title: 'First Challenge', desc: 'Complete your first wake-up challenge.', check: s => s.challengesCompleted >= 1 },
        { id: 'early_bird', title: 'Early Bird', desc: 'Wake up before 7:00 for 7 days.', check: s => s.beforeSevenDays >= 7 },
        { id: 'consistent', title: 'Consistent', desc: 'Complete alarms for 14 days.', check: s => s.completedDays >= 14 },
        { id: 'no_snooze_5', title: 'No Snooze', desc: 'Wake up without snoozing 5 times.', check: s => s.noSnoozeCount >= 5 },
        { id: 'sleep_master', title: 'Sleep Master', desc: 'Complete bedtime routine 10 times.', check: s => s.bedtimeRoutineCompletions >= 10 },
        { id: 'streak_7', title: '7 Day Streak', desc: 'Keep a 7-day streak going.', check: s => s.bestStreak >= 7 },
        { id: 'streak_30', title: '30 Day Streak', desc: 'Keep a 30-day streak going.', check: s => s.bestStreak >= 30 },
        { id: 'math_master', title: 'Math Master', desc: 'Solve 50 math challenge questions correctly.', check: s => s.mathCorrect >= 50 },
        { id: 'wake_up_boss', title: 'Wake-Up Boss', desc: 'Complete 10 combo (multi-step) challenges.', check: s => s.comboChallengesCompleted >= 10 }
    ];

    function checkAchievements(stats) {
        return ACHIEVEMENT_DEFS.filter(a => a.check(stats)).map(a => a.id);
    }

    // --- Deterministic "coach" insights ------------------------------------
    // Only ever summarizes data the app actually recorded (dayLogs). No
    // guessing, no medical claims — just arithmetic on real local history.

    function hhmmToMinutes(hhmm) { const { h, m } = parseHHMM(hhmm); return h * 60 + m; }

    function average(nums) { return nums.reduce((a, b) => a + b, 0) / nums.length; }
    function stdDev(nums) {
        if (nums.length < 2) return 0;
        const avg = average(nums);
        return Math.sqrt(average(nums.map(n => Math.pow(n - avg, 2))));
    }

    function generateCoachInsights(dayLogs) {
        const insights = [];
        if (!dayLogs || dayLogs.length < 3) {
            insights.push({ kind: 'info', text: 'Keep using your alarm for a few more days — insights need at least 3 recorded wake-ups.' });
            return insights;
        }
        const recent = dayLogs.slice(-14);
        const wakeMinutes = recent.filter(l => l.actualWakeTime).map(l => hhmmToMinutes(l.actualWakeTime));
        if (wakeMinutes.length >= 3) {
            const avgMin = Math.round(average(wakeMinutes));
            const h = Math.floor(avgMin / 60), m = avgMin % 60;
            insights.push({ kind: 'stat', text: `You've been waking up around ${pad2(h)}:${pad2(m)} recently.` });
            const sd = stdDev(wakeMinutes);
            if (sd > 45) insights.push({ kind: 'tip', text: 'Your wake time varies quite a bit day to day. A more consistent time can make mornings easier.' });
        }
        const totalSnoozes = recent.reduce((sum, l) => sum + (l.snoozeCount || 0), 0);
        const avgSnooze = totalSnoozes / recent.length;
        if (avgSnooze >= 1.5) insights.push({ kind: 'tip', text: `You're snoozing ${avgSnooze.toFixed(1)} times per alarm on average. A wake-up challenge can help you get up on the first ring.` });
        else if (totalSnoozes === 0) insights.push({ kind: 'stat', text: "You haven't snoozed recently — nice consistency." });
        const rate = successRate(recent.map(l => ({ success: l.success })));
        if (rate != null && rate < 70) insights.push({ kind: 'tip', text: `Your recent alarm success rate is ${rate}%. Consider a louder sound or a harder challenge.` });
        return insights;
    }

    return {
        DAY_MS, WEEKDAYS, WEEKENDS, EVERYDAY, MEMORY_LEVEL_LENGTHS, ACHIEVEMENT_DEFS,
        pad2, clamp, parseHHMM, formatTime, isoDate,
        daysArrayFromPreset, presetFromDaysArray,
        getNextOccurrence, nextOccurrenceAcrossAlarms, computeCountdown,
        recommendedBedtimes, sleepDurationMinutes,
        computeStreak, successRate, weeklyBuckets,
        mulberry32, randInt, generateMathQuestion, generateMathSet,
        generateMemorySequence, sequencesMatch,
        snoozeAllowed, nextSnoozeTime, antiSnoozeDuration,
        checkAchievements, generateCoachInsights, average, stdDev, hhmmToMinutes
    };
});
