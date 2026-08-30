// state.js — the single source of truth for a room-designer project.
// Plain, JSON-serializable data only (no THREE.Object3D references live here).
// All mutation goes through the functions below so that undo/redo and
// change notifications stay consistent.

window.RD = window.RD || {};

RD.State = (function () {
    const listeners = {};

    function on(event, cb) {
        (listeners[event] = listeners[event] || []).push(cb);
    }

    function emit(event, payload) {
        (listeners[event] || []).forEach(function (cb) { cb(payload); });
    }

    function uid() {
        return 'itm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function defaultRoom() {
        return {
            width: 4,
            depth: 5,
            height: 2.6,
            wallColor: '#e8e2d5',
            floorColor: '#c9a876',
            floorMaterial: 'solid', // 'solid' | 'wood' | 'tile'
            ceilingColor: '#f5f5f0',
            showCeiling: false
        };
    }

    function blankState(name) {
        const now = Date.now();
        return {
            meta: { id: null, name: name || 'חדר חדש', createdAt: now, updatedAt: now },
            room: defaultRoom(),
            lighting: { preset: 'day', ambientIntensity: 0.65, sunIntensity: 0.9 },
            items: [],
            selectedId: null,
            settings: { snapSize: 0.1, snapEnabled: true, gridVisible: true }
        };
    }

    let state = blankState();
    let undoStack = [];
    let redoStack = [];
    let dragSnapshot = null;
    const MAX_HISTORY = 60;

    function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

    function snapshot() { return clone(state); }

    function pushUndo(snap) {
        undoStack.push(snap);
        if (undoStack.length > MAX_HISTORY) undoStack.shift();
        redoStack = [];
    }

    // Wrap a discrete mutation (add/delete/color change/room resize/etc.)
    // so it becomes one undo step. `mutator` receives the live state object
    // and mutates it directly.
    function withHistory(mutator, eventName, payload) {
        const before = snapshot();
        mutator(state);
        state.meta.updatedAt = Date.now();
        pushUndo(before);
        emit(eventName || 'state:mutated', payload);
    }

    function get() { return state; }

    function getItem(id) {
        return state.items.find(function (it) { return it.id === id; });
    }

    // ---- Room ----
    function setRoomDims(width, depth, height) {
        withHistory(function (s) {
            s.room.width = width; s.room.depth = depth; s.room.height = height;
        }, 'room:resized');
    }

    function setRoomField(field, value) {
        withHistory(function (s) { s.room[field] = value; }, 'room:styled', { field: field });
    }

    // ---- Lighting ----
    function setLightingPreset(preset) {
        withHistory(function (s) { s.lighting.preset = preset; }, 'lighting:changed');
    }

    // ---- Items ----
    function addItem(catalogEntry, opts) {
        opts = opts || {};
        const item = {
            id: uid(),
            type: catalogEntry.type,
            position: opts.position || { x: 0, y: 0, z: 0 },
            rotationY: opts.rotationY || 0,
            scale: opts.scale || 1,
            color: opts.color || catalogEntry.defaultColor
        };
        withHistory(function (s) {
            s.items.push(item);
            s.selectedId = item.id;
        }, 'item:added', { id: item.id });
        return item;
    }

    function updateItem(id, patch) {
        withHistory(function (s) {
            const it = s.items.find(function (i) { return i.id === id; });
            if (it) Object.assign(it, patch);
        }, 'item:updated', { id: id });
    }

    function deleteItem(id) {
        withHistory(function (s) {
            s.items = s.items.filter(function (i) { return i.id !== id; });
            if (s.selectedId === id) s.selectedId = null;
        }, 'item:deleted', { id: id });
    }

    function duplicateItem(id) {
        const src = getItem(id);
        if (!src) return null;
        let copy;
        withHistory(function (s) {
            copy = clone(src);
            copy.id = uid();
            copy.position = { x: src.position.x + 0.3, y: src.position.y, z: src.position.z + 0.3 };
            s.items.push(copy);
            s.selectedId = copy.id;
        }, 'item:added', { id: copy && copy.id });
        return copy;
    }

    function select(id) {
        state.selectedId = id;
        emit('selection:changed', { id: id });
    }

    // ---- Transient drag (many updates, one undo step) ----
    function beginDrag(id) {
        dragSnapshot = snapshot();
    }

    function dragItemTo(id, x, z) {
        const it = getItem(id);
        if (!it) return;
        it.position.x = x;
        it.position.z = z;
        emit('item:live', { id: id });
    }

    function endDrag() {
        if (!dragSnapshot) return;
        // A plain click-to-select (pointerdown + pointerup with no move in
        // between) must not create a no-op undo step.
        const before = dragSnapshot;
        dragSnapshot = null;
        const changed = JSON.stringify(before.items) !== JSON.stringify(state.items);
        if (changed) {
            pushUndo(before);
            state.meta.updatedAt = Date.now();
            emit('item:updated', {});
        }
    }

    // ---- Undo / redo ----
    function undo() {
        if (!undoStack.length) return false;
        const prev = undoStack.pop();
        redoStack.push(snapshot());
        state = prev;
        emit('state:replaced');
        return true;
    }

    function redo() {
        if (!redoStack.length) return false;
        const next = redoStack.pop();
        undoStack.push(snapshot());
        state = next;
        emit('state:replaced');
        return true;
    }

    function canUndo() { return undoStack.length > 0; }
    function canRedo() { return redoStack.length > 0; }

    // ---- Full replace (load project / import / template / new) ----
    function replace(newState) {
        state = clone(newState);
        undoStack = [];
        redoStack = [];
        emit('state:replaced');
    }

    function reset(name) {
        replace(blankState(name));
    }

    // Housekeeping only (storage bookkeeping) — deliberately not part of
    // undo/redo history and does not emit a change event on its own.
    function setProjectMeta(id, name) {
        if (id !== undefined) state.meta.id = id;
        if (name !== undefined) state.meta.name = name;
    }

    return {
        on: on,
        get: get,
        getItem: getItem,
        blankState: blankState,
        setRoomDims: setRoomDims,
        setRoomField: setRoomField,
        setLightingPreset: setLightingPreset,
        addItem: addItem,
        updateItem: updateItem,
        deleteItem: deleteItem,
        duplicateItem: duplicateItem,
        select: select,
        beginDrag: beginDrag,
        dragItemTo: dragItemTo,
        endDrag: endDrag,
        undo: undo,
        redo: redo,
        canUndo: canUndo,
        canRedo: canRedo,
        replace: replace,
        reset: reset,
        setProjectMeta: setProjectMeta,
        snapshot: snapshot
    };
})();
