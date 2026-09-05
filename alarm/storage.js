/*
 * localStorage-backed data layer for the alarm app. Every entity is a
 * flat JSON array/object under its own key. All persistence lives here so
 * the rest of the app never touches localStorage directly.
 */
(function (root, factory) {
    const mod = factory();
    if (typeof module === 'object' && module.exports) module.exports = mod;
    else root.AlarmStorage = mod;
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NS = 'alarmapp:';
    const KEYS = {
        alarms: NS + 'alarms',
        dayLogs: NS + 'dayLogs',
        routines: NS + 'routines',
        routineRuns: NS + 'routineRuns',
        qrChallenges: NS + 'qrChallenges',
        customSounds: NS + 'customSounds',
        settings: NS + 'settings',
        favorites: NS + 'favoriteSounds',
        recentSounds: NS + 'recentSounds',
        challengeHistory: NS + 'challengeHistory',
        unlockedAchievements: NS + 'unlockedAchievements',
        onboarded: NS + 'onboarded'
    };

    // In-memory fallback for environments without localStorage (older
    // Safari private mode, or the node test runner).
    let mem = {};
    const hasLocalStorage = (function () {
        try {
            const ls = (typeof window !== 'undefined' ? window.localStorage : null);
            if (!ls) return false;
            const t = '__t__'; ls.setItem(t, '1'); ls.removeItem(t);
            return true;
        } catch (e) { return false; }
    })();

    function rawGet(key) {
        if (hasLocalStorage) return window.localStorage.getItem(key);
        return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null;
    }
    function rawSet(key, value) {
        if (hasLocalStorage) window.localStorage.setItem(key, value);
        else mem[key] = value;
    }
    function rawRemove(key) {
        if (hasLocalStorage) window.localStorage.removeItem(key);
        else delete mem[key];
    }

    function readJSON(key, fallback) {
        try {
            const raw = rawGet(key);
            if (raw == null) return fallback;
            return JSON.parse(raw);
        } catch (e) { return fallback; }
    }
    function writeJSON(key, value) { rawSet(key, JSON.stringify(value)); }

    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }

    // --- IndexedDB blob store (uploaded song files) -----------------------
    // A real song is a few MB, and localStorage's base64 encoding inflates
    // that by ~33% against a ~5-10MB per-origin quota — a full song can
    // silently fail to save. IndexedDB has a far larger quota and stores
    // Blobs directly, so audio content lives there; the small, synchronous
    // localStorage-backed customSounds list keeps only name/duration/start
    // offset for instant rendering.
    const MEDIA_DB_NAME = 'alarmapp-media';
    const MEDIA_STORE = 'soundBlobs';
    let mediaDbPromise = null;
    function openMediaDB() {
        if (!mediaDbPromise) {
            mediaDbPromise = new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
                const req = indexedDB.open(MEDIA_DB_NAME, 1);
                req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(MEDIA_STORE)) req.result.createObjectStore(MEDIA_STORE); };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        }
        return mediaDbPromise;
    }
    function putMediaBlob(id, blob) {
        return openMediaDB().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            tx.objectStore(MEDIA_STORE).put(blob, id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }));
    }
    function getMediaBlob(id) {
        return openMediaDB().then(db => new Promise((resolve, reject) => {
            const req = db.transaction(MEDIA_STORE, 'readonly').objectStore(MEDIA_STORE).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        }));
    }
    function deleteMediaBlob(id) {
        return openMediaDB().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            tx.objectStore(MEDIA_STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }));
    }
    function clearMediaBlobs() {
        return openMediaDB().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            tx.objectStore(MEDIA_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }));
    }

    // --- Generic list CRUD -------------------------------------------------

    function list(key) { return readJSON(key, []); }
    function save(key, items) { writeJSON(key, items); return items; }
    function add(key, item) {
        const items = list(key);
        const record = Object.assign({ id: uid(), createdAt: new Date().toISOString() }, item);
        items.push(record);
        save(key, items);
        return record;
    }
    function update(key, id, patch) {
        const items = list(key);
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return null;
        items[idx] = Object.assign({}, items[idx], patch, { updatedAt: new Date().toISOString() });
        save(key, items);
        return items[idx];
    }
    function remove(key, id) {
        const items = list(key);
        const next = items.filter(i => i.id !== id);
        save(key, next);
        return next.length !== items.length;
    }
    function get(key, id) { return list(key).find(i => i.id === id) || null; }

    // --- Alarms --------------------------------------------------------

    const DEFAULT_ALARM = {
        label: '',
        time: '07:00',
        days: [],
        onceDate: null,
        enabled: true,
        soundId: 'chime',
        volume: 80,
        gradualVolume: true,
        vibration: true,
        snooze: { enabled: true, durationMin: 10, maxSnoozes: 3, antiSnooze: false },
        challenge: { tasks: [] },
        smartWindow: { enabled: false, windowMinutes: 20 }
    };

    function listAlarms() { return list(KEYS.alarms); }
    function getAlarm(id) { return get(KEYS.alarms, id); }
    function createAlarm(data) { return add(KEYS.alarms, Object.assign({}, DEFAULT_ALARM, data)); }
    function updateAlarm(id, patch) { return update(KEYS.alarms, id, patch); }
    function deleteAlarm(id) { return remove(KEYS.alarms, id); }

    // --- Day logs (wake history, drives stats/streaks/achievements) -------

    function listDayLogs() { return list(KEYS.dayLogs); }
    function addDayLog(entry) { return add(KEYS.dayLogs, entry); }

    // --- Routines -----------------------------------------------------

    function listRoutines() { return list(KEYS.routines); }
    function saveRoutine(routine) {
        const existing = routine.id ? get(KEYS.routines, routine.id) : null;
        return existing ? update(KEYS.routines, routine.id, routine) : add(KEYS.routines, routine);
    }
    function deleteRoutine(id) { return remove(KEYS.routines, id); }

    function listRoutineRuns() { return list(KEYS.routineRuns); }
    function addRoutineRun(run) { return add(KEYS.routineRuns, run); }
    function updateRoutineRun(id, patch) { return update(KEYS.routineRuns, id, patch); }

    // --- QR challenges --------------------------------------------------

    function listQrChallenges() { return list(KEYS.qrChallenges); }
    function createQrChallenge(data) { return add(KEYS.qrChallenges, data); }
    function deleteQrChallenge(id) { return remove(KEYS.qrChallenges, id); }

    // --- Custom sounds: small metadata here, the actual audio Blob in
    // IndexedDB (see above). ------------------------------------------

    function listCustomSounds() { return list(KEYS.customSounds); }
    /** data: { name, blob, startOffsetSec?, durationSec? }. Rolls the
     * metadata record back if the blob fails to persist (e.g. a full
     * IndexedDB quota), so the list never shows a sound with no audio. */
    async function addCustomSound(data) {
        const record = add(KEYS.customSounds, {
            name: data.name, startOffsetSec: data.startOffsetSec || 0,
            durationSec: data.durationSec || null, sizeBytes: data.blob ? data.blob.size : 0
        });
        try { await putMediaBlob(record.id, data.blob); }
        catch (e) { remove(KEYS.customSounds, record.id); throw e; }
        return record;
    }
    async function deleteCustomSound(id) {
        remove(KEYS.customSounds, id);
        try { await deleteMediaBlob(id); } catch (e) { /* nothing to clean up */ }
        return true;
    }
    function updateCustomSoundMeta(id, patch) { return update(KEYS.customSounds, id, patch); }
    function getCustomSoundBlob(id) { return getMediaBlob(id); }

    // --- Sound favorites / recents ----------------------------------------

    function getFavoriteSounds() { return readJSON(KEYS.favorites, []); }
    function toggleFavoriteSound(soundId) {
        const favs = getFavoriteSounds();
        const idx = favs.indexOf(soundId);
        if (idx === -1) favs.push(soundId); else favs.splice(idx, 1);
        writeJSON(KEYS.favorites, favs);
        return favs;
    }
    function getRecentSounds() { return readJSON(KEYS.recentSounds, []); }
    function pushRecentSound(soundId) {
        let recents = getRecentSounds().filter(s => s !== soundId);
        recents.unshift(soundId);
        recents = recents.slice(0, 6);
        writeJSON(KEYS.recentSounds, recents);
        return recents;
    }

    // --- Challenge history ------------------------------------------------

    function listChallengeHistory() { return list(KEYS.challengeHistory); }
    function addChallengeHistory(entry) { return add(KEYS.challengeHistory, entry); }

    // --- Achievements -----------------------------------------------------

    function getUnlockedAchievements() { return readJSON(KEYS.unlockedAchievements, []); }
    function setUnlockedAchievements(ids) { writeJSON(KEYS.unlockedAchievements, ids); }

    // --- Settings -----------------------------------------------------

    const DEFAULT_SETTINGS = {
        theme: 'system',
        accent: 'indigo',
        reducedMotion: false,
        language: 'en',
        timeFormat: '24h',
        weekStartsOn: 0, // 0 = Sunday
        haptics: true,
        userName: '',
        sleepTargetHours: 8,
        defaultSnoozeMin: 10,
        defaultSound: 'chime',
        defaultVibration: true,
        bedtimeReminderMin: 30,
        morningSummary: true,
        alarmReminders: true,
        locationRemindersEnabled: false
    };

    function getSettings() { return Object.assign({}, DEFAULT_SETTINGS, readJSON(KEYS.settings, {})); }
    function updateSettings(patch) {
        const next = Object.assign({}, getSettings(), patch);
        writeJSON(KEYS.settings, next);
        return next;
    }

    function isOnboarded() { return readJSON(KEYS.onboarded, false) === true; }
    function setOnboarded(v) { writeJSON(KEYS.onboarded, !!v); }

    // --- Export / delete (privacy) -----------------------------------------

    function exportAll() {
        const out = {};
        Object.entries(KEYS).forEach(([name, key]) => { out[name] = readJSON(key, null); });
        out.exportedAt = new Date().toISOString();
        return out;
    }

    async function deleteAll() {
        Object.values(KEYS).forEach(key => rawRemove(key));
        mem = {};
        try { await clearMediaBlobs(); } catch (e) { /* IndexedDB unavailable or already empty */ }
    }

    return {
        KEYS, uid,
        listAlarms, getAlarm, createAlarm, updateAlarm, deleteAlarm,
        listDayLogs, addDayLog,
        listRoutines, saveRoutine, deleteRoutine, listRoutineRuns, addRoutineRun, updateRoutineRun,
        listQrChallenges, createQrChallenge, deleteQrChallenge,
        listCustomSounds, addCustomSound, deleteCustomSound, updateCustomSoundMeta, getCustomSoundBlob,
        getFavoriteSounds, toggleFavoriteSound, getRecentSounds, pushRecentSound,
        listChallengeHistory, addChallengeHistory,
        getUnlockedAchievements, setUnlockedAchievements,
        getSettings, updateSettings, isOnboarded, setOnboarded,
        exportAll, deleteAll
    };
});
