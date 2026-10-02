const test = require('node:test');
const assert = require('node:assert/strict');
const Ch = require('../challenges.js');
const L = require('../logic.js');

test('ChallengeRunner: single math task, wrong answers never advance', () => {
    const rng = L.mulberry32(7);
    const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: 'easy', count: 2 }], rng);
    const q1 = runner.currentTask().questions[0];
    const wrong = runner.submitMathAnswer(q1.answer + 1000);
    assert.equal(wrong.correct, false);
    assert.equal(runner.isComplete(), false);
    assert.equal(runner.currentTask().index, 0); // still on question 1

    // The wrong guess replaced question 1 with a fresh one — answer THAT.
    const replacedQ1 = runner.currentTask().questions[0];
    const right1 = runner.submitMathAnswer(replacedQ1.answer);
    assert.equal(right1.correct, true);
    assert.equal(right1.taskDone, false); // one more question left

    const q2 = runner.currentTask().questions[1];
    const right2 = runner.submitMathAnswer(q2.answer);
    assert.equal(right2.taskDone, true);
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: a wrong math answer replaces the question instead of repeating it', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: 'easy', count: 1 }], L.mulberry32(9));
    const original = runner.currentTask().questions[0];
    runner.submitMathAnswer(original.answer + 999);
    const replaced = runner.currentTask().questions[0];
    assert.notDeepEqual(replaced, original);
    // Submitting the OLD (no-longer-current) answer should not complete the task.
    const stillWrong = runner.submitMathAnswer(original.answer);
    assert.equal(stillWrong.correct, replaced.answer === original.answer);
});

test('ChallengeRunner: maxMistakes mercy-passes a question instead of trapping the user', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: 'easy', count: 1, maxMistakes: 2 }], L.mulberry32(4));
    const r1 = runner.submitMathAnswer(NaN);
    assert.equal(r1.correct, false);
    assert.equal(r1.taskDone, false);
    assert.equal(runner.isComplete(), false);
    const r2 = runner.submitMathAnswer(NaN); // second miss on this question hits maxMistakes
    assert.equal(r2.mercyPass, true);
    assert.equal(runner.isComplete(), true); // it was the only question
});

test('ChallengeRunner: custom math operators only draw from the configured set', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: 'custom', operators: ['×'], count: 5 }], L.mulberry32(11));
    for (const q of runner.currentTask().questions) assert.match(q.question, /×/);
});

test('ChallengeRunner: combo advances through each task type in order', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'tap' }, { type: 'situps', count: 2 }, { type: 'tap' }]);
    assert.equal(runner.currentTask().config.type, 'tap');
    runner.confirmSimple();
    assert.equal(runner.currentTask().config.type, 'situps');
    assert.equal(runner.addRep(), false);
    assert.equal(runner.addRep(), true); // reached target, advances
    assert.equal(runner.currentTask().config.type, 'tap');
    runner.confirmSimple();
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: memory task requires an exact sequence match, wrong resets input', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'memory', level: 'easy' }], L.mulberry32(3));
    const seq = runner.currentTask().sequence;
    assert.equal(seq.length, 3);
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const wrongLast = palette.find(c => c !== seq[2]);
    const wrongInput = [seq[0], seq[1], wrongLast];
    const wrong = runner.submitMemoryInput(wrongInput);
    assert.equal(wrong.done, false);
    assert.equal(runner.currentTask().input.length, 0); // reset after mismatch

    const right = runner.submitMemoryInput(seq.slice());
    assert.equal(right.done, true);
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: QR task only advances on the exact expected code', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'qr', expectedCode: 'secret-42' }]);
    assert.equal(runner.submitQr('wrong-code'), false);
    assert.equal(runner.isComplete(), false);
    assert.equal(runner.submitQr('secret-42'), true);
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: song task only accepts the configured correct sound', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'song', correctSoundId: 'chime' }]);
    assert.equal(runner.chooseSong('siren'), false);
    assert.equal(runner.chooseSong('chime'), true);
    assert.equal(runner.isComplete(), true);
});

test('presets are well-formed and reference real task types', () => {
    const validTypes = new Set(Object.keys(Ch.TYPES).concat(['song']));
    for (const preset of Ch.PRESETS) {
        assert.ok(preset.tasks.length > 0);
        for (const task of preset.tasks) assert.ok(validTypes.has(task.type), `${task.type} in ${preset.id}`);
    }
});

test('capability detection functions degrade to false outside a browser', () => {
    assert.equal(Ch.supportsBarcodeDetector(), false);
    assert.equal(Ch.supportsCamera(), false);
});

