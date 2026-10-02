const test = require('node:test');
const assert = require('node:assert/strict');
const Pose = require('../pose.js');

// --- Geometry helpers for building synthetic landmark sets with an exact,
// known joint angle (constructed by rotation, not hand-trigonometry, so the
// test fixtures can't silently encode the wrong angle). ---------------------

function rotate(vx, vy, deg) {
    const r = (deg * Math.PI) / 180;
    return { x: vx * Math.cos(r) - vy * Math.sin(r), y: vx * Math.sin(r) + vy * Math.cos(r) };
}
/** A point such that angleAt(baseDirPoint, vertex, result) === angleDeg exactly. */
function pointAtAngle(vertex, baseDirPoint, angleDeg, length) {
    const bx = baseDirPoint.x - vertex.x, by = baseDirPoint.y - vertex.y;
    const baseLen = Math.hypot(bx, by);
    const u = rotate(bx / baseLen, by / baseLen, angleDeg);
    return { x: vertex.x + u.x * length, y: vertex.y + u.y * length, z: 0, visibility: 1 };
}
function pt(x, y, visibility) { return { x, y, z: 0, visibility: visibility == null ? 1 : visibility }; }

function emptyLandmarks() {
    const arr = new Array(33);
    for (let i = 0; i < 33; i++) arr[i] = pt(0.5, 0.5, 1);
    return arr;
}

test('angleAt: straight line is 180deg, right angle is 90deg', () => {
    assert.ok(Math.abs(Pose.angleAt(pt(0, 0), pt(1, 0), pt(2, 0)) - 180) < 1e-6);
    assert.ok(Math.abs(Pose.angleAt(pt(0, 1), pt(0, 0), pt(1, 0)) - 90) < 1e-6);
});

// --- RepCounter: pure state-machine behavior --------------------------------

function cfg(overrides) {
    return Object.assign({ downThresholdDeg: 100, upThresholdDeg: 160, minVisibility: 0.5, minPhaseFrames: 3 }, overrides);
}

test('RepCounter: a full clean cycle counts exactly one rep', () => {
    const rc = new Pose.RepCounter(cfg());
    // minPhaseFrames=3, so each stage (top->descending, descending->bottom,
    // bottom->ascending, ascending->top) needs 3 consecutive holding frames
    // before it commits — hence 6 reps of each extreme angle below.
    const seq = [170, 170, 170, 90, 90, 90, 90, 90, 90, 170, 170, 170, 170, 170, 170];
    let reps = 0;
    for (const angle of seq) reps = rc.update({ angle, formOk: true, visibility: 1, now: 0 }).reps;
    assert.equal(reps, 1);
});

test('RepCounter: debounce rejects a single noisy frame flipping the phase', () => {
    const rc = new Pose.RepCounter(cfg({ minPhaseFrames: 3 }));
    // Starts at top (170). One single stray low reading, then back to top —
    // with minPhaseFrames=3 this must NOT commit a phase change at all.
    rc.update({ angle: 170, formOk: true, visibility: 1, now: 0 });
    const mid = rc.update({ angle: 130, formOk: true, visibility: 1, now: 1 });
    assert.equal(mid.phase, 'top'); // single frame isn't enough to commit "descending"
    const back = rc.update({ angle: 170, formOk: true, visibility: 1, now: 2 });
    assert.equal(back.phase, 'top');
    assert.equal(back.reps, 0);
});

test('RepCounter: a candidate phase commits only after minPhaseFrames consecutive agreeing frames', () => {
    const rc = new Pose.RepCounter(cfg({ minPhaseFrames: 3 }));
    rc.update({ angle: 170, formOk: true, visibility: 1, now: 0 }); // top
    let r = rc.update({ angle: 130, formOk: true, visibility: 1, now: 1 }); // candidate: descending (1)
    assert.equal(r.phase, 'top');
    r = rc.update({ angle: 130, formOk: true, visibility: 1, now: 2 }); // candidate: descending (2)
    assert.equal(r.phase, 'top');
    r = rc.update({ angle: 130, formOk: true, visibility: 1, now: 3 }); // candidate: descending (3) -> commits
    assert.equal(r.phase, 'descending');
});

