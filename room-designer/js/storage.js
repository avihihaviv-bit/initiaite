// storage.js — localStorage project CRUD + JSON export/import + PNG screenshot.
// This app has no backend; everything here is client-side only.

window.RD = window.RD || {};

RD.Storage = (function () {
    const KEY = 'rd_projects_v1';

    function readAll() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('room-designer: could not read localStorage', e);
            return {};
        }
    }

    function writeAll(map) {
        try {
            localStorage.setItem(KEY, JSON.stringify(map));
            return true;
        } catch (e) {
            console.warn('room-designer: could not write localStorage', e);
            return false;
        }
    }

    function uid() {
        return 'proj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    }

    function list() {
        const all = readAll();
        return Object.keys(all).map(function (id) {
            const p = all[id];
            return { id: id, name: p.meta.name, updatedAt: p.meta.updatedAt, itemCount: (p.items || []).length };
        }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    }

    function saveAs(name) {
        const all = readAll();
        const id = uid();
        const snap = RD.State.snapshot();
        RD.State.setProjectMeta(id, name);
        snap.meta.id = id;
        snap.meta.name = name;
        snap.meta.updatedAt = Date.now();
        all[id] = snap;
        writeAll(all);
        return id;
    }

    function saveCurrent() {
        const snap = RD.State.snapshot();
        if (!snap.meta.id) return null;
        const all = readAll();
        snap.meta.updatedAt = Date.now();
        all[snap.meta.id] = snap;
        writeAll(all);
        return snap.meta.id;
    }

    function load(id) {
        const all = readAll();
        const p = all[id];
        if (!p) return false;
        RD.State.replace(p);
        RD.State.setProjectMeta(id, p.meta.name);
        return true;
    }

    function remove(id) {
        const all = readAll();
        delete all[id];
        writeAll(all);
    }

    function exportJSON() {
        const snap = RD.State.snapshot();
        const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (snap.meta.name || 'room').replace(/[^\w\-֐-׿ ]+/g, '').trim() || 'room';
        a.download = safeName + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function importJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const data = JSON.parse(reader.result);
                if (!data || !data.room || !Array.isArray(data.items)) {
                    throw new Error('קובץ לא תקין');
                }
                data.meta = data.meta || {};
                data.meta.id = null;
                RD.State.replace(data);
                if (callback) callback(true);
            } catch (e) {
                console.warn('room-designer: import failed', e);
                if (callback) callback(false, e);
            }
        };
        reader.onerror = function () { if (callback) callback(false); };
        reader.readAsText(file);
    }

    function exportPNG(renderer) {
        renderer.domElement.toBlob(function (blob) {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'room-view.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }, 'image/png');
    }

    return {
        list: list,
        saveAs: saveAs,
        saveCurrent: saveCurrent,
        load: load,
        remove: remove,
        exportJSON: exportJSON,
        importJSON: importJSON,
        exportPNG: exportPNG
    };
})();
