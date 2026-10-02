const test = require('node:test');
const assert = require('node:assert/strict');
const DB = require('../storage.js');

test.beforeEach(async () => { await DB.deleteAll(); });

test('createAlarm applies defaults and persists', () => {
    const alarm = DB.createAlarm({ time: '06:30', label: 'Gym' });
    assert.equal(alarm.time, '06:30');
    assert.equal(alarm.label, 'Gym');
    assert.equal(alarm.volume, 80); // default
    assert.equal(DB.listAlarms().length, 1);
    assert.equal(DB.getAlarm(alarm.id).label, 'Gym');
});

test('updateAlarm patches fields and bumps updatedAt', () => {
    const alarm = DB.createAlarm({ time: '06:30' });
    const updated = DB.updateAlarm(alarm.id, { time: '07:00', enabled: false });
    assert.equal(updated.time, '07:00');
    assert.equal(updated.enabled, false);
    assert.ok(updated.updatedAt);
});

test('deleteAlarm removes it', () => {
    const alarm = DB.createAlarm({ time: '06:30' });
    assert.equal(DB.deleteAlarm(alarm.id), true);
    assert.equal(DB.listAlarms().length, 0);
    assert.equal(DB.deleteAlarm('missing-id'), false);
});

test('recurring alarm days persist through update', () => {
    const alarm = DB.createAlarm({ time: '07:00', days: [1, 2, 3, 4, 5] });
    assert.deepEqual(DB.getAlarm(alarm.id).days, [1, 2, 3, 4, 5]);
    DB.updateAlarm(alarm.id, { days: [0, 6] });
    assert.deepEqual(DB.getAlarm(alarm.id).days, [0, 6]);
});

test('day logs accumulate for stats', () => {
    DB.addDayLog({ date: '2026-01-01', success: true, snoozeCount: 1 });
    DB.addDayLog({ date: '2026-01-02', success: false, snoozeCount: 0 });
    const logs = DB.listDayLogs();
    assert.equal(logs.length, 2);
});

test('settings merge with defaults and persist updates', () => {
    const s1 = DB.getSettings();
    assert.equal(s1.theme, 'system');
    const s2 = DB.updateSettings({ theme: 'dark', accent: 'teal' });
    assert.equal(s2.theme, 'dark');
    assert.equal(s2.accent, 'teal');
    assert.equal(DB.getSettings().defaultSnoozeMin, 10); // untouched default survives
});

test('QR challenges CRUD', () => {
    const qr = DB.createQrChallenge({ name: 'Bathroom', code: 'abc123' });
    assert.equal(DB.listQrChallenges().length, 1);
    assert.equal(DB.deleteQrChallenge(qr.id), true);
    assert.equal(DB.listQrChallenges().length, 0);
});

test('favorite sounds toggle on and off', () => {
    DB.toggleFavoriteSound('chime');
    assert.deepEqual(DB.getFavoriteSounds(), ['chime']);
    DB.toggleFavoriteSound('chime');
    assert.deepEqual(DB.getFavoriteSounds(), []);
});

test('exportAll includes every collection and deleteAll clears everything', async () => {
    DB.createAlarm({ time: '07:00' });
    DB.updateSettings({ userName: 'Yoav' });
    const dump = DB.exportAll();
    assert.equal(dump.alarms.length, 1);
    assert.equal(dump.settings.userName, 'Yoav');
    await DB.deleteAll();
    assert.equal(DB.listAlarms().length, 0);
    assert.equal(DB.getSettings().userName, ''); // back to default
});

test('addCustomSound rolls back the metadata record if the blob fails to persist', async () => {
    // Node has no IndexedDB, so this exercises the real "storage unavailable"
    // failure path — the same one a full quota would hit in a browser.
    await assert.rejects(() => DB.addCustomSound({ name: 'Some Song', blob: new Blob(['x'], { type: 'audio/mpeg' }) }));
    assert.equal(DB.listCustomSounds().length, 0); // no orphaned metadata left behind
});

test('deleteAll tolerates IndexedDB being unavailable', async () => {
    await assert.doesNotReject(() => DB.deleteAll());
});

test('onboarded flag defaults false and can be set', () => {
    assert.equal(DB.isOnboarded(), false);
    DB.setOnboarded(true);
    assert.equal(DB.isOnboarded(), true);
});

test('addXpEvent: grants XP once per dedupeKey, a repeat with the same key is a structural no-op', () => {
    const first = DB.addXpEvent('dismiss:abc123', 100, 'alarmCompleted');
    assert.ok(first);
    assert.equal(DB.getTotalXp(), 100);
    const second = DB.addXpEvent('dismiss:abc123', 100, 'alarmCompleted');
    assert.equal(second, null); // no-op: same event, never double-counted
    assert.equal(DB.getTotalXp(), 100);
    assert.equal(DB.listXpLedger().length, 1);
});

test('addXpEvent: different dedupeKeys for the same reason both count', () => {
    DB.addXpEvent('dismiss:a', 100, 'alarmCompleted');
    DB.addXpEvent('dismiss:b', 100, 'alarmCompleted');
    assert.equal(DB.getTotalXp(), 200);
    assert.equal(DB.listXpLedger().length, 2);
});

test('hasXpEvent reflects ledger state exactly', () => {
    assert.equal(DB.hasXpEvent('achievement:first_alarm'), false);
    DB.addXpEvent('achievement:first_alarm', 20, 'achievementUnlocked');
    assert.equal(DB.hasXpEvent('achievement:first_alarm'), true);
});

test('XP ledger survives deleteAll being the thing that clears it (privacy), and is empty by default', () => {
    DB.addXpEvent('dismiss:x', 50, 'alarmCompleted');
    assert.equal(DB.getTotalXp(), 50);
    DB.deleteAll();
    assert.equal(DB.getTotalXp(), 0);
    assert.deepEqual(DB.listXpLedger(), []);
});

test('cosmetics: starts with one default icon unlocked and selected, nothing else', () => {
    const c = DB.getCosmetics();
    assert.deepEqual(c.unlockedIcons, ['🙂']);
    assert.equal(c.selectedIcon, '🙂');
    assert.deepEqual(c.unlockedTitles, []);
});

test('cosmetics: cannot select something that was never unlocked', () => {
    const before = DB.getCosmetics();
    DB.selectCosmetic('icon', '🚀'); // never unlocked
    assert.deepEqual(DB.getCosmetics(), before);
});

test('cosmetics: unlock then select works, and unlocking twice does not duplicate', () => {
    DB.unlockCosmetic('icon', '🚀');
    DB.unlockCosmetic('icon', '🚀');
    assert.deepEqual(DB.getCosmetics().unlockedIcons, ['🙂', '🚀']);
    DB.selectCosmetic('icon', '🚀');
    assert.equal(DB.getCosmetics().selectedIcon, '🚀');
});
