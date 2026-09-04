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

    // --- Custom sounds (stored as data URLs; size-limited by caller) ------

    function listCustomSounds() { return list(KEYS.customSounds); }
    function addCustomSound(data) { return add(KEYS.customSounds, data); }
    function deleteCustomSound(id) { return remove(KEYS.customSounds, id); }

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

    function deleteAll() {
        Object.values(KEYS).forEach(key => rawRemove(key));
        mem = {};
    }

    return {
        KEYS, uid,
        listAlarms, getAlarm, createAlarm, updateAlarm, deleteAlarm,
        listDayLogs, addDayLog,
        listRoutines, saveRoutine, deleteRoutine, listRoutineRuns, addRoutineRun, updateRoutineRun,
        listQrChallenges, createQrChallenge, deleteQrChallenge,
        listCustomSounds, addCustomSound, deleteCustomSound,
        getFavoriteSounds, toggleFavoriteSound, getRecentSounds, pushRecentSound,
        listChallengeHistory, addChallengeHistory,
        getUnlockedAchievements, setUnlockedAchievements,
        getSettings, updateSettings, isOnboarded, setOnboarded,
        exportAll, deleteAll
    };
});
