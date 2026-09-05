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
