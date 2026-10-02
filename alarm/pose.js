/*
 * Camera-based exercise rep counting using MediaPipe Pose Landmarker
 * (Google's on-device pose model, run fully client-side via WASM — no
 * video or frame is ever uploaded anywhere).
 *
 * This file is split in two halves on purpose:
 *   1. Pure, DOM-free geometry + state machine + per-exercise rules.
 *      No camera, no MediaPipe, no browser globals — fully unit testable
 *      with synthetic angle sequences (see tests/pose.test.js).
 *   2. Browser-only orchestration (loading the model from a CDN, driving
 *      getUserMedia, the detection loop, drawing the skeleton). This half
 *      cannot be meaningfully unit tested without a real camera and a real
 *      human in frame — see the limitations note in app.js's calibration
 *      screen and the project summary for what still needs on-device
 *      verification.
 *
 * Honesty constraints this module holds itself to:
 *   - A rep is only ever counted on a FULL, validated phase cycle
 *     (top -> descending -> bottom -> ascending -> top), never on a
 *     single frame or a partial movement.
 *   - Frames where the tracked joints aren't confidently visible are
 *     never used to advance the state machine or count a rep.
 *   - "Only moving the head/hips" on a push-up, or hanging without
 *     actually reaching the bar on a pull-up, are rejected by an
 *     explicit secondary form check (formOk), not just the primary angle.
 *   - If the model/camera never reaches a reliable read, the caller is
 *     told so explicitly (trackingQuality: 'unreliable') so the UI can
 *     offer manual counting instead of silently guessing.
 */
