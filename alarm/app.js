'use strict';
/* ===========================================================================
 * Wake — main application. Vanilla JS, hash router, full re-render per
 * screen (the app is small enough that this stays fast and simple).
 * Depends on: logic.js, storage.js, sounds.js, challenges.js, i18n.js
 * (all loaded as globals before this file).
 * ========================================================================= */

const L = window.AlarmLogic;
const DB = window.AlarmStorage;
const Sounds = window.AlarmSounds;
const Ch = window.AlarmChallenges;
const Pose = window.AlarmPose;
const Gamify = window.AlarmGamify;
const t = window.I18N.t;

const State = {
    draftAlarm: null,
    editingAlarmId: null,
    activeRing: null,
    celebrate: null,
    celebrateTimer: null,
    lastXpGrant: null,
    xpHistoryFilter: 'all',
    calendarMonth: new Date(),
    calendarSelected: null,
    wakeLock: null,
    qrStream: null,
    modal: null, // { render: fn }
    routineRun: null
};
const firedOccurrences = new Map();

// ---------------------------------------------------------------------- //
// Icons (small inline SVG set — no external assets)
// ---------------------------------------------------------------------- //
const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/>',
    alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M5 3 2.5 5.5M19 3l2.5 2.5"/>',
    moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-6M22 20H2"/>',
    routine: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    trash: '<path d="M4 7h16M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7m2.2 0-1 13.2c0 1-.8 1.8-1.8 1.8H8.7c-1 0-1.8-.8-1.8-1.8L5.8 7"/>',
    star: '<path d="M12 2.5 15 9l7 1-5 5 1.3 7-6.3-3.4L5.7 22 7 15 2 10l7-1z"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    chevronUp: '<path d="m6 15 6-6 6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    upload: '<path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/>'
};
function icon(name, cls) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon ${cls || ''}">${ICONS[name] || ''}</svg>`; }

// ---------------------------------------------------------------------- //
// Utilities
// ---------------------------------------------------------------------- //
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function toast(msg) {
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2600);
}
function haptic(pattern) { if (DB.getSettings().haptics && navigator.vibrate) navigator.vibrate(pattern || 15); }
function formatFullDate(date, lang) {
    return date.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function greetingFor(date, name) {
    const h = date.getHours();
    const key = h < 5 ? 'greetingNight' : h < 12 ? 'greetingMorning' : h < 18 ? 'greetingAfternoon' : h < 23 ? 'greetingEvening' : 'greetingNight';
    const emoji = h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙';
    return `${t(key)}${name ? ', ' + esc(name) : ''} ${emoji}`;
}
function daysSummary(alarm) {
    if (!alarm.days || alarm.days.length === 0) return alarm.onceDate ? t('once') : t('once');
    const preset = L.presetFromDaysArray(alarm.days);
    if (preset === 'everyday') return t('everyday');
    if (preset === 'weekdays') return t('weekdays');
    if (preset === 'weekends') return t('weekends');
    const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return alarm.days.slice().sort().map(d => t(names[d])).join(' · ');
}
function hhmmDate(hhmm) { const { h, m } = L.parseHHMM(hhmm); const d = new Date(); d.setHours(h, m, 0, 0); return d; }
function soundName(soundId) {
    const custom = DB.listCustomSounds().find(s => s.id === soundId);
    if (custom) return custom.name;
    const s = Sounds.byId(soundId);
    return s ? s.name : soundId;
}

// ---------------------------------------------------------------------- //
// Router
// ---------------------------------------------------------------------- //
const ROUTES = ['home', 'alarms', 'alarm-edit', 'sleep', 'routines', 'stats', 'calendar', 'settings', 'profile', 'xp-history'];
function getRoute() {
    const h = (location.hash || '#/home').slice(2);
    const [path, query] = h.split('?');
    const params = new URLSearchParams(query || '');
    return { path: ROUTES.includes(path) ? path : 'home', params };
}
function navigate(path, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    location.hash = '#/' + path + qs;
}
window.addEventListener('hashchange', render);

function goCreateAlarm() { State.draftAlarm = newDraftAlarm(); State.editingAlarmId = null; navigate('alarm-edit'); }
function goEditAlarm(id) {
    const alarm = DB.getAlarm(id);
    if (!alarm) return;
    State.draftAlarm = JSON.parse(JSON.stringify(alarm));
    State.editingAlarmId = id;
    navigate('alarm-edit');
}

// ---------------------------------------------------------------------- //
// Boot
// ---------------------------------------------------------------------- //
function applyTheme() {
    const s = DB.getSettings();
    document.documentElement.setAttribute('data-theme', s.theme === 'system' ? '' : s.theme);
    document.documentElement.setAttribute('data-accent', s.accent);
    document.documentElement.setAttribute('data-reduced-motion', s.reducedMotion ? 'true' : 'false');
}

function boot() {
    const settings = DB.getSettings();
    window.I18N.setLanguage(settings.language || window.I18N.detectInitialLang());
    applyTheme();
    if (!DB.isOnboarded()) {
        seedDefaultRoutines();
        DB.setOnboarded(true);
    }
    render();
    setInterval(tick, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkAlarmsDue(600000); });
    tick();
}

function seedDefaultRoutines() {
    DB.saveRoutine({
        type: 'bedtime', name: 'Bedtime routine',
        steps: [
            { name: 'Stop screens', durationMin: 15 },
            { name: 'Shower', durationMin: 15 },
            { name: 'Brush teeth', durationMin: 10 },
            { name: 'Prepare for tomorrow', durationMin: 10 },
            { name: 'Phone away', durationMin: 10 }
        ]
    });
    DB.saveRoutine({
        type: 'morning', name: 'Morning routine',
        steps: [
            { name: 'Drink water', durationMin: 2 },
            { name: 'Wash face', durationMin: 5 },
            { name: 'Get dressed', durationMin: 8 },
            { name: 'Breakfast', durationMin: 15 },
            { name: 'Leave home', durationMin: 5 }
        ]
    });
}

// ---------------------------------------------------------------------- //
// Ticking / alarm engine
// ---------------------------------------------------------------------- //
function tick() {
    const now = new Date();
    const clockEl = document.getElementById('liveClock');
    if (clockEl) clockEl.textContent = L.formatTime(now, DB.getSettings().timeFormat === '24h');
    const cd = document.getElementById('countdownText');
    if (cd) {
        const alarms = DB.listAlarms();
        const nextInfo = L.nextOccurrenceAcrossAlarms(alarms, now);
        if (nextInfo) cd.textContent = L.computeCountdown(nextInfo.time, now).text + ' ' + t('fromNow');
    }
    if (State.activeRing) {
        const timeEl = document.getElementById('ringTime');
        if (timeEl) timeEl.textContent = L.formatTime(now, DB.getSettings().timeFormat === '24h');
        return;
    }
    checkAlarmsDue(65000);
    checkReminders(now);
    maybeManageWakeLock(now);
}

function checkAlarmsDue(lookbackMs) {
    if (State.activeRing) return;
    const now = new Date();
    const alarms = DB.listAlarms().filter(a => a.enabled);
    for (const alarm of alarms) {
        const prev = L.getNextOccurrence(alarm, new Date(now.getTime() - lookbackMs));
        if (!prev || prev > now) continue;
        const key = alarm.id + '_' + prev.getTime();
        if (firedOccurrences.has(key)) continue;
        firedOccurrences.set(key, true);
        fireAlarm(alarm, prev);
        return;
    }
}

const remindersFired = new Set();
function checkReminders(now) {
    const settings = DB.getSettings();
    if (!settings.alarmReminders || !('Notification' in window) || Notification.permission !== 'granted') return;
    const nextInfo = L.nextOccurrenceAcrossAlarms(DB.listAlarms(), now);
    if (!nextInfo) return;
    const minsAway = Math.round((nextInfo.time - now) / 60000);
    const key = nextInfo.time.getTime() + '_30';
    if (minsAway === 30 && !remindersFired.has(key)) {
        remindersFired.add(key);
        try { new Notification(t('appName'), { body: `${t('nextAlarm')}: ${L.formatTime(nextInfo.time, settings.timeFormat === '24h')} — 30 min` }); } catch (e) { /* ignore */ }
    }
}

async function maybeManageWakeLock(now) {
    if (!('wakeLock' in navigator)) return;
    const nextInfo = L.nextOccurrenceAcrossAlarms(DB.listAlarms(), now);
    const shouldHold = nextInfo && (nextInfo.time - now) < 5 * 60000;
    try {
        if (shouldHold && !State.wakeLock) State.wakeLock = await navigator.wakeLock.request('screen');
        if (!shouldHold && State.wakeLock) { State.wakeLock.release(); State.wakeLock = null; }
    } catch (e) { /* not available / denied — silently degrade */ }
}

function fireAlarm(alarm, occurrence, snoozeCount) {
    const tasks = (alarm.challenge && alarm.challenge.tasks && alarm.challenge.tasks.length) ? alarm.challenge.tasks.map(tsk => {
        if (tsk.type === 'song' && !tsk.correctSoundId) return Object.assign({}, tsk, { correctSoundId: alarm.soundId });
        return tsk;
    }) : null;
    const runner = tasks ? new Ch.ChallengeRunner(tasks) : null;
    State.activeRing = { alarm, scheduledAt: occurrence, snoozeCount: snoozeCount || 0, runner };
    playRingSound(alarm);
    haptic(alarm.vibration ? [300, 100, 300, 100, 300] : 0);
    maybeNotifyRinging(alarm);
    render();
}

async function playRingSound(alarm) {
    const custom = DB.listCustomSounds().find(s => s.id === alarm.soundId);
    let customUrl = null, startOffsetSec = 0;
    if (custom) {
        const blob = await DB.getCustomSoundBlob(alarm.soundId);
        if (blob) { customUrl = URL.createObjectURL(blob); startOffsetSec = custom.startOffsetSec || 0; }
    }
    // The ring may already have been dismissed/snoozed while the blob load
    // was in flight — don't start audio for an alarm that's no longer active.
    if (!State.activeRing || State.activeRing.alarm !== alarm) { if (customUrl) URL.revokeObjectURL(customUrl); return; }
    Sounds.engine.play(alarm.soundId, {
        volume01: L.clamp(alarm.volume, 0, 100) / 100,
        gradual: !!alarm.gradualVolume,
        loop: true,
        customDataUrl: customUrl,
        startOffsetSec
    });
}

function maybeNotifyRinging(alarm) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(t('ringWakeUp'), { body: alarm.label || L.formatTime(new Date(), true), requireInteraction: true }); } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------------- //
// Render
// ---------------------------------------------------------------------- //
function render() {
    applyTheme();
    const { path, params } = getRoute();
    document.querySelectorAll('[data-nav-link]').forEach(a => a.classList.toggle('active', a.dataset.navLink === path));
    const view = document.getElementById('view');
    view.innerHTML = renderView(path, params);
    view.classList.remove('view-enter');
    void view.offsetWidth; // force a reflow so the entrance animation replays every navigation
    view.classList.add('view-enter');
    bindViewEvents(path);
    renderRing();
    renderModal();
    window.scrollTo(0, 0);
}

function renderView(path, params) {
    switch (path) {
        case 'home': return viewHome();
        case 'alarms': return viewAlarms();
        case 'alarm-edit': return viewAlarmEdit();
        case 'sleep': return viewSleep();
        case 'routines': return viewRoutines();
        case 'stats': return viewStats();
        case 'calendar': return viewCalendar();
        case 'settings': return viewSettings();
        case 'profile': return viewProfile();
        case 'xp-history': return viewXpHistory();
        default: return viewHome();
    }
}

// ---------------------------------------------------------------------- //
// Home
// ---------------------------------------------------------------------- //
function viewHome() {
    const settings = DB.getSettings();
    const now = new Date();
    const alarms = DB.listAlarms();
    const nextInfo = L.nextOccurrenceAcrossAlarms(alarms, now);
    const logs = DB.listDayLogs();
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const rate = L.successRate(logs.slice(-14));
    const insights = L.generateCoachInsights(logs);
    const run = getTodayRoutineRun('morning');

    return `
    <div class="topbar-inline row" style="padding:0 0 4px">
      <div>
        <div class="greeting">${greetingFor(now, settings.userName)}</div>
      </div>
      <button class="icon-btn" onclick="navigate('settings')" aria-label="${esc(t('navSettings'))}">${icon('gear')}</button>
    </div>
    <div class="clock-big" id="liveClock">${L.formatTime(now, settings.timeFormat === '24h')}</div>
    <div class="date-line">${formatFullDate(now, window.I18N.getLang())}</div>

    ${nextInfo ? `
    <div class="card next-alarm-card">
      <div class="label">${t('nextAlarm')}</div>
      <div class="time">${L.formatTime(nextInfo.time, settings.timeFormat === '24h')}</div>
      <div class="countdown" id="countdownText">${L.computeCountdown(nextInfo.time, now).text} ${t('fromNow')}</div>
      ${nextInfo.alarm.label ? `<div class="countdown" style="margin-top:6px;opacity:.85">${esc(nextInfo.alarm.label)}</div>` : ''}
    </div>` : `
    <div class="card next-alarm-card empty">
      <div class="label">${t('noAlarmSet')}</div>
      <button class="btn btn-primary" style="margin-top:12px" onclick="goCreateAlarm()">${icon('plus')} ${t('createAlarm')}</button>
    </div>`}

    <div class="quick-actions">
      <button class="btn btn-primary" onclick="goCreateAlarm()">${icon('plus')} ${t('quickAdd')}</button>
      <button class="btn btn-secondary" onclick="navigate('sleep')">${icon('moon')} ${t('quickSleepMode')}</button>
    </div>

    ${settings.showXpOnHome !== false ? levelCardHTML() : ''}
    ${settings.showDailyQuests !== false ? dailyQuestsCardHTML(now) : ''}

    ${run ? `
    <div class="section-title">${t('morningProgress')}</div>
    <div class="card">
      <div class="progress-bar"><span style="width:${routineRunPct(run)}%"></span></div>
      <div class="row-sub" style="margin-top:8px">${routineRunPct(run)}%</div>
    </div>` : ''}

    <div class="section-title">${t('statsTitle')}</div>
    <div class="stat-grid">
      ${settings.showStreakOnHome !== false ? `<div class="card stat-tile fade-stagger" style="animation-delay:0ms"><div class="value">${flame()} ${streak.current}</div><div class="label">${t('streak')}</div></div>` : ''}
      <div class="card stat-tile fade-stagger" style="animation-delay:40ms"><div class="value">${rate == null ? '—' : rate + '%'}</div><div class="label">${t('successRate')}</div></div>
      <div class="card stat-tile fade-stagger" style="animation-delay:80ms"><div class="value">${DB.getTotalXp().toLocaleString()}</div><div class="label">${t('totalXp')}</div></div>
      <div class="card stat-tile fade-stagger" style="animation-delay:120ms"><div class="value">${alarms.filter(a => a.enabled).length}</div><div class="label">${t('navAlarms')}</div></div>
    </div>

    ${insights.length ? `
    <div class="section-title">${t('smartRecommendation')}</div>
    <div class="card suggestion-card"><div class="icon">💡</div><div>${esc(insights[0].text)}</div></div>` : ''}
  `;
}

function getTodayRoutineRun(type) {
    const today = L.isoDate(new Date());
    const routine = DB.listRoutines().find(r => r.type === type);
    if (!routine) return null;
    return DB.listRoutineRuns().find(r => r.routineId === routine.id && r.date === today) || null;
}
function routineRunPct(run) {
    if (!run || !run.stepStates || !run.stepStates.length) return 0;
    const done = run.stepStates.filter(s => s === 'done').length;
    return Math.round((done / run.stepStates.length) * 100);
}

