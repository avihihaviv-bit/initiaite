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