(function (root) {
    'use strict';

    // --- 1. Pure geometry -------------------------------------------------

    /** Angle in degrees at vertex b, formed by points a-b-c. Each point is {x,y}. */
    function angleAt(a, b, c) {
        const abx = a.x - b.x, aby = a.y - b.y;
        const cbx = c.x - b.x, cby = c.y - b.y;
        const magAB = Math.hypot(abx, aby), magCB = Math.hypot(cbx, cby);
        if (magAB === 0 || magCB === 0) return 180;
        const cos = Math.min(1, Math.max(-1, (abx * cbx + aby * cby) / (magAB * magCB)));
        return (Math.acos(cos) * 180) / Math.PI;
    }

    function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility, b.visibility) }; }
    function average(nums) { return nums.reduce((s, n) => s + n, 0) / nums.length; }
    function avgVisibility(landmarks, indices) { return average(indices.map(i => (landmarks[i] && landmarks[i].visibility != null) ? landmarks[i].visibility : 0)); }

    // Standard 33-point BlazePose/MediaPipe Pose Landmarker topology.
    const LM = {
        nose: 0, leftShoulder: 11, rightShoulder: 12, leftElbow: 13, rightElbow: 14,
        leftWrist: 15, rightWrist: 16, leftHip: 23, rightHip: 24,
        leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28
    };

    // --- 2. Generic rep-counter state machine ------------------------------
    // phase cycle: top -> descending -> bottom -> ascending -> top (counts here)
    // A phase only commits after `minPhaseFrames` consecutive frames agree,
    // which is the anti-jitter / anti-"momentary pose change" debounce.

    function RepCounter(cfg) {
        this.cfg = cfg;
        this.phase = 'top';
        this.reps = 0;
        this.stuckSince = null;
        this._candidate = null;
        this._candidateFrames = 0;
    }

    /**
     * frame: { angle: number, formOk: boolean, visibility: number, now: number }
     * Returns { reps, phase, tracked, cue } — `cue` is a short reason key
     * (see CUES below) or null when no guidance is needed right now.
     *
     * Debounce: a candidate phase has to be seen on `minPhaseFrames`
     * CONSECUTIVE calls before it commits — one noisy frame (a momentary
     * angle blip) never flips the phase, let alone counts a rep.
     */
    RepCounter.prototype.update = function (frame) {
        const cfg = this.cfg;
        if (frame.visibility < cfg.minVisibility) {
            this._candidate = null;
            this._candidateFrames = 0;
            return { reps: this.reps, phase: this.phase, tracked: false, cue: 'lowConfidence' };
        }

        const atBottom = frame.angle <= cfg.downThresholdDeg && frame.formOk;
        const atTop = frame.angle >= cfg.upThresholdDeg;
        let target = this.phase;
        if (this.phase === 'top' && !atTop) target = 'descending';
        else if (this.phase === 'descending' && atBottom) target = 'bottom';
        else if (this.phase === 'descending' && atTop) target = 'top'; // bounced back up without reaching depth — no rep
        else if (this.phase === 'bottom' && !atBottom) target = 'ascending';
        else if (this.phase === 'ascending' && atTop) target = 'top';
        else if (this.phase === 'ascending' && atBottom) target = 'bottom'; // sank back down before finishing

        let justCounted = false;
        if (target === this.phase) {
            this._candidate = null;
            this._candidateFrames = 0;
        } else {
            if (this._candidate === target) this._candidateFrames++;
            else { this._candidate = target; this._candidateFrames = 1; }

            if (this._candidateFrames >= Math.max(1, cfg.minPhaseFrames)) {
                const prevPhase = this.phase;
                this.phase = target;
                this._candidate = null;
                this._candidateFrames = 0;
                this.stuckSince = frame.now;
                if (prevPhase === 'ascending' && target === 'top') { this.reps++; justCounted = true; }
            }
        }

        const cue = justCounted ? null : this._cueFor(frame);
        return { reps: this.reps, phase: this.phase, tracked: true, cue };
    };

    RepCounter.prototype._cueFor = function (frame) {
        const cfg = this.cfg;
        if (!frame.formOk && (this.phase === 'descending' || this.phase === 'bottom')) return cfg.formCue || 'formIssue';
        const stuckMs = this.stuckSince ? frame.now - this.stuckSince : 0;
        if (stuckMs < 900) return null; // don't nag mid-rep — only nudge if genuinely stuck
        if (this.phase === 'descending') return 'goLower';
        if (this.phase === 'ascending') return 'finishTheRep';
        return null;
    };

    // --- 3. Per-exercise definitions ----------------------------------------

    function kneeAngle(lm) {
        const l = angleAt(lm[LM.leftHip], lm[LM.leftKnee], lm[LM.leftAnkle]);
        const r = angleAt(lm[LM.rightHip], lm[LM.rightKnee], lm[LM.rightAnkle]);
        return average([l, r]);
    }
    function elbowAngle(lm) {
        const l = angleAt(lm[LM.leftShoulder], lm[LM.leftElbow], lm[LM.leftWrist]);
        const r = angleAt(lm[LM.rightShoulder], lm[LM.rightElbow], lm[LM.rightWrist]);
        return average([l, r]);
    }
    function bodyLineAngle(lm) {
        // shoulder-hip-ankle: ~180 deg when the body is a straight plank/line.
        const shoulder = midpoint(lm[LM.leftShoulder], lm[LM.rightShoulder]);
        const hip = midpoint(lm[LM.leftHip], lm[LM.rightHip]);
        const ankle = midpoint(lm[LM.leftAnkle], lm[LM.rightAnkle]);
        return angleAt(shoulder, hip, ankle);
    }
    function hipAngle(lm) {
        const l = angleAt(lm[LM.leftShoulder], lm[LM.leftHip], lm[LM.leftKnee]);
        const r = angleAt(lm[LM.rightShoulder], lm[LM.rightHip], lm[LM.rightKnee]);
        return average([l, r]);
    }
    function chinOverWrist(lm) {
        const wristY = average([lm[LM.leftWrist].y, lm[LM.rightWrist].y]);
        return lm[LM.nose].y <= wristY + 0.03; // image y grows downward; small tolerance for noise
    }
    function shoulderRiseRatio(lm) {
        // Crunch proxy: how far the shoulder midpoint has risen toward the hip,
        // normalized by torso length, since a crunch barely changes hip angle.
        const shoulder = midpoint(lm[LM.leftShoulder], lm[LM.rightShoulder]);
        const hip = midpoint(lm[LM.leftHip], lm[LM.rightHip]);
        const torsoLen = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y) || 1;
        return (hip.y - shoulder.y) / torsoLen; // larger = shoulder has lifted further off the ground
    }

    const EXERCISES = {
        squat: {
            label: 'Squats', formLabel: 'kneesAndHips',
            joints: ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
            criticalJoints: ['leftKnee', 'rightKnee'], criticalCue: 'cantSeeKnees',
            primaryAngle: kneeAngle,
            formOk: () => true,
            cfg: { downThresholdDeg: 100, upThresholdDeg: 160, minVisibility: 0.55, minPhaseFrames: 4, formCue: 'keepBalance' }
        },
        pushup: {
            label: 'Push-ups', formLabel: 'straightBody',
            joints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip', 'leftAnkle', 'rightAnkle'],
            criticalJoints: ['leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'], criticalCue: 'cantSeeArms',
            primaryAngle: elbowAngle,
            formOk: lm => bodyLineAngle(lm) >= 150, // rejects "only dropped the head/hips" reps
            cfg: { downThresholdDeg: 95, upThresholdDeg: 160, minVisibility: 0.55, minPhaseFrames: 4, formCue: 'keepBackStraight' }
        },
        situp_full: {
            label: 'Sit-ups', formLabel: 'fullRange',
            joints: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee'],
            criticalJoints: ['leftHip', 'rightHip'], criticalCue: 'cantSeeMovement',
            primaryAngle: hipAngle,
            formOk: () => true,
            cfg: { downThresholdDeg: 80, upThresholdDeg: 160, minVisibility: 0.5, minPhaseFrames: 4, formCue: 'controlTheMovement' }
        },
        situp_crunch: {
            // Hip angle barely moves in a crunch, so this tracks shoulder lift
            // instead — the least reliable of the four; manual mode is
            // recommended more strongly for this one (see app.js copy).
            label: 'Crunches', formLabel: 'shoulderLift',
            joints: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'],
            criticalJoints: ['leftShoulder', 'rightShoulder'], criticalCue: 'cantSeeMovement',
            primaryAngle: lm => shoulderRiseRatio(lm) * -200 + 180, // remapped so the RepCounter's "angle shrinks at the top of the rep" logic still applies
            formOk: () => true,
            cfg: { downThresholdDeg: 130, upThresholdDeg: 172, minVisibility: 0.5, minPhaseFrames: 3, formCue: 'liftShoulders' }
        },
        pullup: {
            label: 'Pull-ups', formLabel: 'chinOverBar',
            joints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'nose'],
            criticalJoints: ['leftWrist', 'rightWrist', 'nose'], criticalCue: 'cantSeeArms',
            primaryAngle: elbowAngle,
            formOk: chinOverWrist, // rejects a partial pull that never reaches the bar
            cfg: { downThresholdDeg: 90, upThresholdDeg: 160, minVisibility: 0.6, minPhaseFrames: 4, formCue: 'pullHigher' }
        }
    };

    // A required joint sitting right at the frame edge usually means the
    // camera is too close / the body is partly cropped out, rather than a
    // pure lighting/detection problem — worth a more actionable cue than
    // the generic "can't detect your movement".
    function anyJointNearEdge(landmarks, jointNames) {
        const margin = 0.04;
        return jointNames.some(name => {
            const p = landmarks[LM[name]];
            if (!p) return false;
            return p.x < margin || p.x > 1 - margin || p.y < margin || p.y > 1 - margin;
        });
    }

    function buildExerciseTracker(exerciseId) {
        const def = EXERCISES[exerciseId];
        if (!def) throw new Error('Unknown exercise: ' + exerciseId);
        const counter = new RepCounter(def.cfg);
        const allJointIdx = def.joints.map(j => LM[j]).filter(i => i != null).concat(exerciseId === 'pullup' ? [LM.nose] : []);
        return {
            def,
            feed(landmarks, now) {
                const visibility = avgVisibility(landmarks, allJointIdx);
                const angle = def.primaryAngle(landmarks);
                const formOk = def.formOk(landmarks);
                const result = counter.update({ angle, formOk, visibility, now });
                if (result.cue === 'lowConfidence') {
                    // Narrow the generic low-confidence cue down to something
                    // actionable when we can tell WHY: body too close to the
                    // camera (joints clipped at the frame edge) takes
                    // priority over a specific-joint callout, since moving
                    // back usually fixes both at once.
                    if (anyJointNearEdge(landmarks, def.joints)) result.cue = 'moveAwayFromCamera';
                    else if (def.criticalJoints && avgVisibility(landmarks, def.criticalJoints.map(j => LM[j])) < 0.35) result.cue = def.criticalCue;
                }
                return result;
            },
            get reps() { return counter.reps; },
            get phase() { return counter.phase; }
        };
    }

    const CUE_TEXT = {
        en: {
            lowConfidence: "Can't detect your movement — make sure your full body is in frame.",
            keepBackStraight: 'Keep your back straight.',
            keepBalance: 'Keep your balance steady.',
            controlTheMovement: 'Control the movement — avoid swinging.',
            liftShoulders: 'Lift your shoulders further off the ground.',
            pullHigher: 'Pull up until your chin clears the bar.',
            goLower: 'Go a little lower.',
            finishTheRep: 'Return fully to the starting position.',
            formIssue: 'Check your form before continuing.',
            moveAwayFromCamera: 'Move back so your whole body fits in frame.',
            cantSeeKnees: "Can't detect your knees — adjust your angle or distance.",
            cantSeeArms: "Can't detect your arms — adjust your angle or distance.",
            cantSeeMovement: "Can't detect the movement clearly."
        },
        he: {
            lowConfidence: 'לא ניתן לזהות את התנועה — ודא/י שכל הגוף נמצא בפריים.',
            keepBackStraight: 'שמור/י על גב ישר.',
            keepBalance: 'שמור/י על יציבות.',
            controlTheMovement: 'בצע/י בשליטה — בלי לנדנד את הגוף.',
            liftShoulders: 'הרם/י את הכתפיים מעט יותר מהרצפה.',
            pullHigher: "משוך/י למעלה עד שהסנטר עובר את המוט.",
            goLower: 'רד/י מעט יותר.',
            finishTheRep: 'חזור/י במלואך לתנוחת ההתחלה.',
            formIssue: 'בדוק/י את התנוחה לפני שתמשיך/י.',
            moveAwayFromCamera: 'התרחק/י כדי שכל הגוף ייכנס לפריים.',
            cantSeeKnees: 'לא ניתן לזהות את הברכיים — שנה/י זווית או מרחק.',
            cantSeeArms: 'לא ניתן לזהות את הידיים — שנה/י זווית או מרחק.',
            cantSeeMovement: 'לא ניתן לזהות את התנועה בבירור.'
        }
    };
    function cueText(cueKey, lang) { return cueKey ? ((CUE_TEXT[lang] || CUE_TEXT.en)[cueKey] || CUE_TEXT.en[cueKey] || null) : null; }

    // --- 4. Browser-only: MediaPipe loader + camera session ----------------
    // Everything below touches window/navigator/DOM and is intentionally
    // thin — the logic above is where correctness actually lives.

    const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
    const WASM_BASE = CDN_BASE + '/wasm';
    const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

    function supportsPoseCamera() {
        return typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof window !== 'undefined' && 'WebAssembly' in window;
    }

    let visionTasksPromise = null;
    function loadVisionTasks() {
        if (!visionTasksPromise) {
            visionTasksPromise = new Promise((resolve, reject) => {
                if (window.__mpTasksVision) { resolve(window.__mpTasksVision); return; }
                const script = document.createElement('script');
                script.type = 'module';
                script.textContent = `
          import { PoseLandmarker, FilesetResolver } from '${CDN_BASE}/vision_bundle.mjs';
          window.__mpTasksVision = { PoseLandmarker, FilesetResolver };
          window.dispatchEvent(new Event('mp-tasks-vision-ready'));
        `;
                const timeout = setTimeout(() => reject(new Error('MediaPipe script load timed out')), 12000);
                window.addEventListener('mp-tasks-vision-ready', () => { clearTimeout(timeout); resolve(window.__mpTasksVision); }, { once: true });
                script.onerror = () => { clearTimeout(timeout); reject(new Error('MediaPipe script failed to load')); };
                document.head.appendChild(script);
            });
        }
        return visionTasksPromise;
    }

    let poseLandmarkerPromise = null;
    async function getPoseLandmarker() {
        if (!poseLandmarkerPromise) {
            poseLandmarkerPromise = (async () => {
                const { PoseLandmarker, FilesetResolver } = await loadVisionTasks();
                const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE);
                return PoseLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
                    runningMode: 'VIDEO',
                    numPoses: 1
                });
            })();
        }
        return poseLandmarkerPromise;
    }

    /**
     * Drives a <video> + <canvas> pair: camera stream in, pose landmarks +
     * skeleton overlay + rep tracking out. Construct with callbacks; call
     * start()/stop(). Never throws synchronously — failures resolve through
     * onError so the UI can fall back to manual counting.
     */
    function PoseSession(opts) {
        this.video = opts.video;
        this.canvas = opts.canvas;
        this.exerciseId = opts.exerciseId;
        this.lang = opts.lang || 'en';
        this.onRep = opts.onRep || function () {};
        this.onCue = opts.onCue || function () {};
        this.onQuality = opts.onQuality || function () {};
        this.onError = opts.onError || function () {};
        this.onLandmarks = opts.onLandmarks || function () {};
        this.facingMode = opts.facingMode || 'user';
        this._stream = null;
        this._rafId = null;
        this._stopped = false;
        this._tracker = buildExerciseTracker(this.exerciseId);
        this._unreliableStreak = 0;
        this._totalFrames = 0;
    }

    PoseSession.prototype.start = async function () {
        if (!supportsPoseCamera()) { this.onError('unsupported'); return; }
        try {
            this._stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facingMode }, audio: false });
            this.video.srcObject = this._stream;
            await this.video.play();
            const landmarker = await getPoseLandmarker();
            this._landmarker = landmarker;
            this._loop();
        } catch (e) {
            this.onError(e && e.name === 'NotAllowedError' ? 'permissionDenied' : 'loadFailed');
        }
    };

    PoseSession.prototype._loop = function () {
        if (this._stopped) return;
        const now = performance.now();
        let result;
        try {
            result = this._landmarker.detectForVideo(this.video, now);
        } catch (e) {
            this.onError('detectFailed');
            return;
        }
        const landmarksList = result && result.landmarks;
        if (landmarksList && landmarksList.length) {
            this._unreliableStreak = 0;
            const lm = landmarksList[0];
            this.onLandmarks(lm, this.canvas, this.video);
            const frame = this._tracker.feed(lm, now);
            this._totalFrames++;
            if (frame.tracked) this.onQuality('tracking');
            else { this._unreliableStreak++; this.onQuality(this._unreliableStreak > 45 ? 'unreliable' : 'tracking'); }
            if (frame.cue) this.onCue(cueText(frame.cue, this.lang), frame.cue);
            else this.onCue(null, null);
            this.onRep(frame.reps, frame.phase);
        } else {
            this._unreliableStreak++;
            this.onQuality(this._unreliableStreak > 45 ? 'unreliable' : 'searching'); // ~1.5s of misses at 30fps before giving up
            this.onCue(cueText('lowConfidence', this.lang), 'lowConfidence');
        }
        this._rafId = requestAnimationFrame(() => this._loop());
    };

    PoseSession.prototype.stop = function () {
        this._stopped = true;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); this._stream = null; }
    };

    const POSE_CONNECTIONS = [
        [LM.leftShoulder, LM.rightShoulder], [LM.leftShoulder, LM.leftElbow], [LM.leftElbow, LM.leftWrist],
        [LM.rightShoulder, LM.rightElbow], [LM.rightElbow, LM.rightWrist],
        [LM.leftShoulder, LM.leftHip], [LM.rightShoulder, LM.rightHip], [LM.leftHip, LM.rightHip],
        [LM.leftHip, LM.leftKnee], [LM.leftKnee, LM.leftAnkle], [LM.rightHip, LM.rightKnee], [LM.rightKnee, LM.rightAnkle]
    ];
    function drawSkeleton(ctx, lm, width, height, mirror) {
        ctx.save();
        if (mirror) { ctx.translate(width, 0); ctx.scale(-1, 1); }
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.fillStyle = '#7c6bff';
        POSE_CONNECTIONS.forEach(([a, b]) => {
            if (!lm[a] || !lm[b] || lm[a].visibility < 0.4 || lm[b].visibility < 0.4) return;
            ctx.beginPath();
            ctx.moveTo(lm[a].x * width, lm[a].y * height);
            ctx.lineTo(lm[b].x * width, lm[b].y * height);
            ctx.stroke();
        });
        Object.values(LM).forEach(i => {
            const p = lm[i];
            if (!p || p.visibility < 0.4) return;
            ctx.beginPath();
            ctx.arc(p.x * width, p.y * height, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    const mod = {
        angleAt, midpoint, average, avgVisibility, LM,
        RepCounter, EXERCISES, buildExerciseTracker, cueText,
        supportsPoseCamera, loadVisionTasks, getPoseLandmarker, PoseSession, drawSkeleton
    };
    if (typeof module === 'object' && module.exports) module.exports = mod;
    else root.AlarmPose = mod;
})(typeof window !== 'undefined' ? window : this);
