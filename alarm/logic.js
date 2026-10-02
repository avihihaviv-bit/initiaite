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

    // Round to 2 decimals to kill float noise (e.g. 0.1 + 0.2); answers are
    // compared with a small tolerance (mathAnswerMatches) rather than ===.
    function round2(n) { return Math.round(n * 100) / 100; }

    function mathAnswerMatches(given, answer) {
        if (given == null || String(given).trim() === '') return false;
        const n = Number(given);
        if (!Number.isFinite(n)) return false;
        return Math.abs(n - answer) < 0.015;
    }

    // --- Level 1: addition & subtraction ------------------------------------
    function mathLevel1(rng) {
        const op = rng() < 0.5 ? '+' : '-';
        let a = randInt(rng, 1, 20), b = randInt(rng, 1, 20);
        if (op === '-' && b > a) [a, b] = [b, a];
        return { question: `${a} ${op} ${b}`, answer: op === '+' ? a + b : a - b, hint: null };
    }

    // --- Level 2: multiplication, division, simple order of operations -----
    function mathLevel2(rng) {
        if (rng() < 0.55) {
            // single mul or exact division
            if (rng() < 0.5) {
                const a = randInt(rng, 2, 12), b = randInt(rng, 2, 12);
                return { question: `${a} × ${b}`, answer: a * b, hint: null };
            }
            const b = randInt(rng, 2, 12), result = randInt(rng, 2, 12), a = b * result;
            return { question: `${a} ÷ ${b}`, answer: result, hint: null };
        }
        // a + b × c  (must multiply before adding)
        const a = randInt(rng, 1, 20), b = randInt(rng, 2, 10), c = randInt(rng, 2, 10);
        const plus = rng() < 0.5;
        const answer = plus ? a + b * c : a - b * c;
        return { question: `${a} ${plus ? '+' : '-'} ${b} × ${c}`, answer, hint: 'orderOfOps' };
    }

    // --- Level 3: fractions, percentages, powers, mixed order of ops -------
    function mathLevel3(rng, lang) {
        const kind = randInt(rng, 0, 3);
        if (kind === 0) {
            // fraction addition with a shared denominator (clean result)
            const den = [2, 3, 4, 5, 6, 8, 10][randInt(rng, 0, 6)];
            const n1 = randInt(rng, 1, den - 1), n2 = randInt(rng, 1, den - 1);
            const answer = round2((n1 + n2) / den);
            return { question: `${n1}/${den} + ${n2}/${den}`, answer, hint: 'fractionSameDenominator' };
        }
        if (kind === 1) {
            const pct = [10, 20, 25, 50, 75, 5, 15, 30, 40, 60, 80, 90][randInt(rng, 0, 11)];
            const base = randInt(rng, 2, 40) * 10;
            const answer = round2((pct / 100) * base);
            return { question: `${pct}% ${lang === 'he' ? 'מתוך' : 'of'} ${base}`, answer, hint: 'percentOfNumber' };
        }
        if (kind === 2) {
            const base = randInt(rng, 2, 6), exp = randInt(rng, 2, 3);
            return { question: `${base}^${exp}`, answer: Math.pow(base, exp), hint: 'powerMeaning' };
        }
        // mixed order of operations with 3 terms
        const a = randInt(rng, 2, 15), b = randInt(rng, 2, 10), c = randInt(rng, 2, 10);
        const ops = ['+', '-'];
        const op1 = ops[randInt(rng, 0, 1)];
        const answer = op1 === '+' ? a + b * c : a - b * c;
        return { question: `${a} ${op1} ${b} × ${c}`, answer, hint: 'orderOfOps' };
    }

    // --- Level 4: equations, parentheses, algebraic expressions -------------
    function mathLevel4(rng) {
        const kind = randInt(rng, 0, 2);
        if (kind === 0) {
            // ax + b = c, solve for x (x chosen first so it's always a clean integer)
            const x = randInt(rng, 2, 12), a = randInt(rng, 2, 9), b = randInt(rng, 1, 30);
            const c = a * x + b;
            return { question: `${a}x + ${b} = ${c}, x = ?`, answer: x, hint: 'isolateX' };
        }
        if (kind === 1) {
            // (a + b) × c - d
            const a = randInt(rng, 2, 15), b = randInt(rng, 2, 15), c = randInt(rng, 2, 8), d = randInt(rng, 1, 20);
            const answer = (a + b) * c - d;
            return { question: `(${a} + ${b}) × ${c} - ${d}`, answer, hint: 'parensFirst' };
        }
        // algebraic substitution: given x, evaluate ax + b
        const x = randInt(rng, 2, 10), a = randInt(rng, 2, 9), b = randInt(rng, 1, 20);
        const answer = a * x + b;
        return { question: `x = ${x}, ${a}x + ${b} = ?`, answer, hint: 'substituteX' };
    }

    // --- Level 5: multi-step problems combining several topics --------------
    function mathLevel5(rng, lang) {
        const kind = randInt(rng, 0, 2);
        if (kind === 0) {
            // solve for x, then use x in a second expression
            const x = randInt(rng, 2, 10), a = randInt(rng, 2, 8), b = randInt(rng, 1, 20);
            const c = a * x + b;
            const k = randInt(rng, 2, 5);
            const answer = x * k - 1;
            return { question: `${a}x + ${b} = ${c}. ${lang === 'he' ? 'חשב/י' : 'Find'} x × ${k} - 1`, answer, hint: 'multiStepSolveThenUse' };
        }
        if (kind === 1) {
            // percentage of a parenthesized expression
            const a = randInt(rng, 2, 15), b = randInt(rng, 2, 15), c = randInt(rng, 2, 6);
            const inner = (a + b) * c;
            const pct = [10, 20, 25, 50][randInt(rng, 0, 3)];
            const answer = round2((pct / 100) * inner);
            return { question: `${pct}% ${lang === 'he' ? 'מתוך' : 'of'} ((${a} + ${b}) × ${c})`, answer, hint: 'multiStepInnerFirst' };
        }
        // power combined with parentheses and a final operation
        const base = randInt(rng, 2, 4), exp = 2, c = randInt(rng, 2, 15), d = randInt(rng, 1, 10);
        const answer = Math.pow(base, exp) + (c - d);
        return { question: `${base}^${exp} + (${c} - ${d})`, answer, hint: 'powerThenAdd' };
    }

    const MATH_HINTS = {
        en: {
            orderOfOps: 'Multiply/divide before you add or subtract.',
            fractionSameDenominator: 'Same denominator — just add the numerators.',
            percentOfNumber: 'Percent means "out of 100" — divide by 100 then multiply.',
            powerMeaning: 'A power means multiplying the base by itself that many times.',
            isolateX: 'Subtract the constant from both sides, then divide.',
            parensFirst: 'Solve inside the parentheses first.',
            substituteX: 'Replace x with the given number, then calculate.',
            multiStepSolveThenUse: 'Solve for x first, then use that value in the second part.',
            multiStepInnerFirst: 'Solve the parentheses, then take the percentage.',
            powerThenAdd: 'Calculate the power first, then the parentheses, then add.'
        },
        he: {
            orderOfOps: 'בצע/י כפל וחילוק לפני חיבור וחיסור.',
            fractionSameDenominator: 'מכנה משותף — פשוט חבר/י את המונים.',
            percentOfNumber: 'אחוז פירושו "מתוך 100" — חלק/י ב-100 והכפל/י.',
            powerMeaning: 'חזקה פירושה להכפיל את הבסיס בעצמו את מספר הפעמים הזה.',
            isolateX: 'חסר/י את הקבוע משני האגפים, ואז חלק/י.',
            parensFirst: 'פתור/י קודם את מה שבתוך הסוגריים.',
            substituteX: 'הצב/י את x במספר הנתון, ואז חשב/י.',
            multiStepSolveThenUse: 'פתור/י קודם את x, ואז השתמש/י בערך בחלק השני.',
            multiStepInnerFirst: 'פתור/י קודם את הסוגריים, ואז קח/י את האחוז.',
            powerThenAdd: 'חשב/י קודם את החזקה, אחר כך את הסוגריים, ואז חבר/י.'
        }
    };
    function mathHintText(hintKey, hintLang) {
        if (!hintKey) return null;
        return ((MATH_HINTS[hintLang] || MATH_HINTS.en)[hintKey]) || MATH_HINTS.en[hintKey] || null;
    }

    const MATH_LEVEL_GENERATORS = { 1: mathLevel1, 2: mathLevel2, 3: mathLevel3, 4: mathLevel4, 5: mathLevel5 };
    // Old difficulty names are still accepted (alarms saved before the 1-5
    // curriculum existed) and map onto the closest new level.
    const LEGACY_DIFFICULTY_TO_LEVEL = { easy: 1, medium: 2, hard: 4 };

    function generateMathQuestion(difficulty, rng, opts) {
        rng = rng || Math.random;
        opts = opts || {};
        const lang = opts.lang === 'he' ? 'he' : 'en';
        if (difficulty === 'custom') {
            const ops = (opts.operators && opts.operators.length) ? opts.operators : ['+', '-'];
            const op = ops[randInt(rng, 0, ops.length - 1)];
            let a, b;
            if (op === '×') { a = randInt(rng, 2, 12); b = randInt(rng, 2, 12); }
            else if (op === '÷') { b = randInt(rng, 2, 12); const result = randInt(rng, 2, 12); a = b * result; }
            else { a = randInt(rng, 1, 50); b = randInt(rng, 1, 50); if (op === '-' && b > a) [a, b] = [b, a]; }
            let answer;
            if (op === '+') answer = a + b;
            else if (op === '-') answer = a - b;
            else if (op === '×') answer = a * b;
            else answer = a / b;
            return { question: `${a} ${op} ${b}`, answer, hint: null };
        }
        const level = MATH_LEVEL_GENERATORS[difficulty] ? difficulty : (LEGACY_DIFFICULTY_TO_LEVEL[difficulty] || 1);
        const gen = MATH_LEVEL_GENERATORS[level] || mathLevel1;
        const q = gen(rng, lang);
        return { question: q.question, answer: q.answer, hint: q.hint, hintText: mathHintText(q.hint, lang) };
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

    // --- Typing challenges: a fixed sentence, or a freshly-random sequence -

    function normalizeForMatch(str) {
        return String(str || '').trim().replace(/\s+/g, ' ').toLowerCase();
    }
    function sentenceMatches(typed, target) {
        return normalizeForMatch(typed) === normalizeForMatch(target);
    }

    const SEQUENCE_CHARSETS = { digits: '0123456789', alnum: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' };
    function generateTypingSequence(length, rng, charset) {
        rng = rng || Math.random;
        const chars = SEQUENCE_CHARSETS[charset] || SEQUENCE_CHARSETS.digits;
        let out = '';
        for (let i = 0; i < length; i++) out += chars[randInt(rng, 0, chars.length - 1)];
        return out;
    }
    function typingSequenceMatches(typed, target) {
        return String(typed || '').trim() === String(target || '').trim();
    }

    // --- Photo challenge: a liveness check only, NOT content recognition ---
    // We cannot reliably verify a photo's subject matter without a real
    // vision model and a verified reference. What we CAN check locally and
    // honestly is that an actual camera frame was captured (not a blank,
    // frozen, or solid-color buffer) — a basic anti-"fake tap-through" gate,
    // never presented as proof of what's in the picture.
    function imageLivenessCheck(rgbaBytes) {
        if (!rgbaBytes || rgbaBytes.length < 4) return { live: false, reason: 'empty' };
        const pixelCount = Math.floor(rgbaBytes.length / 4);
        const step = Math.max(1, Math.floor(pixelCount / 2000));
        let sum = 0, sumSq = 0, n = 0;
        for (let i = 0; i < pixelCount; i += step) {
            const o = i * 4;
            const lum = 0.299 * rgbaBytes[o] + 0.587 * rgbaBytes[o + 1] + 0.114 * rgbaBytes[o + 2];
            sum += lum; sumSq += lum * lum; n++;
        }
        const mean = sum / n;
        const variance = Math.max(0, sumSq / n - mean * mean);
        const stdDev = Math.sqrt(variance);
        if (stdDev < 4) return { live: false, reason: 'tooUniform' };
        return { live: true, reason: 'ok' };
    }

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
        mulberry32, randInt, generateMathQuestion, generateMathSet, mathAnswerMatches, mathHintText,
        generateMemorySequence, sequencesMatch,
        normalizeForMatch, sentenceMatches, generateTypingSequence, typingSequenceMatches, imageLivenessCheck,
        snoozeAllowed, nextSnoozeTime, antiSnoozeDuration,
        checkAchievements, generateCoachInsights, average, stdDev, hhmmToMinutes
    };
});