test('RepCounter: partial depth (never reaches the bottom threshold) counts zero reps', () => {
    const rc = new Pose.RepCounter(cfg());
    const seq = [170, 170, 170, 140, 135, 140, 170, 170, 170]; // dips but never <=100
    let reps = 0;
    for (const angle of seq) reps = rc.update({ angle, formOk: true, visibility: 1, now: 0 }).reps;
    assert.equal(reps, 0);
});

test('RepCounter: bouncing at the bottom before standing up fully still counts only once', () => {
    const rc = new Pose.RepCounter(cfg());
    // Settle to bottom (6 frames), wobble up without reaching top (held only
    // 2 frames — not enough to even commit "ascending"), settle back at
    // bottom, then finally stand all the way up (6 frames).
    const seq = [170, 170, 170, 90, 90, 90, 90, 90, 90, 130, 130, 90, 90, 90, 170, 170, 170, 170, 170, 170];
    let reps = 0;
    for (const angle of seq) reps = rc.update({ angle, formOk: true, visibility: 1, now: 0 }).reps;
    assert.equal(reps, 1);
});

test('RepCounter: low-visibility frames are never used to count or advance the phase', () => {
    const rc = new Pose.RepCounter(cfg({ minVisibility: 0.5 }));
    rc.update({ angle: 170, formOk: true, visibility: 1, now: 0 });
    const r1 = rc.update({ angle: 90, formOk: true, visibility: 0.1, now: 1 }); // low confidence — ignored
    assert.equal(r1.tracked, false);
    assert.equal(r1.phase, 'top');
    // repeat the same low-confidence bottom reading many times — still nothing
    for (let i = 0; i < 10; i++) rc.update({ angle: 90, formOk: true, visibility: 0.1, now: i + 2 });
    assert.equal(rc.reps, 0);
});

test('RepCounter: formOk=false blocks the bottom phase even when the angle qualifies (anti-cheat)', () => {
    const rc = new Pose.RepCounter(cfg({ formCue: 'keepBackStraight' }));
    rc.update({ angle: 170, formOk: true, visibility: 1, now: 0 }); // top
    // Angle reaches "bottom" territory but form is bad (e.g. hips sagging on
    // a push-up) on every single frame — this must never count a rep.
    const seq = [130, 90, 90, 90, 90, 90, 130, 170];
    let reps = 0, sawFormCue = false;
    for (const angle of seq) {
        const r = rc.update({ angle, formOk: false, visibility: 1, now: 0 });
        reps = r.reps;
        if (r.cue === 'keepBackStraight') sawFormCue = true;
    }
    assert.equal(reps, 0);
    assert.equal(sawFormCue, true);
});

// --- Per-exercise integration: real 33-point landmark arrays ----------------

test('squat exercise: standing (knee angle ~180) reads as top, deep squat (~70) as bottom', () => {
    const tracker = Pose.buildExerciseTracker('squat');
    const lm = emptyLandmarks();
    const hip = pt(0.5, 0.3), knee = pt(0.5, 0.5);
    lm[Pose.LM.leftHip] = hip; lm[Pose.LM.rightHip] = hip;
    lm[Pose.LM.leftKnee] = knee; lm[Pose.LM.rightKnee] = knee;
    lm[Pose.LM.leftAnkle] = pointAtAngle(knee, hip, 178, 0.2);
    lm[Pose.LM.rightAnkle] = lm[Pose.LM.leftAnkle];
    const standing = tracker.feed(lm, 0);
    assert.equal(standing.phase, 'top');

    const deepAnkle = pointAtAngle(knee, hip, 70, 0.2);
    lm[Pose.LM.leftAnkle] = deepAnkle; lm[Pose.LM.rightAnkle] = deepAnkle;
    // squat's minPhaseFrames is 4: 4 frames to commit "descending" + 4 more
    // to commit "bottom" = 8 held frames needed to fully settle.
    let last;
    for (let i = 0; i < 8; i++) last = tracker.feed(lm, i);
    assert.equal(last.phase, 'bottom');
});

