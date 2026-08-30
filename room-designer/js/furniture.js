// furniture.js — bridges plain state.items <-> live THREE.Object3D instances.
// Owns the id -> Object3D map (Object3D instances must never leak into state.js,
// since state has to stay JSON-serializable for save/export).

window.RD = window.RD || {};

RD.Furniture = (function () {
    const S = RD.State;
    const C = RD.Catalog;
    const M = RD.Materials;
    const I = RD.Interaction;

    let scene, camera, renderer, controls, domEl;
    let itemGroup;
    const liveObjects = {}; // id -> THREE.Group

    let dragging = null; // { id, footprint }

    function init(ctx) {
        scene = ctx.scene; camera = ctx.camera; renderer = ctx.renderer; controls = ctx.controls;
        domEl = renderer.domElement;
        itemGroup = new THREE.Group();
        scene.add(itemGroup);

        wirePointerEvents();

        S.on('state:replaced', rebuildAll);
        S.on('item:added', syncFromState);
        S.on('item:deleted', syncFromState);
        S.on('item:updated', syncFromState);
        S.on('item:live', function (payload) { applyLiveTransform(payload.id); });
        S.on('selection:changed', updateHighlight);
        S.on('lighting:changed', updateLampLights);

        rebuildAll();
    }

    function clearAll() {
        Object.keys(liveObjects).forEach(function (id) { removeObject(id); });
    }

    function removeObject(id) {
        const obj = liveObjects[id];
        if (!obj) return;
        itemGroup.remove(obj);
        obj.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
            }
        });
        delete liveObjects[id];
    }

    function createObjectForItem(item) {
        const entry = C.get(item.type);
        if (!entry) return null;
        const obj = entry.build(item.color);
        obj.userData.itemId = item.id;
        obj.userData.footprint = entry.footprint;
        obj.position.set(item.position.x, item.position.y || 0, item.position.z);
        obj.rotation.y = item.rotationY || 0;
        obj.scale.setScalar(item.scale || 1);
        return obj;
    }

    function rebuildAll() {
        clearAll();
        S.get().items.forEach(function (item) {
            const obj = createObjectForItem(item);
            if (obj) { liveObjects[item.id] = obj; itemGroup.add(obj); }
        });
        updateLampLights();
        updateHighlight();
    }

    // Reconciles the live scene with state.items without a full rebuild:
    // adds new objects, removes gone ones, and refreshes transforms/colors
    // for everything still present.
    function syncFromState() {
        const items = S.get().items;
        const seen = {};
        items.forEach(function (item) {
            seen[item.id] = true;
            let obj = liveObjects[item.id];
            if (!obj) {
                obj = createObjectForItem(item);
                if (obj) { liveObjects[item.id] = obj; itemGroup.add(obj); }
                return;
            }
            obj.position.set(item.position.x, item.position.y || 0, item.position.z);
            obj.rotation.y = item.rotationY || 0;
            obj.scale.setScalar(item.scale || 1);
            const entry = C.get(item.type);
            if (entry) M.setGroupColor(obj, item.color);
        });
        Object.keys(liveObjects).forEach(function (id) {
            if (!seen[id]) removeObject(id);
        });
        updateLampLights();
        updateHighlight();
    }

    function applyLiveTransform(id) {
        const obj = liveObjects[id];
        const item = S.getItem(id);
        if (obj && item) obj.position.set(item.position.x, item.position.y || 0, item.position.z);
    }

    function updateLampLights() {
        const night = S.get().lighting.preset === 'night';
        Object.keys(liveObjects).forEach(function (id) {
            const obj = liveObjects[id];
            const light = obj.userData.lampLight;
            if (light) light.intensity = night ? 1.1 : 0;
        });
    }

    function updateHighlight() {
        const selectedId = S.get().selectedId;
        Object.keys(liveObjects).forEach(function (id) {
            const obj = liveObjects[id];
            const on = id === selectedId;
            obj.traverse(function (child) {
                if (child.isMesh && child.material && 'emissive' in child.material) {
                    if (!child.userData._baseEmissive) {
                        child.userData._baseEmissive = child.material.emissive ? child.material.emissive.getHex() : 0;
                    }
                    child.material.emissive.setHex(on ? 0x2a5a8a : child.userData._baseEmissive);
                }
            });
        });
    }

    // ---- Pointer interaction: select + drag-to-move on the canvas ----
    function wirePointerEvents() {
        domEl.addEventListener('pointerdown', onPointerDown);
        domEl.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    function pickableObjects() {
        return Object.keys(liveObjects).map(function (id) { return liveObjects[id]; });
    }

    function onPointerDown(evt) {
        if (evt.button !== undefined && evt.button !== 0) return;
        const hits = I.pickObjects(evt, domEl, camera, pickableObjects());
        if (!hits.length) {
            S.select(null);
            return;
        }
        let root = hits[0].object;
        while (root.parent && root.parent !== itemGroup) root = root.parent;
        const id = root.userData.itemId;
        S.select(id);
        dragging = { id: id, footprint: root.userData.footprint || { w: 0.4, d: 0.4 } };
        S.beginDrag(id);
        controls.enabled = false;
        domEl.setPointerCapture(evt.pointerId);
        evt.preventDefault();
    }

    function onPointerMove(evt) {
        if (!dragging) return;
        const pt = I.pickFloorPoint(evt, domEl, camera);
        if (!pt) return;
        const item = S.getItem(dragging.id);
        if (!item) return;
        const settings = S.get().settings;
        let x = settings.snapEnabled ? I.snap(pt.x, settings.snapSize) : pt.x;
        let z = settings.snapEnabled ? I.snap(pt.z, settings.snapSize) : pt.z;
        const bounds = RD.Room.getBounds(S.get().room);
        const clamped = I.clampToBounds(x, z, bounds, dragging.footprint, item.rotationY || 0);
        S.dragItemTo(dragging.id, clamped.x, clamped.z);
    }

    function onPointerUp() {
        if (!dragging) return;
        dragging = null;
        controls.enabled = true;
        S.endDrag();
    }

    // ---- Actions used by the UI panel ----
    // Successive adds fan out around room center instead of stacking exactly
    // on top of each other, so a freshly added item is always visible
    // without the user needing to drag it out first. The first item lands
    // dead center; later ones spiral outward in ascending distance order.
    const SPAWN_STEP = 0.9;
    const SPAWN_RADIUS = 2;
    const SPAWN_OFFSETS = (function () {
        const pts = [];
        for (let col = -SPAWN_RADIUS; col <= SPAWN_RADIUS; col++) {
            for (let row = -SPAWN_RADIUS; row <= SPAWN_RADIUS; row++) {
                pts.push({ x: col * SPAWN_STEP, z: row * SPAWN_STEP, d: col * col + row * row });
            }
        }
        pts.sort(function (a, b) { return a.d - b.d; });
        return pts;
    })();
    let spawnCounter = 0;

    function nextSpawnOffset() {
        const pt = SPAWN_OFFSETS[spawnCounter % SPAWN_OFFSETS.length];
        spawnCounter++;
        return { x: pt.x, z: pt.z };
    }

    function addFromCatalog(type) {
        const entry = C.get(type);
        if (!entry) return;
        const offset = nextSpawnOffset();
        const bounds = RD.Room.getBounds(S.get().room);
        const clamped = I.clampToBounds(offset.x, offset.z, bounds, entry.footprint, 0);
        S.addItem(entry, { position: { x: clamped.x, y: 0, z: clamped.z } });
    }

    function rotateSelected(deltaDeg) {
        const id = S.get().selectedId;
        if (!id) return;
        const item = S.getItem(id);
        const next = (item.rotationY || 0) + (deltaDeg * Math.PI / 180);
        S.updateItem(id, { rotationY: next });
    }

    function recolorSelected(hex) {
        const id = S.get().selectedId;
        if (!id) return;
        S.updateItem(id, { color: hex });
    }

    function rescaleSelected(scale) {
        const id = S.get().selectedId;
        if (!id) return;
        S.updateItem(id, { scale: scale });
    }

    function deleteSelected() {
        const id = S.get().selectedId;
        if (!id) return;
        S.deleteItem(id);
    }

    function duplicateSelected() {
        const id = S.get().selectedId;
        if (!id) return;
        S.duplicateItem(id);
    }

    function nudgeSelected(dx, dz) {
        const id = S.get().selectedId;
        if (!id) return;
        const item = S.getItem(id);
        const bounds = RD.Room.getBounds(S.get().room);
        const entry = C.get(item.type);
        const clamped = I.clampToBounds(item.position.x + dx, item.position.z + dz, bounds, entry.footprint, item.rotationY || 0);
        S.updateItem(id, { position: { x: clamped.x, y: item.position.y || 0, z: clamped.z } });
    }

    return {
        init: init,
        addFromCatalog: addFromCatalog,
        rotateSelected: rotateSelected,
        recolorSelected: recolorSelected,
        rescaleSelected: rescaleSelected,
        deleteSelected: deleteSelected,
        duplicateSelected: duplicateSelected,
        nudgeSelected: nudgeSelected
    };
})();
