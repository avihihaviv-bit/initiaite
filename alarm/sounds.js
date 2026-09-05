/*
 * Synthesized alarm sound library (Web Audio API — oscillators + filtered
 * noise). No shipped audio files, so nothing here can be a copyright
 * concern. "Nature" sounds are synthesized approximations (filtered noise),
 * not recordings — labelled as such in the UI, never claimed as real field
 * recordings. Custom uploads play through a plain <audio> element.
 */
(function (root) {
    'use strict';

    // Each entry is a declarative note pattern the engine schedules on a
    // loop. type: 'tone' (oscillator sequence) or 'noise' (filtered noise
    // bed, for the Nature category).
    const LIBRARY = [
        { id: 'chime', name: 'Morning Chime', category: 'calm', type: 'tone', wave: 'sine', notes: [523.25, 659.25, 783.99], noteMs: 260, gapMs: 900 },
        { id: 'soft-bell', name: 'Soft Bell', category: 'calm', type: 'tone', wave: 'sine', notes: [440], noteMs: 500, gapMs: 1400 },
        { id: 'gentle-rise', name: 'Gentle Rise', category: 'calm', type: 'tone', wave: 'triangle', notes: [392, 440, 494, 523], noteMs: 220, gapMs: 700 },
        { id: 'synth-rain', name: 'Synth Rain', category: 'nature', type: 'noise', filter: 'lowpass', filterFreq: 900, gapMs: 0 },
        { id: 'synth-wind', name: 'Synth Wind', category: 'nature', type: 'noise', filter: 'bandpass', filterFreq: 500, gapMs: 0 },
        { id: 'synth-stream', name: 'Synth Stream', category: 'nature', type: 'noise', filter: 'highpass', filterFreq: 1400, gapMs: 0 },
        { id: 'pulse', name: 'Pulse', category: 'electronic', type: 'tone', wave: 'square', notes: [880], noteMs: 120, gapMs: 260 },
        { id: 'digital-alert', name: 'Digital Alert', category: 'electronic', type: 'tone', wave: 'sawtooth', notes: [660, 880], noteMs: 150, gapMs: 220 },
        { id: 'retro-beep', name: 'Retro Beep', category: 'electronic', type: 'tone', wave: 'square', notes: [523, 0, 523, 0], noteMs: 140, gapMs: 400 },
        { id: 'classic-bell', name: 'Classic Bell', category: 'classic', type: 'tone', wave: 'sine', notes: [659, 587, 659, 587], noteMs: 300, gapMs: 500 },
        { id: 'old-clock', name: 'Old Clock', category: 'classic', type: 'tone', wave: 'triangle', notes: [400, 400], noteMs: 180, gapMs: 700 },
        { id: 'siren', name: 'Siren', category: 'loud', type: 'sweep', wave: 'sawtooth', from: 500, to: 1200, sweepMs: 500, gapMs: 60 },
        { id: 'foghorn', name: 'Foghorn', category: 'loud', type: 'tone', wave: 'sawtooth', notes: [130], noteMs: 700, gapMs: 300 },
        { id: 'air-horn', name: 'Air Horn', category: 'loud', type: 'tone', wave: 'square', notes: [220, 220, 220], noteMs: 200, gapMs: 120 },
        { id: 'tick', name: 'Minimal Tick', category: 'minimal', type: 'tone', wave: 'sine', notes: [1000], noteMs: 40, gapMs: 760 },
        { id: 'single-note', name: 'Single Note', category: 'minimal', type: 'tone', wave: 'sine', notes: [523], noteMs: 300, gapMs: 1600 },
        { id: 'fanfare', name: 'Rise & Shine', category: 'motivational', type: 'tone', wave: 'square', notes: [523, 659, 784, 1046], noteMs: 180, gapMs: 350 },
        { id: 'victory', name: 'Victory', category: 'motivational', type: 'tone', wave: 'triangle', notes: [392, 523, 659, 784, 1046], noteMs: 150, gapMs: 400 },
        { id: 'workout-beep', name: 'Workout Beeps', category: 'workout', type: 'tone', wave: 'square', notes: [660, 660], noteMs: 100, gapMs: 180 },
        { id: 'school-bell', name: 'School Bell', category: 'school', type: 'tone', wave: 'square', notes: [740, 740, 740], noteMs: 300, gapMs: 150 },
        { id: 'silly-boop', name: 'Silly Boop', category: 'funny', type: 'tone', wave: 'sawtooth', notes: [300, 500, 300, 700], noteMs: 120, gapMs: 260 }
    ];

    const CATEGORIES = ['calm', 'nature', 'electronic', 'classic', 'loud', 'minimal', 'motivational', 'workout', 'school', 'funny'];

    function byId(id) { return LIBRARY.find(s => s.id === id); }
    function byCategory(cat) { return LIBRARY.filter(s => s.category === cat); }

    function SoundEngine() {
        this.ctx = null;
        this.masterGain = null;
        this.timers = [];
        this.activeNodes = [];
        this.audioEl = null;
        this.playing = false;
    }

    SoundEngine.prototype.ensureContext = function () {
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new Ctx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    };

    SoundEngine.prototype._clearTimers = function () {
        this.timers.forEach(clearTimeout);
        this.timers = [];
    };

    SoundEngine.prototype._stopNodes = function () {
        this.activeNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* already stopped */ } });
        this.activeNodes = [];
    };

    SoundEngine.prototype.stop = function () {
        this.playing = false;
        this._clearTimers();
        this._stopNodes();
        if (this.audioEl) {
            this.audioEl.pause(); this.audioEl.currentTime = 0; this.audioEl = null;
            if (this.audioUrl && this.audioUrl.indexOf('blob:') === 0) { try { URL.revokeObjectURL(this.audioUrl); } catch (e) { /* already revoked */ } }
            this.audioUrl = null;
        }
    };

    /**
     * volume01: target volume, 0..1. gradual: ramp up over rampSeconds
     * instead of starting at full volume.
     */
    SoundEngine.prototype.setVolume = function (volume01) {
        if (this.masterGain) this.masterGain.gain.setTargetAtTime(volume01, this.ctx.currentTime, 0.05);
        if (this.audioEl) this.audioEl.volume = volume01;
    };

    SoundEngine.prototype._playTonePattern = function (def, loop) {
        const ctx = this.ensureContext();
        const notes = def.notes;
        let i = 0;
        const step = () => {
            if (!this.playing) return;
            const freq = notes[i % notes.length];
            if (freq > 0) {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = def.wave || 'sine';
                osc.frequency.value = freq;
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
                g.gain.linearRampToValueAtTime(0, ctx.currentTime + def.noteMs / 1000);
                osc.connect(g); g.connect(this.masterGain);
                osc.start(); osc.stop(ctx.currentTime + def.noteMs / 1000 + 0.02);
                this.activeNodes.push(osc);
            }
            i++;
            const isLastOfPattern = i % notes.length === 0;
            const delay = def.noteMs + (isLastOfPattern ? def.gapMs : def.gapMs / 4);
            if (loop || i < notes.length) this.timers.push(setTimeout(step, delay));
        };
        step();
    };

    SoundEngine.prototype._playSweep = function (def, loop) {
        const ctx = this.ensureContext();
        const step = () => {
            if (!this.playing) return;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = def.wave || 'sawtooth';
            osc.frequency.setValueAtTime(def.from, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(def.to, ctx.currentTime + def.sweepMs / 1000);
            g.gain.setValueAtTime(0.9, ctx.currentTime);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(); osc.stop(ctx.currentTime + def.sweepMs / 1000);
            this.activeNodes.push(osc);
            if (loop) this.timers.push(setTimeout(step, def.sweepMs + def.gapMs));
        };
        step();
    };

    SoundEngine.prototype._playNoise = function (def) {
        const ctx = this.ensureContext();
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer; noise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = def.filter || 'lowpass';
        filter.frequency.value = def.filterFreq || 800;
        noise.connect(filter); filter.connect(this.masterGain);
        noise.start();
        this.activeNodes.push(noise);
    };

    /**
     * Play a library sound or a custom uploaded sound (dataUrl).
     * opts: { volume01, gradual, rampSeconds, loop, customDataUrl }
     */
    SoundEngine.prototype.play = function (soundId, opts) {
        opts = opts || {};
        this.stop();
        this.playing = true;
        const loop = opts.loop !== false;
        const target = opts.volume01 == null ? 0.8 : opts.volume01;
        const rampSeconds = opts.rampSeconds || 25;

        if (opts.customDataUrl) {
            const el = new Audio(opts.customDataUrl);
            const startAt = opts.startOffsetSec || 0;
            // Native `loop` always restarts from 0:00. For an uploaded song
            // with a chosen start point (skip a slow intro), every repeat
            // should jump back to that point instead — so looping is
            // handled manually via 'ended' rather than the loop attribute.
            el.loop = false;
            if (startAt) el.addEventListener('loadedmetadata', () => { try { el.currentTime = startAt; } catch (e) { /* not seekable yet */ } }, { once: true });
            if (loop) el.addEventListener('ended', () => { try { el.currentTime = startAt; el.play(); } catch (e) { /* stopped */ } });
            el.volume = opts.gradual ? 0.03 : target;
            el.play().catch(() => { /* needs a user gesture first on some browsers */ });
            this.audioEl = el;
            this.audioUrl = opts.customDataUrl;
            if (opts.gradual) this._rampAudioEl(el, target, rampSeconds);
            return;
        }

        const def = byId(soundId) || LIBRARY[0];
        this.ensureContext();
        this.masterGain.gain.value = opts.gradual ? 0.03 : target;
        if (opts.gradual) this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + rampSeconds);

        if (def.type === 'noise') this._playNoise(def);
        else if (def.type === 'sweep') this._playSweep(def, loop);
        else this._playTonePattern(def, loop);
    };

    SoundEngine.prototype._rampAudioEl = function (el, target, seconds) {
        const start = performance.now();
        const from = el.volume;
        const tick = () => {
            if (this.audioEl !== el) return;
            const elapsed = (performance.now() - start) / 1000;
            const p = Math.min(1, elapsed / seconds);
            el.volume = from + (target - from) * p;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    /** Short (~1.5s) preview, ignoring loop/volume ramp — used in pickers. */
    SoundEngine.prototype.preview = function (soundId) {
        this.play(soundId, { volume01: 0.6, gradual: false, loop: false });
        setTimeout(() => { if (!byId(soundId) || byId(soundId).type !== 'noise') this.stop(); else setTimeout(() => this.stop(), 1200); }, 1400);
    };

    root.AlarmSounds = { LIBRARY, CATEGORIES, byId, byCategory, SoundEngine, engine: new SoundEngine() };
})(typeof window !== 'undefined' ? window : this);