// ---------------------------------------------------------------------- //
// Gamification: home-screen widgets. These render real, already-persisted
// XP/level/quest state — nothing here can itself grant XP (see
// grantXpForDismissal, the only place that does).
// ---------------------------------------------------------------------- //
function levelCardHTML() {
    const levelState = Gamify.computeLevelState(DB.getTotalXp());
    const rank = Gamify.rankForLevel(levelState.level);
    const dailyQuests = Gamify.evaluateDailyQuests(L.isoDate(new Date()), buildDailyQuestContext(L.isoDate(new Date())));
    const remainingQuests = dailyQuests.filter(q => !q.done).length;
    let hint;
    if (levelState.xpRemaining <= 100) hint = t('xpHintClose', { n: levelState.xpRemaining });
    else if (remainingQuests > 0 && remainingQuests <= 2) hint = t('xpHintQuestsLeft', { n: remainingQuests });
    else hint = t('xpHintProgressing');
    return `
    <div class="card level-card" onclick="navigate('profile')" style="--rank-color:${rank.color}">
      <div class="level-card-top">
        <div class="level-badge">${rank.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="level-number">${t('levelLabel')} ${levelState.level}</div>
          <div class="level-rank-name">${t(rank.nameKey)}</div>
        </div>
        ${icon('chevronDown', 'rot-90')}
      </div>
      <div class="xp-bar"><div class="xp-bar-fill" style="width:${levelState.progressPct}%"></div></div>
      <div class="level-card-sub">${levelState.xpIntoLevel.toLocaleString()} / ${levelState.xpForNext.toLocaleString()} XP · ${levelState.progressPct}%</div>
      <div class="level-card-hint">${esc(hint)}</div>
    </div>`;
}
function dailyQuestsCardHTML(now) {
    const dateIso = L.isoDate(now);
    const quests = Gamify.evaluateDailyQuests(dateIso, buildDailyQuestContext(dateIso));
    if (!quests.length) return '';
    return `
    <div class="section-title">${t('dailyQuests')}</div>
    <div class="card quests-card">
      ${quests.map(q => `<div class="quest-row ${q.done ? 'done' : ''}">
        <span class="quest-check">${q.done ? '✓' : '○'}</span>
        <span class="quest-title">${t(q.titleKey)}</span>
        <span class="quest-progress">${q.progress}/${q.target}</span>
      </div>`).join('')}
    </div>`;
}

// ---------------------------------------------------------------------- //
// Alarms list
// ---------------------------------------------------------------------- //
function viewAlarms() {
    const alarms = DB.listAlarms().sort((a, b) => a.time.localeCompare(b.time));
    const settings = DB.getSettings();
    if (!alarms.length) {
        return `<div class="section-title">${t('navAlarms')}</div>
      <div class="empty-state"><div class="emoji">⏰</div><h3>${t('noAlarms')}</h3><p>${t('createFirstAlarm')}</p>
      <button class="btn btn-primary" style="margin-top:16px" onclick="goCreateAlarm()">${icon('plus')} ${t('createAlarm')}</button></div>
      <button class="fab" onclick="goCreateAlarm()" aria-label="${esc(t('createAlarm'))}">${icon('plus')}</button>`;
    }
    return `
    <div class="section-title">${t('navAlarms')}</div>
    <div class="card" style="padding:4px 16px">
      ${alarms.map((a, i) => `
        <div class="alarm-item fade-stagger" style="animation-delay:${Math.min(i, 8) * 35}ms">
          <div class="time ${a.enabled ? '' : 'off'}" role="button" tabindex="0" onclick="goEditAlarm('${a.id}')">${L.formatTime(hhmmDate(a.time), settings.timeFormat === '24h')}</div>
          <div class="meta" onclick="goEditAlarm('${a.id}')">
            <div class="label">${esc(a.label || t('alarm'))}</div>
            <div class="days">${esc(daysSummary(a))}</div>
            <div class="chips">
              ${a.challenge && a.challenge.tasks && a.challenge.tasks.length ? `<span class="pill on">${a.challenge.tasks.map(tsk => challengeEmoji(tsk.type)).join(' ')}</span>` : ''}
              ${a.smartWindow && a.smartWindow.enabled ? `<span class="pill">🪟 ${t('smartAlarm')}</span>` : ''}
            </div>
          </div>
          <label class="switch"><input type="checkbox" ${a.enabled ? 'checked' : ''} onchange="toggleAlarmEnabled('${a.id}', this.checked)"><span class="track"><span class="thumb"></span></span></label>
        </div>
      `).join('')}
    </div>
    <button class="fab" onclick="goCreateAlarm()" aria-label="${esc(t('createAlarm'))}">${icon('plus')}</button>
  `;
}
function flame() { return '<span class="flame">🔥</span>'; }
function challengeEmoji(type) {
    return { math: '🧮', situps: '➕', sport: '🏃', memory: '🧠', qr: '📱', song: '🎵', swipe: '👉', tap: '👆', photo: '📸', typeSentence: '⌨️', typeSequence: '🔢' }[type] || '❓';
}
function toggleAlarmEnabled(id, enabled) { DB.updateAlarm(id, { enabled }); haptic(); render(); }

// ---------------------------------------------------------------------- //
// Alarm editor
// ---------------------------------------------------------------------- //
function newDraftAlarm() {
    const s = DB.getSettings();
    return { time: '07:00', days: L.daysArrayFromPreset('everyday'), onceDate: null, label: '', enabled: true,
        soundId: s.defaultSound, volume: 80, gradualVolume: true, vibration: s.defaultVibration,
        challenge: { tasks: [] }, smartWindow: { enabled: false, windowMinutes: 20 } };
}

function timePickerHTML(hhmm, use24h) {
    const { h, m } = L.parseHHMM(hhmm);
    const displayH = use24h ? h : (h % 12 === 0 ? 12 : h % 12);
    const period = h >= 12 ? 'PM' : 'AM';
    return `
    <div class="time-picker">
      <div class="tp-col">
        <button class="tp-btn" onclick="stepHour(1)" aria-label="+1 hour">${icon('chevronUp')}</button>
        <div class="tp-value" id="tpHour">${L.pad2(displayH)}</div>
        <button class="tp-btn" onclick="stepHour(-1)" aria-label="-1 hour">${icon('chevronDown')}</button>
      </div>
      <div class="tp-sep">:</div>
      <div class="tp-col">
        <button class="tp-btn" onclick="stepMinute(1)" aria-label="+1 minute">${icon('chevronUp')}</button>
        <div class="tp-value" id="tpMinute">${L.pad2(m)}</div>
        <button class="tp-btn" onclick="stepMinute(-1)" aria-label="-1 minute">${icon('chevronDown')}</button>
      </div>
      ${use24h ? '' : `<div class="tp-period">
        <button class="${period === 'AM' ? 'active' : ''}" onclick="setPeriod('AM')">AM</button>
        <button class="${period === 'PM' ? 'active' : ''}" onclick="setPeriod('PM')">PM</button>
      </div>`}
    </div>
    <div class="quick-time-row">
      <button onclick="quickAddMinutes(5)">${t('plus5')}</button>
      <button onclick="quickAddMinutes(10)">${t('plus10')}</button>
      <button onclick="quickAddMinutes(15)">${t('plus15')}</button>
    </div>`;
}
function stepHour(delta) { const { h, m } = L.parseHHMM(State.draftAlarm.time); State.draftAlarm.time = `${L.pad2((h + delta + 24) % 24)}:${L.pad2(m)}`; rerenderEditor(); }
function stepMinute(delta) { const { h, m } = L.parseHHMM(State.draftAlarm.time); let nm = m + delta, nh = h; if (nm > 59) { nm = 0; nh = (h + 1) % 24; } if (nm < 0) { nm = 59; nh = (h - 1 + 24) % 24; } State.draftAlarm.time = `${L.pad2(nh)}:${L.pad2(nm)}`; rerenderEditor(); }
function setPeriod(period) { const { h, m } = L.parseHHMM(State.draftAlarm.time); let nh = h % 12; if (period === 'PM') nh += 12; State.draftAlarm.time = `${L.pad2(nh)}:${L.pad2(m)}`; rerenderEditor(); }
function quickAddMinutes(n) { const { h, m } = L.parseHHMM(State.draftAlarm.time); const total = (h * 60 + m + n) % 1440; State.draftAlarm.time = `${L.pad2(Math.floor(total / 60))}:${L.pad2(total % 60)}`; rerenderEditor(); }
function rerenderEditor() { document.getElementById('view').innerHTML = viewAlarmEdit(); bindViewEvents('alarm-edit'); }

function setDaysPreset(preset) { State.draftAlarm.days = L.daysArrayFromPreset(preset); State.draftAlarm.onceDate = null; rerenderEditor(); }
function toggleDraftDay(d) {
    const days = new Set(State.draftAlarm.days);
    days.has(d) ? days.delete(d) : days.add(d);
    State.draftAlarm.days = Array.from(days).sort();
    rerenderEditor();
}

function viewAlarmEdit() {
    const a = State.draftAlarm;
    if (!a) { navigate('alarms'); return ''; }
    const settings = DB.getSettings();
    const preset = L.presetFromDaysArray(a.days);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return `
    <div class="modal-header">
      <button class="icon-btn" onclick="navigate('alarms')">${icon('close')}</button>
      <h2>${State.editingAlarmId ? t('edit') : t('createAlarm')}</h2>
      ${State.editingAlarmId ? `<button class="icon-btn" onclick="confirmDeleteAlarm('${State.editingAlarmId}')">${icon('trash')}</button>` : '<div style="width:42px"></div>'}
    </div>

    <div class="card">${timePickerHTML(a.time, settings.timeFormat === '24h')}</div>

    <div class="section-title">${t('repeat')}</div>
    <div class="card">
      <div class="preset-row">
        ${['everyday', 'weekdays', 'weekends', 'once'].map(p => `<button class="${preset === p ? 'active' : ''}" onclick="setDaysPreset('${p}')">${t(p)}</button>`).join('')}
      </div>
      <div class="day-picker" style="margin-top:14px">
        ${dayNames.map((k, i) => `<button class="${a.days.includes(i) ? 'on' : ''}" onclick="toggleDraftDay(${i})">${t(k)}</button>`).join('')}
      </div>
    </div>

    <div class="section-title">${t('labelAlarm')}</div>
    <div class="card"><input type="text" id="alarmLabelInput" placeholder="${esc(t('labelAlarm'))}" value="${esc(a.label)}" oninput="State.draftAlarm.label=this.value"></div>

    <div class="section-title">${t('sound')}</div>
    <div class="card row" style="cursor:pointer" onclick="openSoundPicker()">
      <div><div class="row-label">${esc(soundName(a.soundId))}</div><div class="row-sub">${t('preview')} · ${t('volume')} ${a.volume}%</div></div>
      ${icon('chevronDown', 'rot-90')}
    </div>
    <div class="card">
      <div class="field" style="margin-bottom:8px"><label>${t('volume')}</label><input type="range" min="10" max="100" value="${a.volume}" oninput="State.draftAlarm.volume=+this.value"></div>
      <div class="row"><div class="row-label">${t('gradualVolume')}</div>${switchHTML(a.gradualVolume, 'toggleDraft', 'gradualVolume')}</div>
      <div class="row"><div class="row-label">${t('vibration')}</div>${switchHTML(a.vibration, 'toggleDraft', 'vibration')}</div>
    </div>

    <div class="section-title">${t('smartAlarm')}</div>
    <div class="card">
      <div class="row"><div class="row-label">${t('smartAlarm')}</div>${switchHTML(a.smartWindow.enabled, 'toggleDraftSmart', 'enabled')}</div>
      <div class="row-sub">${t('smartAlarmDesc')}</div>
    </div>

    <div class="section-title">${t('howDismiss')}</div>
    <div class="card">
      <div class="safety-notice" style="margin-bottom:14px">⚠️ ${t('safetyNotice')}</div>
      <div class="preset-row" style="margin-bottom:14px">${Ch.PRESETS.map(p => `<button onclick="applyPreset('${p.id}')">${p.icon} ${t(p.nameKey)}</button>`).join('')}</div>
      <div class="challenge-grid">
        ${challengeTypeCards(a)}
      </div>
      ${a.challenge.tasks.length ? `
      <div class="section-title">${t('challengeBuilder')}</div>
      <div class="builder-list">${a.challenge.tasks.map((tsk, i) => builderStepHTML(tsk, i, a.challenge.tasks.length)).join('')}</div>` : ''}
    </div>

    <button class="btn btn-primary btn-block btn-lg" style="margin-top:20px" onclick="saveAlarm()">${t('save')}</button>
  `;
}
function switchHTML(checked, fnName, field) {
    return `<label class="switch"><input type="checkbox" ${checked ? 'checked' : ''} onchange="${fnName}('${field}', this.checked)"><span class="track"><span class="thumb"></span></span></label>`;
}
function toggleDraft(field, val) { State.draftAlarm[field] = val; rerenderEditor(); }
function toggleDraftSmart(field, val) { State.draftAlarm.smartWindow[field] = val; rerenderEditor(); }

function challengeTypeCards(a) {
    const active = new Set(a.challenge.tasks.map(tsk => tsk.type));
    const order = ['tap', 'sport', 'situps', 'math', 'music', 'memory', 'qr', 'swipe', 'photo', 'typeSentence', 'typeSequence'];
    const meta = {
        tap: ['👆', 'dismissNormal'], sport: ['🏃', 'dismissSport'], situps: ['➕', 'dismissSitups'],
        math: ['🧮', 'dismissMath'], music: ['🎵', 'dismissMusic'], memory: ['🧠', 'dismissMemory'],
        qr: ['📱', 'dismissQr'], swipe: ['👉', 'dismissSwipe'],
        photo: ['📸', 'dismissPhoto'], typeSentence: ['⌨️', 'dismissTypeSentence'], typeSequence: ['🔢', 'dismissTypeSequence']
    };
    return order.map(type => {
        const realType = type === 'music' ? 'song' : type;
        const [emoji, labelKey] = meta[type];
        const selected = active.has(realType);
        return `<button class="challenge-card ${selected ? 'selected' : ''}" onclick="toggleChallengeType('${realType}')">
      <span class="emoji">${emoji}</span><span class="name">${t(labelKey)}</span>
    </button>`;
    }).join('');
}

function toggleChallengeType(type) {
    const tasks = State.draftAlarm.challenge.tasks;
    const idx = tasks.findIndex(tsk => tsk.type === type);
    if (idx > -1) { tasks.splice(idx, 1); rerenderEditor(); return; }
    if (type === 'tap') { tasks.push({ type: 'tap' }); rerenderEditor(); return; }
    if (type === 'swipe') { tasks.push({ type: 'swipe' }); rerenderEditor(); return; }
    if (type === 'song') { tasks.push({ type: 'song' }); rerenderEditor(); return; }
    if (type === 'qr') { openQrTaskPicker(); return; }
    if (type === 'math') { tasks.push({ type: 'math', difficulty: 2, count: 5 }); rerenderEditor(); return; }
    if (type === 'memory') { tasks.push({ type: 'memory', level: 'medium' }); rerenderEditor(); return; }
    if (type === 'situps') { tasks.push({ type: 'situps', count: 20, situpMode: 'full', useCamera: Pose.supportsPoseCamera() }); rerenderEditor(); return; }
    if (type === 'sport') { tasks.push({ type: 'sport', activity: 'squats', count: 10, useCamera: Pose.supportsPoseCamera() }); rerenderEditor(); return; }
    if (type === 'photo') { tasks.push({ type: 'photo', instructions: '' }); rerenderEditor(); configureTask(tasks.length - 1); return; }
    if (type === 'typeSentence') { tasks.push({ type: 'typeSentence', sentence: '' }); rerenderEditor(); configureTask(tasks.length - 1); return; }
    if (type === 'typeSequence') { tasks.push({ type: 'typeSequence', length: 6, charset: 'digits' }); rerenderEditor(); return; }
}

/** Which pose.js exercise id (if any) a sport/situps task maps to. null = no camera tracking implemented for this activity. */
function exerciseIdForTask(tsk) {
    if (tsk.type === 'situps') return tsk.situpMode === 'crunch' ? 'situp_crunch' : 'situp_full';
    if (tsk.type === 'sport') {
        if (tsk.activity === 'squats') return 'squat';
        if (tsk.activity === 'pushups') return 'pushup';
        if (tsk.activity === 'pullups') return 'pullup';
        return null; // jumpingjacks/walk have no joint-angle rep pattern implemented
    }
    return null;
}

function applyPreset(presetId) {
    const preset = Ch.PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    State.draftAlarm.challenge.tasks = preset.tasks.filter(tsk => tsk.type !== 'qr' || DB.listQrChallenges().length)
        .map(tsk => tsk.type === 'qr' ? Object.assign({}, tsk, { qrChallengeId: DB.listQrChallenges()[0].id, expectedCode: DB.listQrChallenges()[0].code }) : Object.assign({}, tsk));
    rerenderEditor();
    if (preset.tasks.some(tsk => tsk.type === 'qr') && !DB.listQrChallenges().length) toast('Create a QR tag first (in the QR step) to use presets with QR.');
}