test('pushup exercise: full rep (good form) counts; sagging hips (bad form) rejects it', () => {
    function buildAtElbowAngle(elbowDeg, straight) {
        const lm = emptyLandmarks();
        const shoulder = pt(0.5, 0.3), elbow = pt(0.5, 0.45);
        lm[Pose.LM.leftShoulder] = shoulder; lm[Pose.LM.rightShoulder] = shoulder;
        lm[Pose.LM.leftElbow] = elbow; lm[Pose.LM.rightElbow] = elbow;
        const wrist = pointAtAngle(elbow, shoulder, elbowDeg, 0.15);
        lm[Pose.LM.leftWrist] = wrist; lm[Pose.LM.rightWrist] = wrist;
        const hip = pt(0.5, straight ? 0.3 : 0.6); // collinear with shoulder/ankle when straight=true-ish
        const ankle = pt(0.5, 0.3); // placed so shoulder-hip-ankle is ~180 only when hip is also near y=0.3
        lm[Pose.LM.leftHip] = hip; lm[Pose.LM.rightHip] = hip;
        lm[Pose.LM.leftAnkle] = ankle; lm[Pose.LM.rightAnkle] = ankle;
        return lm;
    }

    const good = Pose.buildExerciseTracker('pushup');
    const lmGood = buildAtElbowAngle(170, true);
    good.feed(lmGood, 0);
    const lmGoodBottom = buildAtElbowAngle(85, true);
    // pushup's minPhaseFrames is 4: 4 to commit "descending" + 4 more to
    // commit "bottom" = 8 held frames needed.
    let last;
    for (let i = 0; i < 8; i++) last = good.feed(lmGoodBottom, i);
    // Good form: body line shoulder(0.5,0.3)-hip(0.5,0.3)-ankle(0.5,0.3) is degenerate/aligned -> formOk true -> reaches bottom.
    assert.equal(last.phase, 'bottom');

    const bad = Pose.buildExerciseTracker('pushup');
    bad.feed(buildAtElbowAngle(170, true), 0);
    const lmBadBottom = buildAtElbowAngle(85, false); // hip dropped way off the shoulder-ankle line
    let lastBad;
    for (let i = 0; i < 8; i++) lastBad = bad.feed(lmBadBottom, i);
    assert.notEqual(lastBad.phase, 'bottom'); // rejected by the straight-body check
});

test('pullup exercise: chin never clearing the wrists is rejected even at full elbow flexion', () => {
    const lm = emptyLandmarks();
    const shoulder = pt(0.5, 0.3), elbow = pt(0.5, 0.5);
    lm[Pose.LM.leftShoulder] = shoulder; lm[Pose.LM.rightShoulder] = shoulder;
    lm[Pose.LM.leftElbow] = elbow; lm[Pose.LM.rightElbow] = elbow;
    const wristHang = pointAtAngle(elbow, shoulder, 175, 0.2);
    lm[Pose.LM.leftWrist] = wristHang; lm[Pose.LM.rightWrist] = wristHang;
    lm[Pose.LM.nose] = pt(0.5, 0.1); // well above the wrists even while hanging

    const tracker = Pose.buildExerciseTracker('pullup');
    let r;
    for (let i = 0; i < 6; i++) r = tracker.feed(lm, i);
    assert.equal(r.phase, 'top');

    // Flex the elbow fully (angle small) but keep the nose BELOW wrist height —
    // chin never actually cleared the bar, so this must not count as "bottom"/pulled-up.
    const wristPulled = pointAtAngle(elbow, shoulder, 80, 0.2);
    lm[Pose.LM.leftWrist] = wristPulled; lm[Pose.LM.rightWrist] = wristPulled;
    lm[Pose.LM.nose] = pt(0.5, wristPulled.y + 0.1); // nose clearly below (greater y than) the wrists
    let r2;
    for (let i = 0; i < 6; i++) r2 = tracker.feed(lm, i + 10);
    assert.notEqual(r2.phase, 'bottom');
});