test('ChallengeRunner: math task works with numeric levels 1-5, not just legacy names', () => {
    for (let level = 1; level <= 5; level++) {
        const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: level, count: 1 }], L.mulberry32(level));
        const q = runner.currentTask().questions[0];
        const right = runner.submitMathAnswer(q.answer);
        assert.equal(right.correct, true, `level ${level} answer ${q.answer} for "${q.question}" should be accepted`);
    }
});

test('ChallengeRunner: repeatWrongQuestion keeps the SAME question instead of swapping it', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'math', difficulty: 1, count: 1, repeatWrongQuestion: true }], L.mulberry32(5));
    const original = runner.currentTask().questions[0];
    runner.submitMathAnswer(original.answer + 1000);
    const stillSame = runner.currentTask().questions[0];
    assert.deepEqual(stillSame, original);
    const right = runner.submitMathAnswer(original.answer);
    assert.equal(right.correct, true);
});

test('ChallengeRunner: math hints are opt-in and track usage', () => {
    const runnerNoHints = new Ch.ChallengeRunner([{ type: 'math', difficulty: 4, count: 1, allowHints: false }], L.mulberry32(4));
    assert.equal(runnerNoHints.useMathHint(), null); // not allowed, even if a hint exists for this question

    const runnerHints = new Ch.ChallengeRunner([{ type: 'math', difficulty: 4, count: 1, allowHints: true }], L.mulberry32(4));
    const hint = runnerHints.useMathHint();
    if (runnerHints.currentTask().questions[0].hintText) {
        assert.equal(typeof hint, 'string');
        assert.equal(runnerHints.currentTask().hintUsed, true);
    }
});

test('ChallengeRunner: photo task rejects a blank/frozen frame, accepts a real one, never stores the image', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'photo' }]);
    const blank = new Uint8ClampedArray(400).fill(5);
    assert.equal(runner.submitPhoto(blank), false);
    assert.equal(runner.currentTask().captured, false);
    assert.equal(runner.currentTask().lastRejectReason, 'tooUniform');
    assert.equal(runner.isComplete(), false);

    const varied = new Uint8ClampedArray(400);
    for (let i = 0; i < varied.length; i++) varied[i] = (i * 53) % 256;
    assert.equal(runner.submitPhoto(varied), true);
    assert.equal(runner.isComplete(), true);
    // The task state never holds the pixel buffer itself, only a boolean.
    assert.equal('dataUrl' in runner.tasks[0] && runner.tasks[0].dataUrl != null, false);
});

test('ChallengeRunner: type-a-sentence task matches exact content, ignores case/whitespace, supports Hebrew', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'typeSentence', sentence: 'אני קם עכשיו' }]);
    assert.equal(runner.submitTypedSentence('אני קם מחר'), false); // wrong content
    assert.equal(runner.isComplete(), false);
    assert.equal(runner.submitTypedSentence('  אני   קם עכשיו '), true); // whitespace-tolerant
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: typing-sequence task requires an exact match and issues a FRESH sequence on a miss', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'typeSequence', length: 6 }], L.mulberry32(2));
    const original = runner.currentTask().sequence;
    assert.equal(runner.submitTypedSequence('000000' === original ? '111111' : '000000'), false);
    const afterMiss = runner.currentTask().sequence;
    assert.notEqual(afterMiss, original, 'a fresh sequence must be issued after a miss, not the same one shown again');
    assert.equal(runner.submitTypedSequence(afterMiss), true);
    assert.equal(runner.isComplete(), true);
});

test('ChallengeRunner: switchToBackup replaces the current step with its backup task, in place (does not skip it)', () => {
    const runner = new Ch.ChallengeRunner([
        { type: 'sport', activity: 'pullups', count: 10, backup: { type: 'math', difficulty: 1, count: 1 } },
        { type: 'tap' }
    ], L.mulberry32(6));
    assert.equal(runner.currentTask().config.type, 'sport');
    assert.equal(runner.current, 0);
    const switched = runner.switchToBackup();
    assert.equal(switched, true);
    assert.equal(runner.current, 0); // still the first step, not skipped ahead
    assert.equal(runner.currentTask().config.type, 'math');
    assert.equal(runner.currentTask().isBackup, true);
    const q = runner.currentTask().questions[0];
    const r = runner.submitMathAnswer(q.answer);
    assert.equal(r.taskDone, true);
    assert.equal(runner.currentTask().config.type, 'tap'); // advanced to the NEXT real step
});

test('ChallengeRunner: switchToBackup is a no-op when no backup is configured', () => {
    const runner = new Ch.ChallengeRunner([{ type: 'sport', activity: 'squats', count: 5 }]);
    assert.equal(runner.switchToBackup(), false);
    assert.equal(runner.currentTask().config.type, 'sport');
});