function builderStepHTML(tsk, i, total) {
    const emoji = challengeEmoji(tsk.type === 'song' ? 'song' : tsk.type);
    const sub = builderStepSub(tsk);
    return `<div class="builder-step">
    <div class="num">${i + 1}</div>
    <div style="font-size:20px">${emoji}</div>
    <div style="flex:1"><div class="title">${t(({ math: 'dismissMath', memory: 'dismissMemory', situps: 'dismissSitups', sport: 'dismissSport', song: 'dismissMusic', qr: 'dismissQr', swipe: 'dismissSwipe', tap: 'dismissNormal', photo: 'dismissPhoto', typeSentence: 'dismissTypeSentence', typeSequence: 'dismissTypeSequence' })[tsk.type])}</div><div class="sub">${esc(sub)}</div></div>
    <div class="actions">
      ${needsConfig(tsk.type) ? `<button onclick="configureTask(${i})" aria-label="${esc(t('edit'))}">${icon('edit')}</button>` : ''}
      <button onclick="moveTask(${i},-1)" ${i === 0 ? 'disabled' : ''} aria-label="up">${icon('chevronUp')}</button>
      <button onclick="moveTask(${i},1)" ${i === total - 1 ? 'disabled' : ''} aria-label="down">${icon('chevronDown')}</button>
      <button onclick="removeTaskAt(${i})" aria-label="${esc(t('delete'))}">${icon('close')}</button>
    </div>
  </div>`;
}
function needsConfig(type) { return ['math', 'memory', 'situps', 'sport', 'qr', 'photo', 'typeSentence', 'typeSequence'].includes(type); }
function mathLevelLabel(difficulty) {
    if (difficulty === 'custom') return t('custom');
    if (typeof difficulty === 'number' || /^[1-5]$/.test(String(difficulty))) return `${t('level')} ${difficulty}`;
    return t(difficulty); // legacy easy/medium/hard
}
function builderStepSub(tsk) {
    const backupSuffix = tsk.backup ? ` · ${t('backupConfigured')}` : '';
    if (tsk.type === 'math') {
        const diffLabel = tsk.difficulty === 'custom' ? `${t('custom')} (${(tsk.operators || []).join(' ')})` : mathLevelLabel(tsk.difficulty);
        return `${diffLabel} · ${tsk.count} ${t('questionsCount').toLowerCase()}`;
    }
    if (tsk.type === 'memory') return t(tsk.level);
    if (tsk.type === 'situps') return `${tsk.count} ${tsk.situpMode === 'crunch' ? t('situpModeCrunch') : t('situpModeFull')}${exerciseIdForTask(tsk) && tsk.useCamera !== false ? ' 📷' : ''}${backupSuffix}`;
    if (tsk.type === 'sport') return `${tsk.count} ${tsk.activity === 'pullups' ? t('activityPullups') : tsk.activity}${exerciseIdForTask(tsk) && tsk.useCamera !== false ? ' 📷' : ''}${backupSuffix}`;
    if (tsk.type === 'qr') return tsk.qrName || 'Choose a tag';
    if (tsk.type === 'photo') return `${tsk.instructions ? esc(tsk.instructions) : t('photoNoInstructions')}${backupSuffix}`;
    if (tsk.type === 'typeSentence') return tsk.sentence ? `"${tsk.sentence.slice(0, 40)}${tsk.sentence.length > 40 ? '…' : ''}"` : t('typeSentenceNoText');
    if (tsk.type === 'typeSequence') return `${tsk.length || 6} ${t('characters')} · ${tsk.charset === 'alnum' ? t('charsetAlnum') : t('charsetDigits')}`;
    return '';
}
function moveTask(i, dir) {
    const tasks = State.draftAlarm.challenge.tasks;
    const j = i + dir;
    if (j < 0 || j >= tasks.length) return;
    [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
    rerenderEditor();
}
function removeTaskAt(i) { State.draftAlarm.challenge.tasks.splice(i, 1); rerenderEditor(); }

function configureTask(i) {
    const tsk = State.draftAlarm.challenge.tasks[i];
    if (tsk.type === 'math') {
        if (!tsk.operators || !tsk.operators.length) tsk.operators = ['+', '-'];
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissMath')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('difficulty')}</label><div class="preset-row">${[1, 2, 3, 4, 5, 'custom'].map(d => `<button class="${tsk.difficulty === d ? 'active' : ''}" onclick="setTaskField(${i},'difficulty',${d === 'custom' ? "'custom'" : d})">${d === 'custom' ? t('custom') : `${t('level')} ${d}`}</button>`).join('')}</div>
        ${tsk.difficulty !== 'custom' ? `<div class="row-sub" style="margin-top:6px">${t('mathLevelDesc_' + (tsk.difficulty || 1))}</div>` : ''}</div>
      ${tsk.difficulty === 'custom' ? `<div class="field"><label>+ − × ÷</label><div class="preset-row">${['+', '-', '×', '÷'].map(op => `<button class="${tsk.operators.includes(op) ? 'active' : ''}" onclick="toggleMathOperator(${i},'${op}')">${op}</button>`).join('')}</div></div>` : ''}
      <div class="field"><label>${t('questionsCount')}</label><div class="preset-row">${[1, 3, 5, 10, 20].map(n => `<button class="${tsk.count === n ? 'active' : ''}" onclick="setTaskField(${i},'count',${n})">${n}</button>`).join('')}</div></div>
      <div class="field"><label>${t('maxMistakes')}</label><div class="preset-row">${[null, 1, 2, 3, 5].map(n => `<button class="${(tsk.maxMistakes || null) === n ? 'active' : ''}" onclick="setTaskField(${i},'maxMistakes',${n === null ? 'null' : n})">${n === null ? '∞' : n}</button>`).join('')}</div></div>
      <div class="field"><label>${t('timePerQuestion')}</label><div class="preset-row">${[null, 10, 20, 30].map(n => `<button class="${(tsk.timeLimitSec || null) === n ? 'active' : ''}" onclick="setTaskField(${i},'timeLimitSec',${n === null ? 'null' : n})">${n === null ? '∞' : n + 's'}</button>`).join('')}</div></div>
      <div class="row"><div><div class="row-label">${t('allowHints')}</div><div class="row-sub">${t('allowHintsHint')}</div></div>${switchHTML(!!tsk.allowHints, 'setTaskFieldBool', i + ':allowHints')}</div>
      <div class="row"><div><div class="row-label">${t('repeatWrongQuestion')}</div><div class="row-sub">${t('repeatWrongQuestionHint')}</div></div>${switchHTML(!!tsk.repeatWrongQuestion, 'setTaskFieldBool', i + ':repeatWrongQuestion')}</div>
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    } else if (tsk.type === 'memory') {
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissMemory')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('difficulty')}</label><div class="preset-row">${['easy', 'medium', 'hard', 'extreme'].map(d => `<button class="${tsk.level === d ? 'active' : ''}" onclick="setTaskField(${i},'level','${d}')">${t(d)}</button>`).join('')}</div></div>
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    } else if (tsk.type === 'situps') {
        if (!tsk.situpMode) tsk.situpMode = 'full';
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissSitups')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('dismissSitups')}</label><div class="preset-row">
        <button class="${tsk.situpMode !== 'crunch' ? 'active' : ''}" onclick="setTaskField(${i},'situpMode','full')">${t('situpModeFull')}</button>
        <button class="${tsk.situpMode === 'crunch' ? 'active' : ''}" onclick="setTaskField(${i},'situpMode','crunch')">${t('situpModeCrunch')}</button>
      </div></div>
      <div class="field"><label>${t('reps')}</label><div class="preset-row">${Ch.SITUP_COUNTS.map(n => `<button class="${tsk.count === n ? 'active' : ''}" onclick="setTaskField(${i},'count',${n})">${n}</button>`).join('')}</div>
        ${customCountInputHTML(i, tsk.count)}</div>
      ${cameraToggleHTML(i, tsk)}
      ${backupTaskHTML(i, tsk)}
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    } else if (tsk.type === 'sport') {
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissSport')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>Activity</label><div class="preset-row">${['squats', 'pushups', 'pullups', 'jumpingjacks', 'walk'].map(act => `<button class="${tsk.activity === act ? 'active' : ''}" onclick="setTaskField(${i},'activity','${act}')">${act === 'pullups' ? t('activityPullups') : act}</button>`).join('')}</div></div>
      <div class="field"><label>${t('reps')}</label><div class="preset-row">${[5, 10, 15, 20, 30].map(n => `<button class="${tsk.count === n ? 'active' : ''}" onclick="setTaskField(${i},'count',${n})">${n}</button>`).join('')}</div>
        ${customCountInputHTML(i, tsk.count)}</div>
      ${cameraToggleHTML(i, tsk)}
      ${backupTaskHTML(i, tsk)}
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    } else if (tsk.type === 'qr') {
        openQrTaskPicker(i);
    } else if (tsk.type === 'photo') {
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissPhoto')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <p class="row-sub">${t('photoInstructionsHint')}</p>
      <div class="field"><label>${t('instructions')}</label>
        <input type="text" value="${esc(tsk.instructions || '')}" placeholder="${esc(t('photoInstructionsPlaceholder'))}"
        style="width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:15px"
        onchange="setTaskField(${i},'instructions', this.value)"></div>
      <div class="safety-notice" style="margin-top:4px">⚠️ ${t('photoLivenessOnly')}</div>
      ${backupTaskHTML(i, tsk)}
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    } else if (tsk.type === 'typeSentence') {
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissTypeSentence')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('sentenceToType')}</label>
        <textarea rows="3" placeholder="${esc(t('sentenceToTypePlaceholder'))}"
        style="width:100%;padding:13px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:15px;resize:vertical"
        onchange="setTaskField(${i},'sentence', this.value)">${esc(tsk.sentence || '')}</textarea></div>
      <button class="btn btn-primary btn-block" onclick="closeModal()" ${tsk.sentence ? '' : 'disabled'}>${t('done')}</button>`);
    } else if (tsk.type === 'typeSequence') {
        openModal(() => `
      <div class="modal-header"><h2>${t('dismissTypeSequence')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('sequenceLength')}</label><div class="preset-row">${[4, 6, 8, 10].map(n => `<button class="${(tsk.length || 6) === n ? 'active' : ''}" onclick="setTaskField(${i},'length',${n})">${n}</button>`).join('')}</div></div>
      <div class="field"><label>${t('characters')}</label><div class="preset-row">
        <button class="${(tsk.charset || 'digits') === 'digits' ? 'active' : ''}" onclick="setTaskField(${i},'charset','digits')">${t('charsetDigits')}</button>
        <button class="${tsk.charset === 'alnum' ? 'active' : ''}" onclick="setTaskField(${i},'charset','alnum')">${t('charsetAlnum')}</button>
      </div></div>
      <button class="btn btn-primary btn-block" onclick="closeModal()">${t('done')}</button>`);
    }
}
function backupTaskHTML(i, tsk) {
    const kind = !tsk.backup ? 'none' : (tsk.backup.type === 'math' ? 'math' : 'tap');
    return `<div class="field"><label>${t('backupChallenge')}</label><div class="row-sub" style="margin-bottom:8px">${t('backupChallengeHint')}</div>
      <div class="preset-row">
        <button class="${kind === 'none' ? 'active' : ''}" onclick="setTaskBackup(${i},'none')">${t('none')}</button>
        <button class="${kind === 'math' ? 'active' : ''}" onclick="setTaskBackup(${i},'math')">${t('dismissMath')}</button>
        <button class="${kind === 'tap' ? 'active' : ''}" onclick="setTaskBackup(${i},'tap')">${t('dismissNormal')}</button>
      </div></div>`;
}
function setTaskBackup(i, kind) {
    const backups = { none: null, math: { type: 'math', difficulty: 1, count: 3 }, tap: { type: 'tap' } };
    setTaskField(i, 'backup', backups[kind]);
}
function setTaskField(i, field, value) { State.draftAlarm.challenge.tasks[i][field] = value; rerenderEditor(); openModal(currentModalRenderer); }
function customCountInputHTML(i, currentCount) {
    return `<div style="margin-top:8px"><input type="number" min="1" max="500" value="${currentCount}" placeholder="${esc(t('custom'))}"
    style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:15px"
    onchange="setCustomCount(${i}, this.value)"></div>`;
}
function setCustomCount(i, value) {
    const n = Math.max(1, Math.min(500, Math.round(+value) || 1));
    setTaskField(i, 'count', n);
}
function cameraToggleHTML(i, tsk) {
    const exerciseId = exerciseIdForTask(tsk);
    if (!exerciseId) return `<p class="row-sub">${esc(tsk.activity || '')} ${t('useCameraVerify')}: ${t('cameraErrorUnsupported')}</p>`;
    if (!Pose.supportsPoseCamera()) return `<p class="row-sub">${t('cameraErrorUnsupported')}</p>`;
    return `<div class="row" style="margin-top:6px"><div><div class="row-label">${t('useCameraVerify')}</div><div class="row-sub">${t('useCameraVerifyHint')}</div></div>${switchHTML(tsk.useCamera !== false, 'setTaskFieldBool', i + ':useCamera')}</div>`;
}
function setTaskFieldBool(encoded, value) {
    const [iStr, field] = encoded.split(':');
    setTaskField(+iStr, field, value);
}
function toggleMathOperator(i, op) {
    const tsk = State.draftAlarm.challenge.tasks[i];
    const idx = tsk.operators.indexOf(op);
    if (idx > -1) { if (tsk.operators.length > 1) tsk.operators.splice(idx, 1); }
    else tsk.operators.push(op);
    rerenderEditor(); openModal(currentModalRenderer);
}

function saveAlarm() {
    const a = State.draftAlarm;
    if (!a.days.length) a.onceDate = a.onceDate || L.isoDate(new Date());
    if (State.editingAlarmId) DB.updateAlarm(State.editingAlarmId, a);
    else DB.createAlarm(a);
    ensureNotificationPermissionPrompted();
    toast(t('save') + ' ✓');
    navigate('alarms');
}
function confirmDeleteAlarm(id) {
    openModal(() => `
    <div class="modal-header"><h2>${t('confirmDeleteAlarm')}</h2></div>
    <div class="row" style="gap:10px">
      <button class="btn btn-secondary btn-block" onclick="closeModal()">${t('cancel')}</button>
      <button class="btn btn-danger btn-block" onclick="DB.deleteAlarm('${id}'); closeModal(); navigate('alarms'); toast('${esc(t('delete'))} ✓')">${t('delete')}</button>
    </div>`);
}

// ---------------------------------------------------------------------- //
// Sound picker modal
// ---------------------------------------------------------------------- //
function openSoundPicker() {
    openModal(() => {
        const favs = new Set(DB.getFavoriteSounds());
        const recents = DB.getRecentSounds();
        const custom = DB.listCustomSounds();
        const cats = Sounds.CATEGORIES;
        return `
      <div class="modal-header"><h2>${t('sound')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      <div class="field"><label>${t('uploadSound')}</label><input type="file" accept="audio/*" onchange="handleSoundUpload(event)">
        <div class="row-sub" style="margin-top:6px">${t('uploadSoundHint')}</div></div>
      ${custom.length ? `<div class="section-title">${t('soundsCustom')}</div>${custom.map(s => soundRowHTML(s.id, s.name, favs, s)).join('')}` : ''}
      ${recents.length ? `<div class="section-title">${t('recentlyUsed')}</div>${recents.map(id => soundRowHTML(id, soundName(id), favs)).join('')}` : ''}
      ${cats.map(cat => `<div class="section-title">${t('sounds' + cat[0].toUpperCase() + cat.slice(1))}</div>${Sounds.byCategory(cat).map(s => soundRowHTML(s.id, s.name, favs)).join('')}`).join('')}
    `;
    });
}
function formatSeconds(sec) { sec = Math.max(0, Math.round(sec || 0)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function soundRowHTML(id, name, favs, custom) {
    const selected = State.draftAlarm.soundId === id;
    const sub = custom && custom.durationSec ? `${formatSeconds(custom.durationSec)}${custom.startOffsetSec ? ' · ' + t('startPoint').toLowerCase() + ' ' + formatSeconds(custom.startOffsetSec) : ''}` : '';
    return `<div class="sound-row ${selected ? 'selected' : ''}">
    <button class="play-btn" onclick="previewSound('${id}', this)" aria-label="${esc(t('preview'))}">▶</button>
    <div class="name" onclick="selectSound('${id}')">${esc(name)}${sub ? `<div class="row-sub" style="margin-top:2px">${esc(sub)}</div>` : ''}</div>
    <button class="star ${favs.has(id) ? 'fav' : ''}" onclick="event.stopPropagation(); toggleFav('${id}')">★</button>
    ${custom ? `<button class="star" onclick="event.stopPropagation(); openTrimSoundModal('${id}')" aria-label="${esc(t('setStartPoint'))}">✂️</button>` : ''}
    ${custom ? `<button class="star" onclick="event.stopPropagation(); DB.deleteCustomSound('${id}'); openSoundPicker()">${icon('trash')}</button>` : ''}
  </div>`;
}
async function previewSound(id, btnEl) {
    const custom = DB.listCustomSounds().find(s => s.id === id);
    if (custom) {
        if (btnEl) btnEl.innerHTML = '<span class="spinner"></span>';
        const blob = await DB.getCustomSoundBlob(id);
        if (btnEl) btnEl.textContent = '▶';
        if (!blob) { toast(t('couldNotSaveFile')); return; }
        const url = URL.createObjectURL(blob);
        const el = new Audio(url);
        el.volume = 0.6;
        el.addEventListener('loadedmetadata', () => { try { el.currentTime = custom.startOffsetSec || 0; } catch (e) { /* ignore */ } }, { once: true });
        el.play().catch(() => {});
        setTimeout(() => { el.pause(); URL.revokeObjectURL(url); }, 2200);
        return;
    }
    Sounds.engine.preview(id);
}
function selectSound(id) { State.draftAlarm.soundId = id; DB.pushRecentSound(id); closeModal(); rerenderEditor(); }
function toggleFav(id) { DB.toggleFavoriteSound(id); openModal(currentModalRenderer); }
function probeAudioDuration(file) {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const probe = new Audio(url);
        const done = sec => { URL.revokeObjectURL(url); resolve(sec); };
        probe.addEventListener('loadedmetadata', () => done(isFinite(probe.duration) ? probe.duration : null));
        probe.addEventListener('error', () => done(null));
    });
}
async function handleSoundUpload(evt) {
    const file = evt.target.files[0];
    evt.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('audio/')) { toast(t('chooseAudioFile')); return; }
    if (file.size > 15 * 1024 * 1024) { toast(t('fileTooLarge')); return; }
    try {
        const durationSec = await probeAudioDuration(file);
        await DB.addCustomSound({ name: file.name.replace(/\.[^.]+$/, ''), blob: file, durationSec });
        openSoundPicker();
        toast(t('uploadSound') + ' ✓');
    } catch (e) { toast(t('couldNotSaveFile')); }
}
let trimObjectUrl = null;
async function openTrimSoundModal(soundId) {
    const meta = DB.listCustomSounds().find(s => s.id === soundId);
    if (!meta) return;
    const blob = await DB.getCustomSoundBlob(soundId);
    if (!blob) { toast(t('couldNotSaveFile')); return; }
    if (trimObjectUrl) { URL.revokeObjectURL(trimObjectUrl); }
    trimObjectUrl = URL.createObjectURL(blob);
    openModal(() => `
    <div class="modal-header"><h2>${esc(meta.name)}</h2><button class="icon-btn" onclick="closeTrimModal()">${icon('close')}</button></div>
    <audio id="trimAudio" controls style="width:100%" src="${trimObjectUrl}"></audio>
    <p class="row-sub" style="margin:12px 0">${t('setStartPointHint')}</p>
    <div class="row-sub" id="trimCurrentStart" style="font-weight:700">${t('startPoint')}: ${formatSeconds(meta.startOffsetSec || 0)}</div>
    <button class="btn btn-secondary btn-block" style="margin-top:12px" onclick="useCurrentAsStart('${soundId}')">${t('useCurrentPosition')}</button>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="closeTrimModal()">${t('done')}</button>
  `);
}
function closeTrimModal() {
    if (trimObjectUrl) { URL.revokeObjectURL(trimObjectUrl); trimObjectUrl = null; }
    closeModal();
    openSoundPicker();
}
function useCurrentAsStart(soundId) {
    const audioEl = document.getElementById('trimAudio');
    if (!audioEl) return;
    const sec = Math.floor(audioEl.currentTime);
    DB.updateCustomSoundMeta(soundId, { startOffsetSec: sec });
    const label = document.getElementById('trimCurrentStart');
    if (label) label.textContent = `${t('startPoint')}: ${formatSeconds(sec)}`;
    haptic(15);
}

// ---------------------------------------------------------------------- //
// QR challenge management
// ---------------------------------------------------------------------- //
function openQrTaskPicker(taskIndex) {
    openModal(() => {
        const tags = DB.listQrChallenges();
        return `
      <div class="modal-header"><h2>${t('dismissQr')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
      ${tags.length ? tags.map(qr => `
        <div class="row" style="cursor:pointer" onclick="chooseQrTag('${qr.id}', ${taskIndex == null ? 'null' : taskIndex})">
          <div class="row-label">${icon('alarm')} ${esc(qr.name)}</div>
          <button class="star" onclick="event.stopPropagation(); DB.deleteQrChallenge('${qr.id}'); openQrTaskPicker(${taskIndex == null ? 'null' : taskIndex})">${icon('trash')}</button>
        </div>`).join('') : `<p class="row-sub">${t('createQrChallenge')}</p>`}
      <button class="btn btn-secondary btn-block" style="margin-top:14px" onclick="openQrRegisterFlow(${taskIndex == null ? 'null' : taskIndex})">${icon('plus')} ${t('createQrChallenge')}</button>
    `;
    });
}
function chooseQrTag(qrId, taskIndex) {
    const qr = DB.listQrChallenges().find(q => q.id === qrId);
    if (!qr) return;
    const task = { type: 'qr', qrChallengeId: qr.id, qrName: qr.name, expectedCode: qr.code };
    if (taskIndex == null) State.draftAlarm.challenge.tasks.push(task);
    else State.draftAlarm.challenge.tasks[taskIndex] = task;
    closeModal(); rerenderEditor();
}
function openQrRegisterFlow(taskIndex, forceManual) {
    const supported = !forceManual && Ch.supportsBarcodeDetector() && Ch.supportsCamera();
    openModal(() => `
    <div class="modal-header"><h2>${t('createQrChallenge')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
    <div class="field"><label>${t('qrName')}</label><input type="text" id="qrNameInput" placeholder="Bathroom mirror"></div>
    ${supported ? `
      <div class="qr-video-wrap" style="aspect-ratio:4/3"><video id="registerVideo" playsinline autoplay muted></video></div>
      <p class="row-sub" style="margin:10px 0">Point the camera at any QR code you already have (or generate one free online, print it, and place it where you want).</p>
      <div id="registerStatus" class="row-sub"></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="saveRegisteredQr(${taskIndex == null ? 'null' : taskIndex})" id="registerSaveBtn" disabled>${t('save')}</button>
      <button class="btn btn-ghost btn-block" onclick="openQrRegisterFlow(${taskIndex == null ? 'null' : taskIndex}, true)">${t('qrManualCode')}</button>
    ` : `
      <p class="row-sub">${t('qrNotSupported')}</p>
      <div class="field"><label>${t('qrManualCode')}</label><input type="text" id="qrManualCodeInput" placeholder="A private phrase only you know"></div>
      <button class="btn btn-primary btn-block" onclick="saveManualQr(${taskIndex == null ? 'null' : taskIndex})">${t('save')}</button>
    `}
  `);
    if (supported) setTimeout(() => startRegisterScanner(taskIndex), 50);
}
let registerCaptured = null;
async function startRegisterScanner(taskIndex) {
    registerCaptured = null;
    const video = document.getElementById('registerVideo');
    if (!video) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        State.qrStream = stream;
        video.srcObject = stream;
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const poll = async () => {
            if (!document.getElementById('registerVideo')) { stopQrStream(); return; }
            try {
                const codes = await detector.detect(video);
                if (codes.length) {
                    registerCaptured = codes[0].rawValue;
                    document.getElementById('registerStatus').innerHTML = `<span class="badge badge-success">✓ Captured</span>`;
                    document.getElementById('registerSaveBtn').disabled = false;
                }
            } catch (e) { /* keep trying */ }
            if (document.getElementById('registerVideo')) requestAnimationFrame(poll);
        };
        poll();
    } catch (e) {
        const nameEntered = (document.getElementById('qrNameInput') || {}).value || '';
        openQrRegisterFlow(taskIndex, true);
        setTimeout(() => { const el = document.getElementById('qrNameInput'); if (el) el.value = nameEntered; }, 0);
        toast(t('permissionNeeded'));
    }
}
function stopQrStream() { if (State.qrStream) { State.qrStream.getTracks().forEach(tr => tr.stop()); State.qrStream = null; } }
function saveRegisteredQr(taskIndex) {
    const name = document.getElementById('qrNameInput').value.trim() || 'QR tag';
    if (!registerCaptured) return;
    const qr = DB.createQrChallenge({ name, code: registerCaptured });
    stopQrStream();
    chooseQrTag(qr.id, taskIndex);
}
function saveManualQr(taskIndex) {
    const name = document.getElementById('qrNameInput').value.trim() || 'QR tag';
    const code = document.getElementById('qrManualCodeInput').value.trim();
    if (!code) { toast('Enter a code'); return; }
    const qr = DB.createQrChallenge({ name, code });
    chooseQrTag(qr.id, taskIndex);
}

// ---------------------------------------------------------------------- //
// Sleep mode
// ---------------------------------------------------------------------- //
function viewSleep() {
    const settings = DB.getSettings();
    if (!State.sleepWake) State.sleepWake = (settings.sleepPlan && settings.sleepPlan.wakeTime) || '07:00';
    const recs = L.recommendedBedtimes(State.sleepWake);
    return `
    <div class="section-title">${t('sleepModeTitle')}</div>
    <div class="card">
      <div class="field" style="margin-bottom:4px"><label>${t('wakeUpAt')}</label></div>
      ${timePickerHTML(State.sleepWake, settings.timeFormat === '24h').replace(/stepHour\((-?1)\)/g, 'stepSleepHour($1)').replace(/stepMinute\((-?1)\)/g, 'stepSleepMinute($1)').replace(/setPeriod\('(AM|PM)'\)/g, "setSleepPeriod('$1')").replace(/quickAddMinutes\((\d+)\)/g, 'quickAddSleepMinutes($1)')}
    </div>
    <div class="section-title">${t('recommendedBedtime')}</div>
    ${recs.map(r => `
      <div class="card row">
        <div><div class="row-label">${r.time}</div><div class="row-sub">${r.sleepHours}h · ${r.cycles} sleep cycles</div></div>
        <button class="btn btn-secondary" onclick="startSleepModeWith('${r.time}')">${t('startSleepMode')}</button>
      </div>`).join('')}
    <div class="card" style="margin-top:14px"><p class="row-sub">${t('sleepDisclaimer')}</p></div>
  `;
}
function stepSleepHour(d) { const { h, m } = L.parseHHMM(State.sleepWake); State.sleepWake = `${L.pad2((h + d + 24) % 24)}:${L.pad2(m)}`; rerenderSleep(); }
function stepSleepMinute(d) { const { h, m } = L.parseHHMM(State.sleepWake); let nm = m + d, nh = h; if (nm > 59) { nm = 0; nh = (h + 1) % 24; } if (nm < 0) { nm = 59; nh = (h - 1 + 24) % 24; } State.sleepWake = `${L.pad2(nh)}:${L.pad2(nm)}`; rerenderSleep(); }
function setSleepPeriod(period) { const { h, m } = L.parseHHMM(State.sleepWake); let nh = h % 12; if (period === 'PM') nh += 12; State.sleepWake = `${L.pad2(nh)}:${L.pad2(m)}`; rerenderSleep(); }
function quickAddSleepMinutes(n) { const { h, m } = L.parseHHMM(State.sleepWake); const total = (h * 60 + m + n) % 1440; State.sleepWake = `${L.pad2(Math.floor(total / 60))}:${L.pad2(total % 60)}`; rerenderSleep(); }
function rerenderSleep() { document.getElementById('view').innerHTML = viewSleep(); }
function startSleepModeWith(bedtime) {
    DB.updateSettings({ sleepPlan: { wakeTime: State.sleepWake, bedtime, createdAt: new Date().toISOString() } });
    State.draftAlarm = Object.assign(newDraftAlarm(), { time: State.sleepWake, days: [], onceDate: L.isoDate(new Date()), label: 'Sleep mode wake-up' });
    State.editingAlarmId = null;
    toast(t('startSleepMode') + ' ✓');
    navigate('alarm-edit');
}

// ---------------------------------------------------------------------- //
// Routines
// ---------------------------------------------------------------------- //
function viewRoutines() {
    const routines = DB.listRoutines();
    if (State.routineRun) return renderRoutineRunView();
    return `
    <div class="section-title">${t('bedtimeRoutine')} / ${t('morningRoutine')}</div>
    ${routines.length ? routines.map(routineCardHTML).join('') : `<div class="empty-state"><div class="emoji">📋</div><h3>${t('noRoutinesYet')}</h3></div>`}
    <button class="btn btn-secondary btn-block" style="margin-top:14px" onclick="openRoutineEditor()">${icon('plus')} ${t('createRoutine')}</button>
  `;
}
function routineCardHTML(r) {
    const run = getTodayRoutineRun(r.type);
    return `<div class="card">
    <div class="row"><div class="row-label">${r.type === 'bedtime' ? '🌙' : '☀️'} ${esc(r.name)}</div>
      <div class="actions" style="display:flex;gap:6px">
        <button class="icon-btn" onclick="openRoutineEditor('${r.id}')">${icon('edit')}</button>
        <button class="icon-btn" onclick="DB.deleteRoutine('${r.id}'); render()">${icon('trash')}</button>
      </div>
    </div>
    ${run ? `<div class="progress-bar" style="margin:6px 0 10px"><span style="width:${routineRunPct(run)}%"></span></div>` : ''}
    <button class="btn btn-primary btn-block" onclick="startRoutine('${r.id}')">${t('startRoutine')}</button>
  </div>`;
}
function openRoutineEditor(routineId) {
    const existing = routineId ? DB.listRoutines().find(r => r.id === routineId) : null;
    State.routineDraft = existing ? JSON.parse(JSON.stringify(existing)) : { type: 'bedtime', name: '', steps: [] };
    openModal(renderRoutineEditorModal);
}
function renderRoutineEditorModal() {
    const r = State.routineDraft;
    return `
    <div class="modal-header"><h2>${r.id ? t('edit') : t('createRoutine')}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
    <div class="field"><label>${t('labelAlarm')}</label><input type="text" value="${esc(r.name)}" oninput="State.routineDraft.name=this.value"></div>
    <div class="field"><label>Type</label><div class="preset-row">
      <button class="${r.type === 'bedtime' ? 'active' : ''}" onclick="State.routineDraft.type='bedtime'; openModal(renderRoutineEditorModal)">🌙 ${t('bedtimeRoutine')}</button>
      <button class="${r.type === 'morning' ? 'active' : ''}" onclick="State.routineDraft.type='morning'; openModal(renderRoutineEditorModal)">☀️ ${t('morningRoutine')}</button>
    </div></div>
    <div class="builder-list">
      ${r.steps.map((s, i) => `<div class="builder-step">
        <div class="num">${i + 1}</div>
        <div style="flex:1"><div class="title">${esc(s.name)}</div><div class="sub">${s.durationMin} min</div></div>
        <div class="actions"><button onclick="removeRoutineStep(${i})">${icon('close')}</button></div>
      </div>`).join('')}
    </div>
    <div class="row" style="gap:8px">
      <input type="text" id="stepNameInput" placeholder="${esc(t('stepName'))}" style="flex:2;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text)">
      <input type="number" id="stepDurInput" placeholder="min" value="10" style="flex:1;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text)">
      <button class="btn btn-secondary" onclick="addRoutineStep()">${icon('plus')}</button>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="saveRoutineDraft()">${t('save')}</button>
  `;
}
function addRoutineStep() {
    const name = document.getElementById('stepNameInput').value.trim();
    const dur = +document.getElementById('stepDurInput').value || 5;
    if (!name) return;
    State.routineDraft.steps.push({ name, durationMin: dur });
    openModal(renderRoutineEditorModal);
}
function removeRoutineStep(i) { State.routineDraft.steps.splice(i, 1); openModal(renderRoutineEditorModal); }
function saveRoutineDraft() { DB.saveRoutine(State.routineDraft); closeModal(); render(); toast(t('save') + ' ✓'); }

function startRoutine(routineId) {
    const routine = DB.listRoutines().find(r => r.id === routineId);
    const today = L.isoDate(new Date());
    let run = DB.listRoutineRuns().find(rr => rr.routineId === routineId && rr.date === today);
    if (!run) run = DB.addRoutineRun({ routineId, date: today, stepStates: routine.steps.map(() => 'pending') });
    State.routineRun = { routine, run };
    render();
}
function renderRoutineRunView() {
    const { routine, run } = State.routineRun;
    const pct = routineRunPct(run);
    return `
    <div class="modal-header"><h2>${esc(routine.name)}</h2><button class="icon-btn" onclick="State.routineRun=null; render()">${icon('close')}</button></div>
    <div class="progress-bar" style="margin-bottom:16px"><span style="width:${pct}%"></span></div>
    <div class="timeline">
      ${routine.steps.map((s, i) => `
        <div class="timeline-step ${run.stepStates[i] === 'done' ? 'done' : ''}">
          <div class="rail"><div class="dot"></div>${i < routine.steps.length - 1 ? '<div class="line"></div>' : ''}</div>
          <div class="content">
            <div class="time">${s.durationMin} min</div>
            <div class="name">${esc(s.name)}</div>
            ${run.stepStates[i] === 'pending' ? `<div class="step-actions">
              <button class="btn btn-secondary" onclick="setRoutineStep(${i},'skipped')">${t('skip')}</button>
              <button class="btn btn-primary" onclick="setRoutineStep(${i},'done')">${t('complete')}</button>
            </div>` : `<span class="badge ${run.stepStates[i] === 'done' ? 'badge-success' : 'badge-warning'}">${run.stepStates[i] === 'done' ? '✓' : t('skip')}</span>`}
          </div>
        </div>`).join('')}
    </div>
    ${pct === 100 ? `<div class="card" style="text-align:center;margin-top:16px">🎉 ${t('routineComplete')}</div>` : ''}
  `;
}
function setRoutineStep(i, status) {
    State.routineRun.run.stepStates[i] = status;
    DB.updateRoutineRun(State.routineRun.run.id, { stepStates: State.routineRun.run.stepStates });
    if (routineRunPct(State.routineRun.run) === 100 && State.routineRun.routine.type === 'bedtime') bumpAchievementCounter('bedtimeRoutineCompletions');
    render();
}
function bumpAchievementCounter(key) {
    const s = DB.getSettings();
    const counters = Object.assign({ bedtimeRoutineCompletions: 0 }, s.achievementCounters);
    counters[key] = (counters[key] || 0) + 1;
    DB.updateSettings({ achievementCounters: counters });
}

// ---------------------------------------------------------------------- //
// Statistics
// ---------------------------------------------------------------------- //
function viewStats() {
    const logs = DB.listDayLogs();
    if (!logs.length) return `<div class="section-title">${t('statsTitle')}</div><div class="empty-state"><div class="emoji">📊</div><p>${t('noStatsYet')}</p></div>`;
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const rate = L.successRate(logs);
    const wakeTimes = logs.filter(l => l.actualWakeTime).map(l => l.actualWakeTime);
    const avgWakeMin = wakeTimes.length ? Math.round(L.average(wakeTimes.map(L.hhmmToMinutes))) : null;
    const missed = logs.filter(l => l.success === false).length;
    const weekly = L.weeklyBuckets(logs);
    const insights = L.generateCoachInsights(logs);
    const unlocked = new Set(unlockAchievementsSticky(buildGamifyStats()));

    return `
    <div class="section-title">${t('statsTitle')}</div>
    <div class="stat-grid">
      <div class="card stat-tile"><div class="value">${avgWakeMin != null ? `${L.pad2(Math.floor(avgWakeMin / 60))}:${L.pad2(avgWakeMin % 60)}` : '—'}</div><div class="label">${t('avgWakeTime')}</div></div>
      <div class="card stat-tile"><div class="value">${rate}%</div><div class="label">${t('successRate')}</div></div>
      <div class="card stat-tile"><div class="value">${DB.getTotalXp().toLocaleString()}</div><div class="label">${t('totalXp')}</div></div>
      <div class="card stat-tile"><div class="value">${missed}</div><div class="label">${t('missedAlarms')}</div></div>
    </div>

    <div class="section-title">${t('weeklyTrend')}</div>
    <div class="card">
      <div class="bar-chart">
        ${weekly.map(b => `<div class="bar-col"><div class="bar" style="height:${b.total ? 60 + b.success * 8 : 6}px"><span style="height:${b.total ? (b.success / Math.max(1, b.total)) * 100 : 0}%"></span></div><div class="bar-label">${new Date(b.date).toLocaleDateString(window.I18N.getLang(), { weekday: 'narrow' })}</div></div>`).join('')}
      </div>
    </div>

    <div class="section-title">${t('streak')}</div>
    <div class="stat-grid">
      <div class="card stat-tile"><div class="value">${flame()} ${streak.current}</div><div class="label">${t('streak')}</div></div>
      <div class="card stat-tile"><div class="value">🏆 ${streak.best}</div><div class="label">${t('bestStreak')}</div></div>
    </div>

    <div class="section-title">${t('aiCoach')}</div>
    <div class="card"><p class="row-sub" style="margin-bottom:10px">${t('aiCoachDesc')}</p>
      ${insights.map(i => `<div class="suggestion-card" style="margin-bottom:8px"><div class="icon">${i.kind === 'tip' ? '💡' : 'ℹ️'}</div><div>${esc(i.text)}</div></div>`).join('')}
    </div>

    <div class="section-title">${t('achievements')}</div>
    <div class="achievement-grid">
      ${Gamify.ACHIEVEMENTS.map(ad => achievementTileHTML(ad, unlocked.has(ad.id))).join('')}
    </div>
  `;
}
function achievementTileHTML(ad, isUnlocked) {
    return `<div class="card achievement-tile ${isUnlocked ? 'unlocked' : ''}">
    <div class="emoji">${ad.icon}</div><div class="title">${esc(t(ad.titleKey))}</div><div class="desc">${esc(t(ad.descKey))}</div>
    <div class="badge rarity-${ad.rarity}">${t('rarity_' + ad.rarity)} · +${Gamify.RARITY_XP[ad.rarity]} XP</div>
  </div>`;
}
/** Unlocks achievements STICKILY (union with whatever was already unlocked
 * — never replaces), so a condition that later stops holding (there is at
 * least one intentionally non-monotonic one: new_streak_record) can never
 * un-unlock something the user already earned. Returns the full unlocked
 * set (as an array) after the update; callers that also need to grant XP
 * for newly-unlocked ones should diff against DB.getUnlockedAchievements()
 * themselves BEFORE calling this (see grantXpForDismissal). */
function unlockAchievementsSticky(stats) {
    const prevUnlocked = new Set(DB.getUnlockedAchievements());
    const nowUnlocked = new Set(Gamify.checkAchievements(stats));
    const union = new Set([...prevUnlocked, ...nowUnlocked]);
    DB.setUnlockedAchievements(Array.from(union));
    return Array.from(union);
}
function aggregateAchievementStats(logs) {
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const counters = Object.assign({ bedtimeRoutineCompletions: 0 }, DB.getSettings().achievementCounters);
    const history = DB.listChallengeHistory();
    return {
        challengesCompleted: history.filter(h => h.result === 'completed').length,
        beforeSevenDays: logs.filter(l => l.actualWakeTime && L.hhmmToMinutes(l.actualWakeTime) < 7 * 60).length,
        completedDays: new Set(logs.filter(l => l.success).map(l => l.date)).size,
        noSnoozeCount: logs.filter(l => (l.snoozeCount || 0) === 0).length,
        bedtimeRoutineCompletions: counters.bedtimeRoutineCompletions,
        bestStreak: streak.best,
        mathCorrect: history.reduce((s, h) => s + (h.mathCorrect || 0), 0),
        comboChallengesCompleted: history.filter(h => h.taskTypes && h.taskTypes.length > 1 && h.result === 'completed').length
    };
}

// ---------------------------------------------------------------------- //
// Profile + XP history
// ---------------------------------------------------------------------- //
function viewProfile() {
    const settings = DB.getSettings();
    const levelState = Gamify.computeLevelState(DB.getTotalXp());
    const rank = Gamify.rankForLevel(levelState.level);
    const logs = DB.listDayLogs();
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const rate = L.successRate(logs);
    const cosmetics = DB.getCosmetics();
    const ledger = DB.listXpLedger();

    const recentAchievementIds = ledger.filter(e => e.reasonKey === 'xpReasonAchievement')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(e => e.meta && e.meta.achievementId)
        .filter(Boolean);

    const days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const iso = L.isoDate(d);
        const dayTotal = ledger.filter(e => e.createdAt && e.createdAt.slice(0, 10) === iso).reduce((s, e) => s + e.amount, 0);
        days.push({ date: iso, xp: dayTotal });
    }
    const maxDayXp = Math.max(1, ...days.map(d => d.xp));

    return `
    <div class="section-title">${t('profileTitle')}</div>
    <div class="card profile-header" style="--rank-color:${rank.color}">
      <div class="profile-icon-big">${cosmetics.selectedIcon}</div>
      <div class="profile-name">${esc(settings.userName || t('you'))}</div>
      ${cosmetics.selectedTitle ? `<div class="row-sub">${esc(t(cosmetics.selectedTitle))}</div>` : ''}
      <div class="profile-rank-line">${rank.icon} ${t('levelLabel')} ${levelState.level} · ${t(rank.nameKey)}</div>
      <div class="xp-bar" style="margin-top:10px"><div class="xp-bar-fill" style="width:${levelState.progressPct}%"></div></div>
      <div class="level-card-sub">${levelState.xpIntoLevel.toLocaleString()} / ${levelState.xpForNext.toLocaleString()} XP</div>
    </div>

    <div class="stat-grid">
      <div class="card stat-tile"><div class="value">${DB.getTotalXp().toLocaleString()}</div><div class="label">${t('totalXp')}</div></div>
      <div class="card stat-tile"><div class="value">${flame()} ${streak.current}</div><div class="label">${t('streak')}</div></div>
      <div class="card stat-tile"><div class="value">🏆 ${streak.best}</div><div class="label">${t('bestStreak')}</div></div>
      <div class="card stat-tile"><div class="value">${rate == null ? '—' : rate + '%'}</div><div class="label">${t('successRate')}</div></div>
    </div>

    <button class="btn btn-secondary btn-block" style="margin-top:14px" onclick="navigate('xp-history')">${t('viewXpHistory')}</button>

    <div class="section-title">${t('ranksTitle')}</div>
    <div class="achievement-grid">
      ${Gamify.RANKS.map(r => `<div class="card achievement-tile ${levelState.level >= r.minLevel ? 'unlocked' : ''}" style="--rank-color:${r.color}">
        <div class="emoji">${r.icon}</div><div class="title">${t(r.nameKey)}</div><div class="desc">${t('levelLabel')} ${r.minLevel}${r.maxLevel === Infinity ? '+' : '–' + r.maxLevel}</div>
      </div>`).join('')}
    </div>

    ${recentAchievementIds.length ? `
    <div class="section-title">${t('recentAchievements')}</div>
    <div class="achievement-grid">
      ${recentAchievementIds.map(id => { const ad = Gamify.ACHIEVEMENTS.find(a => a.id === id); return ad ? achievementTileHTML(ad, true) : ''; }).join('')}
    </div>` : ''}

    <div class="section-title">${t('profileIcon')}</div>
    <div class="card"><div class="cosmetic-grid">
      ${Gamify.ICON_UNLOCKS.map(u => `<button class="cosmetic-option ${cosmetics.unlockedIcons.includes(u.icon) ? 'unlocked' : ''} ${cosmetics.selectedIcon === u.icon ? 'selected' : ''}" ${cosmetics.unlockedIcons.includes(u.icon) ? `onclick="selectCosmeticIcon('${u.icon}')"` : 'disabled'} title="${t('levelLabel')} ${u.level}">${u.icon}</button>`).join('')}
    </div></div>

    ${cosmetics.unlockedTitles.length ? `
    <div class="section-title">${t('profileTitleLabel')}</div>
    <div class="card preset-row">
      ${cosmetics.unlockedTitles.map(tk => `<button class="${cosmetics.selectedTitle === tk ? 'active' : ''}" onclick="selectCosmeticTitle('${tk}')">${esc(t(tk))}</button>`).join('')}
    </div>` : ''}

    <div class="section-title">${t('progressOverTime')}</div>
    <div class="card">
      <div class="bar-chart">
        ${days.map(d => `<div class="bar-col"><div class="bar" style="height:${d.xp ? 20 + (d.xp / maxDayXp) * 60 : 6}px"><span style="height:${d.xp ? (d.xp / maxDayXp) * 100 : 0}%"></span></div><div class="bar-label">${new Date(d.date).toLocaleDateString(window.I18N.getLang(), { weekday: 'narrow' })}</div></div>`).join('')}
      </div>
    </div>
  `;
}
function selectCosmeticIcon(iconId) { DB.selectCosmetic('icon', iconId); render(); }
function selectCosmeticTitle(titleKey) { DB.selectCosmetic('title', titleKey); render(); }

function viewXpHistory() {
    const filter = State.xpHistoryFilter || 'all';
    let ledger = DB.listXpLedger().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const now = new Date();
    if (filter === 'today') {
        const today = L.isoDate(now);
        ledger = ledger.filter(e => e.createdAt && e.createdAt.slice(0, 10) === today);
    } else if (filter === 'week') {
        const weekStartIso = weekStartIsoFor(now, DB.getSettings().weekStartsOn);
        ledger = ledger.filter(e => e.createdAt && e.createdAt.slice(0, 10) >= weekStartIso);
    }
    const filters = ['all', 'today', 'week'];
    return `
    <div class="section-title">${t('xpHistoryTitle')}</div>
    <div class="preset-row" style="margin-bottom:10px">
      ${filters.map(f => `<button class="${filter === f ? 'active' : ''}" onclick="setXpHistoryFilter('${f}')">${t('xpFilter_' + f)}</button>`).join('')}
    </div>
    ${ledger.length ? `<div class="card">
      ${ledger.map(e => `<div class="xp-history-row">
        <span class="xp-history-amount">+${e.amount}</span>
        <span class="xp-history-reason">${esc(t(e.reasonKey))}</span>
        <span class="xp-history-date">${new Date(e.createdAt).toLocaleDateString(window.I18N.getLang())}</span>
      </div>`).join('')}
    </div>` : `<div class="empty-state"><div class="emoji">📜</div><p>${t('noXpYet')}</p></div>`}
  `;
}
function setXpHistoryFilter(f) { State.xpHistoryFilter = f; render(); }

// ---------------------------------------------------------------------- //
// Calendar
// ---------------------------------------------------------------------- //
function viewCalendar() {
    const month = State.calendarMonth;
    const settings = DB.getSettings();
    const logs = DB.listDayLogs();
    const year = month.getFullYear(), m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const startOffset = (firstDay.getDay() - settings.weekStartsOn + 7) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const dowNames = settings.weekStartsOn === 1 ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayKey = L.isoDate(new Date());
    let cells = '';
    for (let i = 0; i < startOffset; i++) cells += `<div class="calendar-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const key = L.isoDate(new Date(year, m, d));
        const dayLogs = logs.filter(l => l.date === key);
        cells += `<div class="calendar-day ${key === todayKey ? 'today' : ''}" onclick="selectCalendarDay('${key}')">
      <span>${d}</span>
      ${dayLogs.length ? `<div class="dot-row">${dayLogs.slice(0, 4).map(l => `<span class="${l.success ? '' : 'miss'}"></span>`).join('')}</div>` : ''}
    </div>`;
    }
    return `
    <div class="section-title">${t('calendarTitle')}</div>
    <div class="row" style="padding:0 2px">
      <button class="icon-btn" onclick="shiftCalendarMonth(-1)">${icon('chevronDown', 'rot-90')}</button>
      <h3>${month.toLocaleDateString(window.I18N.getLang(), { month: 'long', year: 'numeric' })}</h3>
      <button class="icon-btn" onclick="shiftCalendarMonth(1)">${icon('chevronUp', 'rot-90')}</button>
    </div>
    <div class="card">
      <div class="calendar-grid">
        ${dowNames.map(k => `<div class="dow">${t(k)}</div>`).join('')}
        ${cells}
      </div>
    </div>
  `;
}
function shiftCalendarMonth(delta) { State.calendarMonth = new Date(State.calendarMonth.getFullYear(), State.calendarMonth.getMonth() + delta, 1); render(); }
function selectCalendarDay(key) {
    const logs = DB.listDayLogs().filter(l => l.date === key);
    openModal(() => `
    <div class="modal-header"><h2>${key}</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
    ${logs.length ? logs.map(l => `
      <div class="card-tight card" style="margin-bottom:8px">
        <div class="row"><div class="row-label">${l.scheduledTime}</div><span class="badge ${l.success ? 'badge-success' : 'badge-danger'}">${l.success ? t('done') : t('missedAlarms')}</span></div>
        <div class="row-sub">${t('wakeTime')}: ${esc(l.actualWakeTime || '—')}</div>
      </div>`).join('') : `<p class="row-sub">—</p>`}
  `);
}

// ---------------------------------------------------------------------- //
// Settings
// ---------------------------------------------------------------------- //
function viewSettings() {
    const s = DB.getSettings();
    const notifState = ('Notification' in window) ? Notification.permission : 'unsupported';
    return `
    <div class="section-title">${t('settingsTitle')}</div>

    <div class="card">
      <div class="field"><label>${t('yourName')}</label><input type="text" value="${esc(s.userName)}" oninput="updateSetting('userName', this.value)"></div>
    </div>

    <div class="section-title">${t('sectionAppearance')}</div>
    <div class="card">
      <div class="field"><label>${t('theme')}</label><div class="preset-row">
        ${['system', 'light', 'dark'].map(th => `<button class="${s.theme === th ? 'active' : ''}" onclick="updateSetting('theme','${th}')">${t(th)}</button>`).join('')}
      </div></div>
      <div class="field"><label>${t('accentColor')}</label><div class="preset-row">
        ${['indigo', 'teal', 'rose', 'amber', 'emerald'].map(c => `<button class="${s.accent === c ? 'active' : ''}" onclick="updateSetting('accent','${c}')">${c}</button>`).join('')}
      </div></div>
      <div class="row"><div class="row-label">${t('reducedMotion')}</div>${switchHTML(s.reducedMotion, 'updateSettingBool', 'reducedMotion')}</div>
    </div>

    <div class="section-title">${t('sectionGeneral')}</div>
    <div class="card">
      <div class="field"><label>${t('language')}</label><div class="preset-row">
        <button class="${s.language === 'en' ? 'active' : ''}" onclick="setLanguage('en')">English</button>
        <button class="${s.language === 'he' ? 'active' : ''}" onclick="setLanguage('he')">עברית</button>
      </div></div>
      <div class="field"><label>${t('timeFormat')}</label><div class="preset-row">
        <button class="${s.timeFormat === '24h' ? 'active' : ''}" onclick="updateSetting('timeFormat','24h')">24h</button>
        <button class="${s.timeFormat === '12h' ? 'active' : ''}" onclick="updateSetting('timeFormat','12h')">12h</button>
      </div></div>
      <div class="field"><label>${t('weekStartsOn')}</label><div class="preset-row">
        <button class="${s.weekStartsOn === 0 ? 'active' : ''}" onclick="updateSetting('weekStartsOn',0)">${t('sun')}</button>
        <button class="${s.weekStartsOn === 1 ? 'active' : ''}" onclick="updateSetting('weekStartsOn',1)">${t('mon')}</button>
      </div></div>
      <div class="row"><div class="row-label">${t('haptics')}</div>${switchHTML(s.haptics, 'updateSettingBool', 'haptics')}</div>
    </div>

    <div class="section-title">${t('sectionAlarm')}</div>
    <div class="card">
      <div class="row"><div class="row-label">${t('defaultVibrationLabel')}</div>${switchHTML(s.defaultVibration, 'updateSettingBool', 'defaultVibration')}</div>
    </div>

    <div class="section-title">${t('sectionSleep')}</div>
    <div class="card">
      <div class="field"><label>${t('sleepTarget')} (h)</label><div class="preset-row">${[6, 7, 7.5, 8, 9].map(n => `<button class="${s.sleepTargetHours === n ? 'active' : ''}" onclick="updateSetting('sleepTargetHours',${n})">${n}</button>`).join('')}</div></div>
      <div class="field"><label>Bedtime reminder (min before)</label><div class="preset-row">${[15, 30, 45, 60].map(n => `<button class="${s.bedtimeReminderMin === n ? 'active' : ''}" onclick="updateSetting('bedtimeReminderMin',${n})">${n}</button>`).join('')}</div></div>
    </div>

    <div class="section-title">${t('sectionNotifications')}</div>
    <div class="card">
      <div class="row"><div><div class="row-label">${t('sectionNotifications')}</div><div class="row-sub">${notifState === 'granted' ? '✓ Enabled' : notifState === 'denied' ? t('notifPermissionDenied') : t('permissionNeeded')}</div></div>
        ${notifState !== 'granted' ? `<button class="btn btn-secondary" onclick="ensureNotificationPermissionPrompted(true)">${t('fixPermissions')}</button>` : ''}
      </div>
      <div class="row"><div class="row-label">${t('alarmReminders')}</div>${switchHTML(s.alarmReminders, 'updateSettingBool', 'alarmReminders')}</div>
      <div class="row"><div class="row-label">${t('morningSummary')}</div>${switchHTML(s.morningSummary, 'updateSettingBool', 'morningSummary')}</div>
    </div>

    <div class="section-title">${t('sectionGamification')}</div>
    <div class="card">
      <div class="row"><div><div class="row-label">${t('showXpOnHome')}</div></div>${switchHTML(s.showXpOnHome !== false, 'updateSettingBool', 'showXpOnHome')}</div>
      <div class="row"><div><div class="row-label">${t('showDailyQuests')}</div></div>${switchHTML(s.showDailyQuests !== false, 'updateSettingBool', 'showDailyQuests')}</div>
      <div class="row"><div><div class="row-label">${t('showStreakOnHome')}</div></div>${switchHTML(s.showStreakOnHome !== false, 'updateSettingBool', 'showStreakOnHome')}</div>
      <div class="row"><div><div class="row-label">${t('gamificationAnimations')}</div><div class="row-sub">${t('gamificationAnimationsHint')}</div></div>${switchHTML(s.gamificationAnimations !== false, 'updateSettingBool', 'gamificationAnimations')}</div>
      <div class="row"><div><div class="row-label">${t('successSounds')}</div></div>${switchHTML(s.successSounds !== false, 'updateSettingBool', 'successSounds')}</div>
      <button class="btn btn-secondary btn-block" style="margin-top:10px" onclick="navigate('profile')">${t('viewProfile')}</button>
    </div>

    <div class="section-title">${t('reliabilityTitle')}</div>
    <div class="card"><p class="row-sub">${t('reliabilityBody')}</p></div>

    <div class="section-title">${t('sectionPrivacy')}</div>
    <div class="card">
      <p class="row-sub" style="margin-bottom:14px">${t('privacyExplainer')}</p>
      <button class="btn btn-secondary btn-block" style="margin-bottom:10px" onclick="exportData()">${t('exportData')}</button>
      <button class="btn btn-danger btn-block" onclick="confirmDeleteAllData()">${t('deleteData')}</button>
    </div>
  `;
}
function updateSetting(key, val) { DB.updateSettings({ [key]: val }); render(); }
function updateSettingBool(key, val) { DB.updateSettings({ [key]: val }); render(); }
function setLanguage(lang) { DB.updateSettings({ language: lang }); window.I18N.setLanguage(lang); render(); }
function ensureNotificationPermissionPrompted(force) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' || force) Notification.requestPermission().then(render);
}
async function exportData() {
    const json = JSON.stringify(DB.exportAll(), null, 2);
    const filename = 'wake-data-export.json';
    // When embedded as a Claude artifact, plain <a download> links are
    // inert — offer the file through the platform's downloads capability
    // instead. Outside that context (the real hosted app) window.claude
    // is undefined and we fall through to the normal browser download.
    if (window.claude && window.claude.use) {
        try {
            const downloads = await window.claude.use('downloads');
            if (downloads) { await downloads.save({ filename, data: json }); toast(t('exportData') + ' ✓'); return; }
        } catch (e) { /* declined/unavailable — fall back below */ }
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function confirmDeleteAllData() {
    openModal(() => `
    <div class="modal-header"><h2>${t('deleteData')}</h2></div>
    <p class="row-sub" style="margin-bottom:16px">${t('deleteDataConfirm')}</p>
    <div class="row" style="gap:10px">
      <button class="btn btn-secondary btn-block" onclick="closeModal()">${t('cancel')}</button>
      <button class="btn btn-danger btn-block" onclick="DB.deleteAll().then(() => { closeModal(); location.reload(); })">${t('delete')}</button>
    </div>`);
}

// ---------------------------------------------------------------------- //
// Celebrate screen: confetti + (if enabled) the real XP just earned, with
// a special, rank-colored panel on a level-up. Always tap-to-skip — per
// spec, skipping never forfeits the reward, since the XP was already
// committed to the ledger before this screen ever rendered.
// ---------------------------------------------------------------------- //
function celebrateHTML(grant) {
    const colors = ['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#ffffff'];
    const confetti = Array.from({ length: 16 }).map((_, i) =>
        `<span class="confetti-piece" style="left:${Math.round(Math.random() * 96)}%;background:${colors[i % colors.length]};animation-delay:${Math.round(Math.random() * 300)}ms"></span>`
    ).join('');
    const settings = DB.getSettings();
    const showXp = settings.showXpOnHome !== false && grant && grant.gained > 0;
    const leveledUp = showXp && grant.leveledUp;
    const toRank = leveledUp ? Gamify.rankForLevel(grant.toLevel) : null;

    const xpLine = showXp ? `
      <div class="xp-gain-line" id="xpGainLine">
        <span class="xp-gain-amount" id="xpGainAmount">+0</span><span class="xp-gain-label"> XP</span>
      </div>
      <div class="xp-bar-mini"><div class="xp-bar-mini-fill" id="xpBarMiniFill" style="width:0%"></div></div>` : '';

    const levelUpPanel = leveledUp ? `
      <div class="level-up-panel" style="--rank-color:${toRank.color}">
        <div class="level-up-glow"></div>
        <div class="level-up-badge">${toRank.icon}</div>
        <div class="level-up-title">${t('levelUp')}</div>
        <div class="level-up-number">${grant.toLevel}</div>
        <div class="level-up-rank">${t(toRank.nameKey)}</div>
      </div>` : '';

    return `<div class="ring-screen" style="overflow:hidden" onclick="skipCelebrate()">${confetti}
    <div class="celebrate" style="margin:auto;position:relative">
      ${leveledUp ? levelUpPanel : `<div class="emoji">🎉</div><h2>${t('youreAwake')}</h2>`}
      ${xpLine}
    </div>
  </div>`;
}

/** A short, synthesized two-note success chime — no shipped audio file, so
 * nothing here can be a copyright concern. Independent of the alarm's own
 * SoundEngine (which is busy being stopped at this exact moment). */
function playSuccessChime() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        [660, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            const startAt = ctx.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(startAt); osc.stop(startAt + 0.3);
        });
        setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch (e) { /* Web Audio unavailable — silently skip, never block dismissal */ }
}

function startXpGainAnimation(grant) {
    if (!grant || grant.gained <= 0) return;
    const amountEl = document.getElementById('xpGainAmount') || document.querySelector('.xp-gain-amount');
    const fillEl = document.getElementById('xpBarMiniFill');
    if (!amountEl && !fillEl) return;
    const totalAfter = DB.getTotalXp();
    const totalBefore = totalAfter - grant.gained;
    const before = Gamify.computeLevelState(totalBefore);
    const after = Gamify.computeLevelState(totalAfter);
    const fromPct = after.level === before.level ? before.progressPct : 0;
    const toPct = after.progressPct;
    const settings = DB.getSettings();
    const reduced = settings.reducedMotion || settings.gamificationAnimations === false;
    if (reduced) {
        if (amountEl) amountEl.textContent = '+' + grant.gained;
        if (fillEl) fillEl.style.width = toPct + '%';
        return;
    }
    const durationMs = 700;
    const start = performance.now();
    function step(now) {
        const p = Math.min(1, (now - start) / durationMs);
        if (amountEl) amountEl.textContent = '+' + Math.round(grant.gained * p);
        if (fillEl) fillEl.style.width = (fromPct + (toPct - fromPct) * p) + '%';
        if (p < 1 && State.celebrate) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ---------------------------------------------------------------------- //
// Ring / challenge screen
// ---------------------------------------------------------------------- //
function renderRing() {
    const overlay = document.getElementById('ring-overlay');
    // Defensive: renderRing() always replaces #ring-overlay's innerHTML,
    // which would silently detach any live camera stream still playing
    // inside it. Every controlled path already stops the session first
    // (and never calls renderRing() again until it has); this is the
    // catch-all so a future caller can never leak an open camera.
    stopPoseSession();
    stopPhotoStream();
    if (!State.activeRing && !State.celebrate) { overlay.classList.add('hidden'); overlay.innerHTML = ''; stopQrStream(); return; }
    overlay.classList.remove('hidden');
    if (State.celebrate) {
        overlay.innerHTML = celebrateHTML(State.lastXpGrant);
        startXpGainAnimation(State.lastXpGrant);
        return;
    }
    const ring = State.activeRing;
    const settings = DB.getSettings();
    const hasChallenge = !!ring.runner;
    overlay.innerHTML = `
    <div class="ring-screen">
      <div class="ring-time" id="ringTime">${L.formatTime(new Date(), settings.timeFormat === '24h')}</div>
      <div class="ring-label">${t('ringWakeUp')}</div>
      ${ring.alarm.label ? `<div class="ring-alarm-name">${esc(ring.alarm.label)}</div>` : ''}
      ${hasChallenge ? `
      <div class="challenge-panel">
        <div class="challenge-progress">${ring.runner.progressLabel()} · ${t('completeChallenge')}</div>
        ${renderChallengeTask(ring.runner)}
      </div>` : ''}
      <div class="ring-actions">
        ${!hasChallenge ? `<button class="btn btn-lg ring-btn-dismiss" onclick="dismissRing('normal')">${t('dismiss')}</button>` : ''}
        <button class="emergency-hold" id="emergencyBtn"><span class="fill" id="emergencyFill"></span><span>🛑 ${t('emergencyStop')} — ${t('holdToStop')}</span></button>
      </div>
    </div>`;
    bindRingEvents();
}

function renderChallengeTask(runner) {
    const t2 = runner.currentTask();
    switch (t2.config.type) {
        case 'math': return mathTaskHTML(t2);
        case 'memory': return memoryTaskHTML(t2);
        case 'situps': return repTaskHTML(t2, 'situps');
        case 'sport': return repTaskHTML(t2, 'sport');
        case 'song': return songTaskHTML(t2);
        case 'qr': return qrTaskHTML(t2);
        case 'swipe': return swipeTaskHTML(t2);
        case 'photo': return photoTaskHTML(t2);
        case 'typeSentence': return typeSentenceTaskHTML(t2);
        case 'typeSequence': return typeSequenceTaskHTML(t2);
        default: return tapTaskHTML(t2);
    }
}
function mathTaskHTML(taskState) {
    const q = taskState.questions[taskState.index];
    return `
    <div class="challenge-progress">${t('mathQuestionOf', { cur: taskState.index + 1, total: taskState.questions.length })}</div>
    ${taskState.timeLimitSec ? `<div class="row-sub" style="text-align:center;color:#fff;font-weight:800" id="mathTimerLabel">${taskState.timeLimitSec}s</div>` : ''}
    <div class="math-display">${q.question} = ?</div>
    ${taskState.opts.allowHints && q.hintText ? (taskState.hintUsed
      ? `<div class="row-sub" style="text-align:center;color:#fff;margin-bottom:8px">💡 ${esc(q.hintText)}</div>`
      : `<button class="btn btn-ghost btn-block" style="margin-bottom:8px" onclick="useMathHint()">💡 ${t('showHint')}</button>`) : ''}
    <input type="number" inputmode="numeric" class="math-input" id="mathAnswerInput" autofocus>
    ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4;margin-bottom:8px">${t('tryAgain')}</div>` : ''}
    <button class="btn btn-primary btn-block btn-lg" onclick="submitMathAnswer()">${t('done')}</button>
  `;
}
function useMathHint() { State.activeRing.runner.useMathHint(); renderRing(); }
function submitMathAnswer(value) {
    clearMathTimer();
    const input = document.getElementById('mathAnswerInput');
    const res = State.activeRing.runner.submitMathAnswer(value === undefined ? (input && input.value) : value);
    haptic(res.correct ? 20 : [40, 40, 40]);
    if (res.taskDone && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
    if (!res.correct) {
        const display = document.querySelector('.math-display');
        if (display) { display.classList.remove('shake'); void display.offsetWidth; display.classList.add('shake'); }
    }
    const el = document.getElementById('mathAnswerInput'); if (el) el.focus();
}
let mathTimerHandle = null;
function clearMathTimer() { if (mathTimerHandle) { clearInterval(mathTimerHandle); mathTimerHandle = null; } }
function startMathTimerIfNeeded() {
    clearMathTimer();
    const ring = State.activeRing;
    if (!ring || !ring.runner) return;
    const taskState = ring.runner.currentTask();
    if (!taskState || taskState.config.type !== 'math' || !taskState.timeLimitSec) return;
    let remaining = taskState.timeLimitSec;
    mathTimerHandle = setInterval(() => {
        remaining--;
        const label = document.getElementById('mathTimerLabel');
        if (label) label.textContent = remaining + 's';
        if (remaining <= 0) submitMathAnswer(NaN);
    }, 1000);
}
function memoryTaskHTML(taskState) {
    if (taskState.phase === 'watch' && !taskState._watchStarted) { taskState._watchStarted = true; setTimeout(() => startMemoryWatch(taskState), 400); }
    const palette = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    if (taskState.phase === 'watch') {
        return `<div class="challenge-progress">${t('memoryWatch')}</div>
      <div class="memory-grid">${palette.map(c => `<button class="memory-tile ${c} ${taskState._watchIndex >= 0 && taskState.sequence[taskState._watchIndex] === c ? 'lit' : ''}" disabled></button>`).join('')}</div>`;
    }
    return `<div class="challenge-progress">${t('memoryRepeat')} (${taskState.input.length}/${taskState.sequence.length})</div>
    ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4">${t('tryAgain')}</div>` : ''}
    <div class="memory-grid">${palette.map(c => `<button class="memory-tile ${c}" onclick="tapMemoryColor('${c}')"></button>`).join('')}</div>`;
}
function startMemoryWatch(taskState) {
    let i = 0;
    taskState._watchIndex = -1;
    const step = () => {
        taskState._watchIndex = i;
        renderRing();
        i++;
        if (i <= taskState.sequence.length) setTimeout(step, 700);
        else { taskState.phase = 'input'; taskState._watchIndex = -1; renderRing(); }
    };
    setTimeout(step, 400);
}
function tapMemoryColor(color) {
    const taskState = State.activeRing.runner.currentTask();
    const input = taskState.input.concat([color]);
    const res = State.activeRing.runner.submitMemoryInput(input);
    haptic(res.correct !== false ? 15 : [40, 40, 40]);
    if (res.done && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}
function repTaskHTML(taskState, kind) {
    const exerciseId = exerciseIdForTask(taskState.config);
    const camReady = exerciseId && taskState.config.useCamera !== false && Pose.supportsPoseCamera() && !taskState.manualMode;
    if (camReady) { taskState._exerciseId = exerciseId; return cameraWorkoutHTML(taskState); }
    return manualRepHTML(taskState, kind);
}

function manualRepHTML(taskState, kind) {
    const label = kind === 'situps' ? t('dismissSitups') : `${taskState.activity === 'pullups' ? t('activityPullups') : taskState.activity}`;
    const wasCamera = taskState.config.useCamera !== false && exerciseIdForTask(taskState.config);
    return `
    ${wasCamera ? `<div class="row-sub" style="text-align:center;color:#ffd166;margin-bottom:8px">${t('manualNotVerified')}</div>` : ''}
    <div class="rep-counter"><div class="n">${t('situpsProgress', { cur: taskState.reps, total: taskState.target })}</div><div class="row-sub">${t('tapEachRep')} — ${esc(label)}</div></div>
    <div class="rep-dots">${Array.from({ length: taskState.target }).map((_, i) => `<span class="${i < taskState.reps ? 'filled' : ''}"></span>`).join('')}</div>
    <button class="big-tap-target" onclick="addRep()">+1</button>
  `;
}
function addRep() {
    const done = State.activeRing.runner.addRep();
    haptic(20);
    if (done && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}

// --- Camera-verified exercise workout ----------------------------------
// The video/canvas elements below are mounted ONCE by this template, then
// the PoseSession updates everything in place via direct DOM writes
// (rep count, gauge, cues) — never through renderRing(), which would tear
// down and recreate the <video>, killing the live camera stream. renderRing()
// only runs again once the task actually finishes (see startPoseWorkout).
function cameraWorkoutHTML(taskState) {
    const exerciseId = taskState._exerciseId;
    return `
    <div class="pose-workout" id="poseWorkout" data-phase="calibrating">
      <div class="pose-video-wrap">
        <video id="poseVideo" playsinline autoplay muted></video>
        <canvas id="poseCanvas"></canvas>
        <div class="pose-gauge"><div class="pose-gauge-fill" id="poseGaugeFill" style="height:${Math.round((taskState.reps / taskState.target) * 100)}%"></div></div>
      </div>
      <div class="pose-calibrate-panel" id="poseCalibratePanel">
        <h3>${Pose.EXERCISES[exerciseId].label}</h3>
        <p class="row-sub">${t('techniqueTip_' + exerciseId)}</p>
        <ul class="pose-checklist" id="poseChecklist">
          <li data-check="body">🧍 ${t('checkBodyInFrame')}</li>
          <li data-check="joints">🔗 ${t('checkJoints')}</li>
        </ul>
        <div class="row-sub" id="poseCalibrateStatus" style="margin-top:8px">${t('calibrateHint')}</div>
      </div>
      <div class="pose-hud" id="poseHud" hidden>
        <div class="pose-rep-count" id="poseRepCount"><span id="poseRepNum">${taskState.reps}</span><span class="pose-rep-target"> / ${taskState.target}</span></div>
        <div class="pose-cue" id="poseCue"></div>
      </div>
    </div>
    ${taskState.config.backup ? `<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="handleCameraFailure()">${t('useBackupChallenge')}</button>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="switchToManualRep()">${t('useManualCount')}</button>
  `;
}

let activePoseSession = null;
function stopPoseSession() { if (activePoseSession) { activePoseSession.stop(); activePoseSession = null; } }

function switchToManualRep() {
    stopPoseSession();
    const ring = State.activeRing;
    if (!ring || !ring.runner) return;
    ring.runner.currentTask().manualMode = true;
    renderRing();
}

// Used when the CAMERA ITSELF fails (permission denied, model/CDN load
// failure, or the calibration timeout gives up) — as opposed to the user
// explicitly tapping "count manually" above. A configured backup challenge
// (task.config.backup) takes priority over the generic manual tap-counter,
// since it's a real alternative task rather than an unverified fallback.
function handleCameraFailure() {
    stopPoseSession();
    const ring = State.activeRing;
    if (!ring || !ring.runner) return;
    const task = ring.runner.currentTask();
    if (task.config.backup && ring.runner.switchToBackup()) { renderRing(); return; }
    task.manualMode = true;
    renderRing();
}

async function startPoseWorkout(taskState) {
    const video = document.getElementById('poseVideo');
    const canvas = document.getElementById('poseCanvas');
    if (!video || !canvas) return;
    stopPoseSession();
    let goodFrames = 0;
    const lang = window.I18N.getLang();
    activePoseSession = new Pose.PoseSession({
        video, canvas, exerciseId: taskState._exerciseId, lang, facingMode: 'user',
        onLandmarks(lm, canvasEl, videoEl) {
            if (!canvasEl.width && videoEl.videoWidth) { canvasEl.width = videoEl.videoWidth; canvasEl.height = videoEl.videoHeight; }
            if (!canvasEl.width) return;
            const ctx = canvasEl.getContext('2d');
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            Pose.drawSkeleton(ctx, lm, canvasEl.width, canvasEl.height, true);
        },
        onQuality(quality) {
            const panel = document.getElementById('poseWorkout');
            if (!panel) return; // task moved on — session will be stopped by the caller
            if (quality === 'tracking') goodFrames++;
            if (panel.dataset.phase === 'calibrating') {
                const checklist = document.getElementById('poseChecklist');
                if (checklist && quality === 'tracking') checklist.querySelectorAll('li').forEach(li => li.classList.add('ok'));
                const status = document.getElementById('poseCalibrateStatus');
                if (goodFrames >= 20) {
                    panel.dataset.phase = 'workout';
                    const cp = document.getElementById('poseCalibratePanel'); if (cp) cp.hidden = true;
                    const hud = document.getElementById('poseHud'); if (hud) hud.hidden = false;
                } else if (status) {
                    status.textContent = quality === 'unreliable' ? t('calibrateStruggling') : t('calibrateHint');
                }
            } else if (quality === 'unreliable') {
                const cue = document.getElementById('poseCue');
                if (cue) cue.textContent = t('trackingLost');
            }
        },
        onCue(text) {
            const panel = document.getElementById('poseWorkout');
            if (panel && panel.dataset.phase === 'workout') {
                const cue = document.getElementById('poseCue');
                if (cue) cue.textContent = text || '';
            }
        },
        onRep(reps) {
            while (taskState.reps < reps) {
                const done = State.activeRing.runner.addRep();
                haptic(20);
                if (done) {
                    stopPoseSession();
                    if (State.activeRing.runner.isComplete()) { finishChallenge(); return; }
                    renderRing();
                    return;
                }
            }
            const numEl = document.getElementById('poseRepNum');
            if (numEl) { numEl.textContent = taskState.reps; const wrap = document.getElementById('poseRepCount'); if (wrap) { wrap.classList.remove('tick-pop-replay'); void wrap.offsetWidth; wrap.classList.add('tick-pop-replay'); } }
            const gauge = document.getElementById('poseGaugeFill');
            if (gauge) gauge.style.height = Math.round((taskState.reps / taskState.target) * 100) + '%';
        },
        onError(reason) {
            const status = document.getElementById('poseCalibrateStatus');
            const key = { permissionDenied: 'cameraErrorPermissionDenied', unsupported: 'cameraErrorUnsupported', loadFailed: 'cameraErrorLoadFailed' }[reason] || 'cameraErrorGeneric';
            if (status) status.textContent = t(key);
            setTimeout(() => { if (State.activeRing) handleCameraFailure(); }, 1800);
        }
    });
    activePoseSession.start();
}
function songTaskHTML(taskState) {
    if (!taskState._options) {
        const correct = taskState.config.correctSoundId || State.activeRing.alarm.soundId;
        taskState.config.correctSoundId = correct;
        const pool = Sounds.LIBRARY.filter(s => s.id !== correct);
        taskState._options = shuffle([correct].concat(shuffle(pool).slice(0, 3).map(s => s.id)));
    }
    return `<div class="challenge-progress">${t('songWhichPlayed')}</div>
    <div class="song-options">${taskState._options.map(id => `<button onclick="chooseSong('${id}')">🎵 ${esc(soundName(id))}</button>`).join('')}</div>`;
}
function chooseSong(soundId) {
    const correct = State.activeRing.runner.chooseSong(soundId);
    haptic(correct ? 20 : [40, 40, 40]);
    if (correct && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}
function tapTaskHTML() { return `<button class="big-tap-target" onclick="confirmSimpleTask()">👆 ${t('dismissNormal')}</button>`; }
function swipeTaskHTML() { return `<button class="big-tap-target" id="swipeTarget">👉 ${t('dismissSwipe')}</button>`; }
function confirmSimpleTask() {
    State.activeRing.runner.confirmSimple();
    if (State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}
function qrTaskHTML(taskState) {
    const supported = Ch.supportsBarcodeDetector() && Ch.supportsCamera();
    if (!supported || taskState.cameraFailed) {
        return `<p class="row-sub" style="color:#fff">${t('qrNotSupported')}</p>
      <input type="text" id="qrManualInput" class="math-input" placeholder="${esc(t('qrManualCode'))}">
      ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4">${t('tryAgain')}</div>` : ''}
      <button class="btn btn-primary btn-block btn-lg" onclick="submitQrManual()">${t('done')}</button>`;
    }
    return `<div class="qr-video-wrap"><video id="qrVideo" playsinline autoplay muted></video></div>
    <div class="row-sub" style="text-align:center;color:#fff;margin-top:8px">${t('scanQr')} — ${esc(taskState.config.qrName || '')}</div>`;
}
function submitQrManual() {
    const val = document.getElementById('qrManualInput').value.trim();
    const correct = State.activeRing.runner.submitQr(val);
    haptic(correct ? 20 : [40, 40, 40]);
    if (correct && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}
async function startRingQrScanner() {
    const video = document.getElementById('qrVideo');
    if (!video) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        State.qrStream = stream;
        video.srcObject = stream;
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const poll = async () => {
            if (!document.getElementById('qrVideo') || !State.activeRing) { stopQrStream(); return; }
            try {
                const codes = await detector.detect(video);
                if (codes.length) {
                    const correct = State.activeRing.runner.submitQr(codes[0].rawValue);
                    if (correct) { stopQrStream(); haptic(20); if (State.activeRing.runner.isComplete()) return finishChallenge(); renderRing(); return; }
                }
            } catch (e) { /* keep polling */ }
            requestAnimationFrame(poll);
        };
        poll();
    } catch (e) {
        const taskState = State.activeRing && State.activeRing.runner && State.activeRing.runner.currentTask();
        if (taskState) { taskState.cameraFailed = true; renderRing(); }
    }
}

// --- Photo challenge ----------------------------------------------------
// Capture is a LIVENESS check only (Logic.imageLivenessCheck — real pixel
// variation, not a blank/frozen frame), never object/content recognition.
// The captured frame is read into memory for one getImageData() call and
// then thrown away — never saved to disk, IndexedDB, or sent anywhere.
function photoTaskHTML(taskState) {
    if (!Ch.supportsCamera() || taskState.cameraFailed) {
        return `<p class="row-sub" style="color:#fff">${t('cameraErrorUnsupported')}</p>
      ${taskState.config.backup ? `<button class="btn btn-primary btn-block btn-lg" onclick="handleCameraFailure()">${t('useBackupChallenge')}</button>` : `<p class="row-sub" style="color:#fff">${t('photoNoBackupStuck')}</p>`}`;
    }
    return `
    <div class="challenge-progress">${t('photoChallengeTitle')}</div>
    ${taskState.config.instructions ? `<div class="row-sub" style="text-align:center;color:#fff;margin-bottom:8px">${esc(taskState.config.instructions)}</div>` : ''}
    <div class="qr-video-wrap"><video id="photoVideo" playsinline autoplay muted></video></div>
    <canvas id="photoCanvas" hidden></canvas>
    ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4;margin-top:8px">${t('photoRetry')}</div>` : ''}
    <div class="row-sub" style="text-align:center;margin-top:8px">${t('photoLivenessOnly')}</div>
    <button class="btn btn-primary btn-block btn-lg" style="margin-top:10px" onclick="capturePhoto()">${t('takePhoto')}</button>
  `;
}
async function startPhotoCamera() {
    const video = document.getElementById('photoVideo');
    if (!video) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        State.photoStream = stream;
        video.srcObject = stream;
    } catch (e) {
        const taskState = State.activeRing && State.activeRing.runner && State.activeRing.runner.currentTask();
        if (taskState) { taskState.cameraFailed = true; renderRing(); }
    }
}
function stopPhotoStream() { if (State.photoStream) { State.photoStream.getTracks().forEach(tr => tr.stop()); State.photoStream = null; } }
function capturePhoto() {
    const video = document.getElementById('photoVideo');
    const canvas = document.getElementById('photoCanvas');
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // never keep the frame around
    const accepted = State.activeRing.runner.submitPhoto(pixels);
    haptic(accepted ? 20 : [40, 40, 40]);
    if (accepted) {
        stopPhotoStream();
        if (State.activeRing.runner.isComplete()) return finishChallenge();
    }
    renderRing();
}

// --- Type-a-sentence / typing-sequence challenges ------------------------
function typeSentenceTaskHTML(taskState) {
    return `
    <div class="challenge-progress">${t('typeSentencePrompt')}</div>
    <div class="row-sub" style="text-align:center;color:#fff;font-size:17px;font-weight:700;margin:10px 0" dir="auto">${esc(taskState.sentence)}</div>
    <textarea id="typeSentenceInput" rows="3" dir="auto" autofocus
      style="width:100%;padding:13px 14px;border-radius:12px;border:none;font-size:16px;margin-bottom:10px"></textarea>
    ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4">${t('tryAgain')}</div>` : ''}
    <button class="btn btn-primary btn-block btn-lg" onclick="submitTypedSentence()">${t('done')}</button>`;
}
function submitTypedSentence() {
    const input = document.getElementById('typeSentenceInput');
    const correct = State.activeRing.runner.submitTypedSentence(input ? input.value : '');
    haptic(correct ? 20 : [40, 40, 40]);
    if (correct && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}
function typeSequenceTaskHTML(taskState) {
    return `
    <div class="challenge-progress">${t('typeSequencePrompt')}</div>
    <div class="math-display" style="font-size:34px;letter-spacing:0.12em" dir="ltr">${esc(taskState.sequence)}</div>
    <input type="text" id="typeSequenceInput" class="math-input" dir="ltr" autofocus autocomplete="off" autocapitalize="characters">
    ${taskState.mistakes ? `<div class="row-sub" style="text-align:center;color:#ffb4b4">${t('typeSequenceRetry')}</div>` : ''}
    <button class="btn btn-primary btn-block btn-lg" onclick="submitTypedSequence()">${t('done')}</button>`;
}
function submitTypedSequence() {
    const input = document.getElementById('typeSequenceInput');
    const correct = State.activeRing.runner.submitTypedSequence(input ? input.value : '');
    haptic(correct ? 20 : [40, 40, 40]);
    if (correct && State.activeRing.runner.isComplete()) return finishChallenge();
    renderRing();
}

function finishChallenge() { dismissRing('challenge'); }

function bindRingEvents() {
    const ring = State.activeRing;
    const currentTask = ring.runner && ring.runner.currentTask();
    if (currentTask && currentTask.config.type === 'qr' && Ch.supportsBarcodeDetector() && Ch.supportsCamera()) startRingQrScanner();
    if (currentTask && currentTask.config.type === 'photo' && Ch.supportsCamera() && !currentTask.cameraFailed) startPhotoCamera();
    if (document.getElementById('poseWorkout') && currentTask && !currentTask._cameraStarted) {
        currentTask._cameraStarted = true;
        startPoseWorkout(currentTask);
    }
    const mathInput = document.getElementById('mathAnswerInput');
    if (mathInput) mathInput.addEventListener('keyup', e => { if (e.key === 'Enter') submitMathAnswer(); });
    startMathTimerIfNeeded();

    const swipeEl = document.getElementById('swipeTarget');
    if (swipeEl) {
        let startX = null;
        swipeEl.addEventListener('pointerdown', e => { startX = e.clientX; });
        swipeEl.addEventListener('pointermove', e => { if (startX == null) return; const dx = e.clientX - startX; swipeEl.style.transform = `translateX(${dx}px)`; });
        const finish = e => {
            if (startX == null) return;
            const dx = (e.clientX || 0) - startX;
            swipeEl.style.transform = '';
            if (Math.abs(dx) > 110) confirmSimpleTask();
            startX = null;
        };
        swipeEl.addEventListener('pointerup', finish);
        swipeEl.addEventListener('pointercancel', () => { startX = null; swipeEl.style.transform = ''; });
    }

    const eb = document.getElementById('emergencyBtn');
    if (eb) {
        let holdTimer = null, raf = null, startTs = null;
        const fill = document.getElementById('emergencyFill');
        const cancel = () => { clearTimeout(holdTimer); if (raf) cancelAnimationFrame(raf); if (fill) fill.style.width = '0%'; startTs = null; };
        const step = ts => { if (!startTs) startTs = ts; const p = Math.min(1, (ts - startTs) / 3000); if (fill) fill.style.width = (p * 100) + '%'; if (p < 1) raf = requestAnimationFrame(step); };
        const start = () => { cancel(); raf = requestAnimationFrame(step); holdTimer = setTimeout(() => { cancel(); dismissRing('emergency'); }, 3000); };
        eb.addEventListener('pointerdown', start);
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => eb.addEventListener(evt, cancel));
    }
}

// ---------------------------------------------------------------------- //
// Gamification: XP is granted ONLY from real events below (a completed
// alarm dismissal, a real physical/math task, a real streak/quest/
// achievement milestone) — never from opening a screen or tapping a
// button. Every grant goes through DB.addXpEvent(dedupeKey, ...), which is
// a structural no-op on a repeat key, so re-renders, reloads, device
// restarts, or a second alarm firing can never double-pay the same event.
// ---------------------------------------------------------------------- //

/** Same physical/math/combo stats viewStats already computes from real
 * history — extended here with the extra fields the gamification
 * achievements need. Reuses aggregateAchievementStats rather than
 * re-deriving its fields a second way. */
function buildGamifyStats() {
    const logs = DB.listDayLogs();
    const history = DB.listChallengeHistory();
    const base = aggregateAchievementStats(logs);
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const physicalTypes = ['sport', 'situps'];
    return Object.assign({}, base, {
        streak,
        level: Gamify.computeLevelState(DB.getTotalXp()).level,
        totalSuccessfulMornings: logs.filter(l => l.success).length,
        physicalChallengesCompleted: history.filter(h => h.result === 'completed' && h.taskTypes && h.taskTypes.some(tt => physicalTypes.includes(tt))).length,
        totalRepsCompleted: history.reduce((sum, h) => sum + (h.repsCompleted || 0), 0),
        mathLevel5SolvedEver: history.some(h => h.mathLevel5Solved),
        tripleComboCount: history.filter(h => h.result === 'completed' && h.taskTypes && h.taskTypes.length >= 3).length
    });
}

function buildDailyQuestContext(dateIso) {
    const logsToday = DB.listDayLogs().filter(l => l.date === dateIso && l.dismissMethod !== 'emergency');
    const historyToday = DB.listChallengeHistory().filter(h => h.date === dateIso && h.result === 'completed');
    const physicalTypes = ['sport', 'situps'];
    return {
        alarmsCompletedToday: logsToday.length,
        distinctAlarmsCompletedToday: new Set(logsToday.map(l => l.alarmId)).size,
        challengesCompletedToday: historyToday.length,
        physicalCompletedToday: historyToday.filter(h => h.taskTypes.some(tt => physicalTypes.includes(tt))).length,
        mathSolvedToday: historyToday.reduce((sum, h) => sum + (h.mathCorrect || 0), 0)
    };
}

/** The ISO date (local) of the configured week's start on-or-before `date`. */
function weekStartIsoFor(date, weekStartsOn) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = (d.getDay() - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - diff);
    return L.isoDate(d);
}
function buildWeeklyContext(weekStartIso, now) {
    const weekStart = new Date(weekStartIso + 'T00:00:00');
    const successfulDates = new Set(
        DB.listDayLogs()
            .filter(l => l.success && l.dismissMethod !== 'emergency')
            .filter(l => { const d = new Date(l.date + 'T00:00:00'); return d >= weekStart && d <= now; })
            .map(l => l.date)
    );
    return { successfulDaysThisWeek: successfulDates.size };
}

/**
 * Grants every XP event a real, just-completed dismissal earns. Returns a
 * summary ({gained, events, fromLevel, toLevel, leveledUp}) for the UI to
 * animate — never a fire-and-forget side effect the screen can't reflect.
 * An emergency exit is a safety valve, not a success: it earns nothing.
 */
function grantXpForDismissal(ring, method, dayLog, historyEntry, now) {
    if (method === 'emergency' || !dayLog) return { events: [], gained: 0, leveledUp: false, fromLevel: null, toLevel: null };
    const fromLevel = Gamify.computeLevelState(DB.getTotalXp()).level;
    const events = [];
    const grant = (key, amount, reasonKey, meta) => { const e = DB.addXpEvent(key, amount, reasonKey, meta); if (e) events.push(e); };

    grant(`dismiss:${dayLog.id}`, 100, 'xpReasonAlarmCompleted', { alarmId: ring.alarm.id });

    if (historyEntry) {
        const physicalTypes = ['sport', 'situps'];
        if (historyEntry.taskTypes.some(tt => physicalTypes.includes(tt))) grant(`dismiss:${dayLog.id}:physical`, 20, 'xpReasonPhysical');
        if (historyEntry.taskTypes.includes('math')) grant(`dismiss:${dayLog.id}:math`, 15, 'xpReasonMath');
        const comboXp = Gamify.comboBonusXp(new Set(historyEntry.taskTypes).size);
        if (comboXp > 0) grant(`dismiss:${dayLog.id}:combo`, comboXp, 'xpReasonCombo');
    }

    const logs = DB.listDayLogs();
    const streak = L.computeStreak(logs.map(l => ({ date: l.date, success: l.success })));
    const milestone = Gamify.streakMilestoneReached(streak.current);
    if (milestone) {
        const startDate = Gamify.streakStartDateIso(L.isoDate(now), streak.current);
        grant(`streak:${milestone.days}:${startDate}`, milestone.xp, 'xpReasonStreak', { days: milestone.days });
    }

    const dateIso = L.isoDate(now);
    const dailyQuests = Gamify.evaluateDailyQuests(dateIso, buildDailyQuestContext(dateIso));
    dailyQuests.forEach(q => { if (q.done) grant(`quest:${dateIso}:${q.id}`, q.xp, 'xpReasonQuest', { questId: q.id }); });
    if (dailyQuests.length && dailyQuests.every(q => q.done)) grant(`dailyQuestsComplete:${dateIso}`, 50, 'xpReasonDailyQuests');

    const weekStartIso = weekStartIsoFor(now, DB.getSettings().weekStartsOn);
    const weekCtx = buildWeeklyContext(weekStartIso, now);
    Gamify.evaluateWeeklyQuests(weekCtx).forEach(q => { if (q.done) grant(`weeklyquest:${weekStartIso}:${q.id}`, q.xp, 'xpReasonWeeklyQuest', { questId: q.id }); });
    if (weekCtx.successfulDaysThisWeek >= Gamify.WEEKLY_GOAL.targetDays) grant(`weeklyGoal:${weekStartIso}`, Gamify.WEEKLY_GOAL.xp, 'xpReasonWeeklyGoal');

    const prevUnlocked = new Set(DB.getUnlockedAchievements());
    const union = unlockAchievementsSticky(buildGamifyStats());
    const newlyUnlocked = Array.from(union).filter(id => !prevUnlocked.has(id));
    newlyUnlocked.forEach(id => grant(`achievement:${id}`, Gamify.achievementXp(id), 'xpReasonAchievement', { achievementId: id }));

    const toLevel = Gamify.computeLevelState(DB.getTotalXp()).level;
    syncCosmeticUnlocks(toLevel, newlyUnlocked);
    return { events, gained: events.reduce((s, e) => s + e.amount, 0), leveledUp: toLevel > fromLevel, fromLevel, toLevel };
}
/** Purely decorative: unlocks profile icons by level and titles by specific
 * achievement, never anything that touches the alarm/challenge flow. */
function syncCosmeticUnlocks(level, newlyUnlockedAchievementIds) {
    Gamify.iconUnlocksUpToLevel(level).forEach(iconId => DB.unlockCosmetic('icon', iconId));
    newlyUnlockedAchievementIds.forEach(id => { const titleKey = Gamify.TITLE_UNLOCKS[id]; if (titleKey) DB.unlockCosmetic('title', titleKey); });
}

function dismissRing(method) {
    const ring = State.activeRing;
    if (!ring) return;
    Sounds.engine.stop();
    stopQrStream();
    stopPoseSession();
    stopPhotoStream();
    clearMathTimer();
    if (State.wakeLock) { State.wakeLock.release(); State.wakeLock = null; }
    const now = new Date();
    const settings = DB.getSettings();
    // An emergency exit is a safety valve, not a success: it must not count
    // toward streaks, "successful mornings" achievements, or any stat that
    // feeds gamification — otherwise escaping the challenge would be an XP
    // farming route, the exact opposite of what the whole system rewards.
    const dayLog = DB.addDayLog({
        alarmId: ring.alarm.id, date: L.isoDate(now), scheduledTime: ring.alarm.time,
        actualWakeTime: L.formatTime(now, true), snoozeCount: ring.snoozeCount, success: method !== 'emergency',
        challengeCompleted: !!ring.runner, dismissMethod: method
    });
    let historyEntry = null;
    if (ring.runner) {
        const mathCorrect = ring.runner.tasks.filter(ts => ts.config.type === 'math').reduce((sum, ts) => sum + (ts.correctCount || 0), 0);
        const repsCompleted = ring.runner.tasks.filter(ts => ts.config.type === 'sport' || ts.config.type === 'situps').reduce((sum, ts) => sum + (ts.reps || 0), 0);
        const mathLevel5Solved = ring.runner.tasks.some(ts => ts.config.type === 'math' && Number(ts.config.difficulty) === 5 && (ts.correctCount || 0) > 0);
        historyEntry = DB.addChallengeHistory({
            alarmId: ring.alarm.id, date: L.isoDate(now), taskTypes: ring.alarm.challenge.tasks.map(tsk => tsk.type),
            snoozeCount: ring.snoozeCount, result: method === 'emergency' ? 'emergency_stop' : 'completed',
            mathCorrect, repsCompleted, mathLevel5Solved
        });
    }
    // XP/achievements/quests always accrue for real, regardless of display
    // settings — showXpOnHome only controls whether the celebrate screen
    // SHOWS the gain (see celebrateHTML); it is never a way to pause the
    // underlying ledger, since nothing lets a user hand-edit XP either way.
    State.lastXpGrant = grantXpForDismissal(ring, method, dayLog, historyEntry, now);
    if (method !== 'emergency' && settings.successSounds !== false) playSuccessChime();
    State.activeRing = null;
    State.celebrate = true;
    haptic(30);
    render();
    const celebrateMs = State.lastXpGrant.leveledUp ? 3600 : 2000;
    State.celebrateTimer = setTimeout(() => { State.celebrate = false; State.lastXpGrant = null; render(); }, celebrateMs);
    if (settings.morningSummary) { const grantForReport = State.lastXpGrant; setTimeout(() => showMorningReport(ring, now, grantForReport), celebrateMs + 100); }
}
function skipCelebrate() {
    if (!State.celebrate) return;
    if (State.celebrateTimer) clearTimeout(State.celebrateTimer);
    State.celebrate = false;
    State.lastXpGrant = null;
    render();
}
function showMorningReport(ring, wakeDate, grant) {
    const streak = L.computeStreak(DB.listDayLogs().map(l => ({ date: l.date, success: l.success })));
    openModal(() => `
    <div class="modal-header"><h2>${t('morningReport')} ☀️</h2><button class="icon-btn" onclick="closeModal()">${icon('close')}</button></div>
    <div class="stat-grid">
      <div class="card stat-tile"><div class="value">${L.formatTime(wakeDate, DB.getSettings().timeFormat === '24h')}</div><div class="label">${t('wakeTime')}</div></div>
      <div class="card stat-tile"><div class="value">${ring.alarm.time}</div><div class="label">${t('target')}</div></div>
      <div class="card stat-tile"><div class="value">+${grant ? grant.gained : 0}</div><div class="label">${t('totalXp')}</div></div>
      <div class="card stat-tile"><div class="value">${flame()} ${streak.current}</div><div class="label">${t('streak')}</div></div>
    </div>
  `);
}

// ---------------------------------------------------------------------- //
// Modal helper
// ---------------------------------------------------------------------- //
let currentModalRenderer = null;
function openModal(renderer) {
    currentModalRenderer = renderer;
    State.modal = renderer;
    renderModal();
}
function closeModal() { State.modal = null; currentModalRenderer = null; stopQrStream(); renderModal(); }
function renderModal() {
    const host = document.getElementById('modal-root');
    if (!State.modal) { host.innerHTML = ''; return; }
    host.innerHTML = `<div class="modal-backdrop" onclick="if(event.target===this) closeModal()"><div class="modal-sheet">${State.modal()}</div></div>`;
}

// ---------------------------------------------------------------------- //
// Nav shell
// ---------------------------------------------------------------------- //
function navLinks() {
    return [
        { path: 'home', icon: 'home', label: 'navHome' },
        { path: 'alarms', icon: 'alarm', label: 'navAlarms' },
        { path: 'sleep', icon: 'moon', label: 'navSleep' },
        { path: 'stats', icon: 'chart', label: 'navStats' },
        { path: 'routines', icon: 'routine', label: 'navRoutines' }
    ];
}
function buildShell() {
    const links = navLinks();
    document.getElementById('bottom-nav').innerHTML = links.map(l => `
    <a href="#/${l.path}" data-nav-link="${l.path}"><span class="nav-icon-wrap">${icon(l.icon)}</span>${t(l.label)}</a>
  `).join('');
    document.getElementById('sidebar').innerHTML = `
    <div class="brand"><span class="dot" style="width:12px;height:12px;border-radius:50%;background:var(--accent)"></span>${t('appName')}</div>
    ${links.concat([{ path: 'calendar', icon: 'calendar', label: 'navCalendar' }, { path: 'settings', icon: 'gear', label: 'navSettings' }]).map(l => `<a href="#/${l.path}" data-nav-link="${l.path}">${icon(l.icon)} ${t(l.label)}</a>`).join('')}
  `;
}
window.I18N.onChange(() => { buildShell(); render(); });

document.addEventListener('DOMContentLoaded', () => { buildShell(); boot(); });

function bindViewEvents() { /* per-view event wiring hook, most handled via onclick attributes */ }
