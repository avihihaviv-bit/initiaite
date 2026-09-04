/*
 * Challenge engine: definitions + a sequential runner that drives a list of
 * challenge "tasks" (a combo) to completion. DOM-free where possible; the
 * bits that genuinely need the DOM/hardware (camera preview, tap counters)
 * are driven from app.js, which reads/writes the runner's state.
 *
 * Adding a new challenge type = one entry in TYPES + a case in app.js's
 * renderChallengeStep(). Nothing else needs to change.
 */
(function (root) {
    'use strict';

    const Logic = (typeof module === 'object' && module.exports) ? require('./logic.js') : root.AlarmLogic;

    // physical: true => the safety notice is shown before the step starts.
    const TYPES = {
        tap: { id: 'tap', labelKey: 'dismissNormal', icon: 'hand', physical: false },
        swipe: { id: 'swipe', labelKey: 'dismissSwipe', icon: 'swipe', physical: false },
        math: { id: 'math', labelKey: 'dismissMath', icon: 'calculator', physical: false },
        memory: { id: 'memory', labelKey: 'dismissMemory', icon: 'brain', physical: false },
        sport: { id: 'sport', labelKey: 'dismissSport', icon: 'run', physical: true },
        situps: { id: 'situps', labelKey: 'dismissSitups', icon: 'plus', physical: true },
        song: { id: 'song', labelKey: 'dismissMusic', icon: 'music', physical: false },
        qr: { id: 'qr', labelKey: 'dismissQr', icon: 'qr', physical: false }
    };

    const SPORT_ACTIVITIES = [
        { id: 'squats5', activity: 'squats', count: 5 }, { id: 'squats10', activity: 'squats', count: 10 },
        { id: 'squats15', activity: 'squats', count: 15 }, { id: 'squats20', activity: 'squats', count: 20 },
        { id: 'pushups5', activity: 'pushups', count: 5 }, { id: 'pushups10', activity: 'pushups', count: 10 },
        { id: 'pushups15', activity: 'pushups', count: 15 },
        { id: 'jj20', activity: 'jumpingjacks', count: 20 }, { id: 'jj30', activity: 'jumpingjacks', count: 30 },
        { id: 'walk', activity: 'walk', count: 20 }
    ];
    const SITUP_COUNTS = [10, 20, 30, 40, 50];

    const PRESETS = [
        { id: 'gentle', nameKey: 'presetGentle', icon: '🌅', tasks: [{ type: 'song' }, { type: 'math', difficulty: 'easy', count: 1 }] },
        { id: 'fitness', nameKey: 'presetFitness', icon: '💪', tasks: [{ type: 'situps', count: 20 }, { type: 'sport', activity: 'jumpingjacks', count: 20 }] },
        { id: 'brain', nameKey: 'presetBrain', icon: '🧠', tasks: [{ type: 'math', difficulty: 'medium', count: 10 }, { type: 'memory', level: 'medium' }] },
        { id: 'hardcore', nameKey: 'presetHardcore', icon: '🚨', tasks: [{ type: 'situps', count: 20 }, { type: 'math', difficulty: 'hard', count: 10 }, { type: 'qr' }] },
        { id: 'ultimate', nameKey: 'presetUltimate', icon: '👑', tasks: [{ type: 'math', difficulty: 'hard', count: 5 }, { type: 'sport', activity: 'squats', count: 15 }, { type: 'memory', level: 'hard' }, { type: 'qr' }] }
    ];

    function supportsBarcodeDetector() {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }
    function supportsCamera() {
        return !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
    function supportsMotion() {
        return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    }

    /**
     * Builds the runtime state for one task, given its config. This is
     * where random content (math questions, memory sequence) is generated
     * ONCE when the runner starts, so re-renders don't regenerate answers.
     */
    function buildTaskState(task, rng) {
        rng = rng || Math.random;
        const base = { config: task, status: 'pending', mistakes: 0 };
        switch (task.type) {
            case 'math': {
                const count = task.count || 5;
                const difficulty = task.difficulty || 'easy';
                const opts = { operators: task.operators };
                const questions = Logic.generateMathSet(difficulty, count, rng, opts);
                return Object.assign(base, {
                    questions, index: 0, correctCount: 0, questionMistakes: 0,
                    difficulty, opts, rng,
                    maxMistakes: task.maxMistakes || null, timeLimitSec: task.timeLimitSec || null
                });
            }
            case 'memory': {
                const length = Logic.MEMORY_LEVEL_LENGTHS[task.level] || 5;
                return Object.assign(base, { sequence: Logic.generateMemorySequence(length, rng), input: [], phase: 'watch' });
            }
            case 'situps':
                return Object.assign(base, { target: task.count || 20, reps: 0 });
            case 'sport':
                return Object.assign(base, { target: task.count || 10, reps: 0, activity: task.activity || 'squats' });
            case 'song':
                return Object.assign(base, { resolved: false });
            case 'qr':
                return Object.assign(base, { scanned: false, manualInput: '' });
            case 'swipe':
                return Object.assign(base, { swiped: false });
            default:
                return Object.assign(base, { tapped: false });
        }
    }

    function ChallengeRunner(tasks, rng) {
        this.tasks = (tasks && tasks.length ? tasks : [{ type: 'tap' }]).map(t => buildTaskState(t, rng));
        this.current = 0;
        this.tasks[0].status = 'active';
        this.startedAt = Date.now();
    }

    ChallengeRunner.prototype.currentTask = function () { return this.tasks[this.current]; };
    ChallengeRunner.prototype.isComplete = function () { return this.current >= this.tasks.length; };
    ChallengeRunner.prototype.progressLabel = function () { return `${Math.min(this.current + 1, this.tasks.length)}/${this.tasks.length}`; };

    ChallengeRunner.prototype.advance = function () {
        const t = this.currentTask();
        if (t) t.status = 'done';
        this.current++;
        if (!this.isComplete()) this.currentTask().status = 'active';
        return this.isComplete();
    };

    // --- Per-type answer handlers, return true if the task step is now done ---

    /**
     * A wrong (or timed-out — call with NaN) answer never advances, but per
     * the product spec it also doesn't just re-ask the same question: it's
     * replaced with a fresh one of the same difficulty. If the caller set a
     * maxMistakes cap and it's hit on one question, that question is
     * "mercy-passed" instead of trapping the user forever.
     */
    ChallengeRunner.prototype.submitMathAnswer = function (value) {
        const t = this.currentTask();
        const q = t.questions[t.index];
        const correct = Number(value) === q.answer;
        if (correct) {
            t.correctCount++; t.index++; t.questionMistakes = 0;
            if (t.index >= t.questions.length) { this.advance(); return { correct: true, taskDone: true }; }
            return { correct: true, taskDone: false };
        }
        t.mistakes++;
        t.questionMistakes = (t.questionMistakes || 0) + 1;
        const mercyPass = !!(t.maxMistakes && t.questionMistakes >= t.maxMistakes);
        if (mercyPass) {
            t.correctCount++; t.index++; t.questionMistakes = 0;
            if (t.index >= t.questions.length) { this.advance(); return { correct: false, taskDone: true, mercyPass: true }; }
            return { correct: false, taskDone: false, mercyPass: true };
        }
        t.questions[t.index] = Logic.generateMathQuestion(t.difficulty, t.rng, t.opts);
        return { correct: false, taskDone: false };
    };

    ChallengeRunner.prototype.submitMemoryInput = function (colorSequenceSoFar) {
        const t = this.currentTask();
        t.input = colorSequenceSoFar;
        if (t.input.length < t.sequence.length) return { done: false, correct: true };
        const correct = Logic.sequencesMatch(t.input, t.sequence);
        if (correct) { this.advance(); return { done: true, correct: true }; }
        t.mistakes++; t.input = [];
        return { done: false, correct: false };
    };

    ChallengeRunner.prototype.addRep = function () {
        const t = this.currentTask();
        t.reps = Math.min(t.target, t.reps + 1);
        if (t.reps >= t.target) { this.advance(); return true; }
        return false;
    };

    ChallengeRunner.prototype.chooseSong = function (soundId) {
        const t = this.currentTask();
        const correct = soundId === t.config.correctSoundId;
        if (correct) { t.resolved = true; this.advance(); }
        else t.mistakes++;
        return correct;
    };

    ChallengeRunner.prototype.submitQr = function (decodedValue) {
        const t = this.currentTask();
        const correct = decodedValue === t.config.expectedCode;
        if (correct) { t.scanned = true; this.advance(); }
        else t.mistakes++;
        return correct;
    };

    ChallengeRunner.prototype.confirmSimple = function () {
        const t = this.currentTask();
        t.tapped = true; t.swiped = true;
        this.advance();
        return true;
    };

    const mod = {
        TYPES, SPORT_ACTIVITIES, SITUP_COUNTS, PRESETS,
        supportsBarcodeDetector, supportsCamera, supportsMotion,
        buildTaskState, ChallengeRunner
    };
    if (typeof module === 'object' && module.exports) module.exports = mod;
    else root.AlarmChallenges = mod;
})(typeof window !== 'undefined' ? window : this);