test('squat exercise: knees clipped at the frame edge gives "move away from camera", not the generic low-confidence cue', () => {
    const tracker = Pose.buildExerciseTracker('squat');
    const lm = emptyLandmarks();
    // Standing pose first, well-tracked, so the tracker isn't just cold.
    const hip = pt(0.5, 0.3), knee = pt(0.5, 0.5);
    lm[Pose.LM.leftHip] = hip; lm[Pose.LM.rightHip] = hip;
    lm[Pose.LM.leftKnee] = knee; lm[Pose.LM.rightKnee] = knee;
    lm[Pose.LM.leftAnkle] = pointAtAngle(knee, hip, 178, 0.2);
    lm[Pose.LM.rightAnkle] = lm[Pose.LM.leftAnkle];
    tracker.feed(lm, 0);

    // Now the user steps too close: visibility on all required joints drops
    // below the tracking threshold AND the knees sit right at the frame edge.
    for (const name of ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']) {
        lm[Pose.LM[name]] = { ...lm[Pose.LM[name]], visibility: 0.2 };
    }
    lm[Pose.LM.leftKnee] = Object.assign({}, lm[Pose.LM.leftKnee], { x: 0.01 });
    lm[Pose.LM.rightKnee] = Object.assign({}, lm[Pose.LM.rightKnee], { x: 0.01 });
    const r = tracker.feed(lm, 1);
    assert.equal(r.tracked, false);
    assert.equal(r.cue, 'moveAwayFromCamera');
});

test('squat exercise: knees specifically undetected (not an edge issue) gives a knee-specific cue', () => {
    const tracker = Pose.buildExerciseTracker('squat');
    const lm = emptyLandmarks();
    const hip = pt(0.5, 0.3), knee = pt(0.5, 0.5);
    lm[Pose.LM.leftHip] = hip; lm[Pose.LM.rightHip] = hip;
    lm[Pose.LM.leftKnee] = knee; lm[Pose.LM.rightKnee] = knee;
    lm[Pose.LM.leftAnkle] = pointAtAngle(knee, hip, 178, 0.2);
    lm[Pose.LM.rightAnkle] = lm[Pose.LM.leftAnkle];
    tracker.feed(lm, 0);

    // Hips/ankles stay reasonably visible, but the knees specifically drop
    // out (occluded, say, by a table edge) — nowhere near the frame border.
    lm[Pose.LM.leftHip] = Object.assign({}, lm[Pose.LM.leftHip], { visibility: 0.3 });
    lm[Pose.LM.rightHip] = Object.assign({}, lm[Pose.LM.rightHip], { visibility: 0.3 });
    lm[Pose.LM.leftKnee] = Object.assign({}, lm[Pose.LM.leftKnee], { visibility: 0.05 });
    lm[Pose.LM.rightKnee] = Object.assign({}, lm[Pose.LM.rightKnee], { visibility: 0.05 });
    lm[Pose.LM.leftAnkle] = Object.assign({}, lm[Pose.LM.leftAnkle], { visibility: 0.3 });
    lm[Pose.LM.rightAnkle] = Object.assign({}, lm[Pose.LM.rightAnkle], { visibility: 0.3 });
    const r = tracker.feed(lm, 1);
    assert.equal(r.tracked, false);
    assert.equal(r.cue, 'cantSeeKnees');
});

test('cueText: known keys resolve in both languages, unknown resolves to null', () => {
    assert.equal(typeof Pose.cueText('goLower', 'en'), 'string');
    assert.equal(typeof Pose.cueText('goLower', 'he'), 'string');
    assert.equal(Pose.cueText(null, 'en'), null);
});

test('capability detection degrades to false outside a browser', () => {
    assert.equal(Pose.supportsPoseCamera(), false);
});
