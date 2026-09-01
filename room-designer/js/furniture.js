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
    const guideLines = {}; // 'x'|'z' -> THREE.Line, drawn while dragging near an alignment

    let dragging = null; // { id, footprint }

    // ---- Item metadata that works for both catalog and custom items ----
    function getFootprint(item) {
        if (item.isCustom) return item.footprint;
        const entry = C.get(item.type);
        return entry ? entry.footprint : { w: 0.4, d: 0.4, h: 0.4 };
    }

    function getLabel(item) {
        if (item.isCustom) return item.name || 'פריט מותאם';
        const entry = C.get(item.type);
        return entry ? entry.label : item.type;
    }

    function makeContactShadow(footprint) {
        const size = Math.max(footprint.w, footprint.d) * 1.35;
        const tex = M.makeCanvasTexture(function (ctx, s) {
            const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            g.addColorStop(0, 'rgba(0,0,0,0.32)');
            g.addColorStop(0.7, 'rgba(0,0,0,0.14)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, s, s);
        }, 128);
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(size, size),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.006;
        mesh.renderOrder = -1;
        return mesh;
    }

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

    function createObjectForItem(item, animate) {
        let obj, footprint;
        if (item.isCustom) {
            obj = RD.Custom.build(item.color, item.footprint, item.category);
            footprint = item.footprint;
        } else {
            const entry = C.get(item.type);
            if (!entry) return null;
            obj = entry.build(item.color);
            footprint = entry.footprint;
        }
        obj.userData.itemId = item.id;
        obj.userData.footprint = footprint;
        obj.position.set(item.position.x, item.position.y || 0, item.position.z);
        obj.rotation.y = item.rotationY || 0;
        obj.scale.setScalar(item.scale || 1);
        obj.add(makeContactShadow(footprint));
        obj.userData.spawnT = animate ? 0 : 1;
        return obj;
    }

    function rebuildAll() {
        clearAll();
        S.get().items.forEach(function (item) {
            const obj = createObjectForItem(item, false);
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
                obj = createObjectForItem(item, true);
                if (obj) { liveObjects[item.id] = obj; itemGroup.add(obj); }
                return;
            }
            obj.position.set(item.position.x, item.position.y || 0, item.position.z);
            obj.rotation.y = item.rotationY || 0;
            obj.scale.setScalar(item.scale || 1);
            M.setGroupColor(obj, item.color);
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

    function tintObject(obj, hex) {
        // Several builders (addLegs, shared shelf/book materials, ...) reuse
        // one material across multiple meshes. Caching the pre-tint emissive
        // per-mesh would let a second mesh sharing that material capture the
        // *already-tinted* value as its "original" and re-apply it on
        // restore, leaving the tint stuck — so the cache (and the dedup
        // guard) live on the material itself instead.
        const seen = new Set();
        obj.traverse(function (child) {
            if (!child.isMesh || !child.material || !('emissive' in child.material)) return;
            const mat = child.material;
            if (seen.has(mat)) return;
            seen.add(mat);
            if (mat.userData._baseEmissive === undefined) {
                mat.userData._baseEmissive = mat.emissive ? mat.emissive.getHex() : 0;
            }
            mat.emissive.setHex(hex == null ? mat.userData._baseEmissive : hex);
        });
    }

    let highlightSuppressed = false;
    function setHighlightSuppressed(suppressed) {
        highlightSuppressed = !!suppressed;
        updateHighlight();
    }

    // The blue selection tint reads as a subtle highlight from orbit
    // distance, but up close in first-person it would cover most of the
    // item in a garish blue — so it's suppressed entirely while walking.
    function updateHighlight() {
        const selectedId = highlightSuppressed ? null : S.get().selectedId;
        Object.keys(liveObjects).forEach(function (id) {
            tintObject(liveObjects[id], id === selectedId ? 0x2a5a8a : null);
        });
    }

    // Live check while dragging: does the item's current spot overlap any
    // other item? Tints it red as immediate feedback; the drop itself is
    // never blocked, this is guidance, not a wall.
    function checkDragOverlap(id) {
        const item = S.getItem(id);
        const obj = liveObjects[id];
        if (!item || !obj) return;
        const fp = getFootprint(item);
        const scaled = { w: fp.w * (item.scale || 1), d: fp.d * (item.scale || 1) };
        const box = I.itemBox(item.position.x, item.position.z, scaled, item.rotationY || 0, 0);
        const overlapping = S.get().items.some(function (other) {
            if (other.id === id) return false;
            const ofp = getFootprint(other);
            const oscaled = { w: ofp.w * (other.scale || 1), d: ofp.d * (other.scale || 1) };
            const obox = I.itemBox(other.position.x, other.position.z, oscaled, other.rotationY || 0, 0);
            return I.boxesOverlap(box, obox);
        });
        tintObject(obj, overlapping ? 0xb23a3a : 0x2a5a8a);
    }

    // ---- Smart alignment guides (drawn while dragging near a snap) ----
    function ensureGuideLine(axis) {
        if (guideLines[axis]) return guideLines[axis];
        const mat = new THREE.LineDashedMaterial({ color: 0xb5713f, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.9 });
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const line = new THREE.Line(geo, mat);
        line.visible = false;
        line.renderOrder = 5;
        scene.add(line);
        guideLines[axis] = line;
        return line;
    }

    function showGuides(guides, room) {
        const bounds = RD.Room.getBounds(room);
        hideGuides();
        guides.forEach(function (g) {
            const line = ensureGuideLine(g.axis);
            const pts = g.axis === 'x'
                ? [new THREE.Vector3(g.at, 0.02, bounds.minZ), new THREE.Vector3(g.at, 0.02, bounds.maxZ)]
                : [new THREE.Vector3(bounds.minX, 0.02, g.at), new THREE.Vector3(bounds.maxX, 0.02, g.at)];
            line.geometry.setFromPoints(pts);
            line.computeLineDistances();
            line.visible = true;
        });
    }

    function hideGuides() {
        Object.keys(guideLines).forEach(function (k) { guideLines[k].visible = false; });
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
        if (RD.FirstPerson && RD.FirstPerson.isActive()) return;
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
        const item = S.getItem(id);
        if (item && item.locked) return; // selectable (to reach the unlock control) but not draggable
        dragging = { id: id, footprint: root.userData.footprint || { w: 0.4, d: 0.4 }, moved: false };
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
        const room = S.get().room;
        let x = pt.x, z = pt.z;

        const align = settings.snapEnabled
            ? RD.Snapping.findSnap(dragging.id, x, z, dragging.footprint, item.rotationY || 0, room)
            : null;
        if (align && align.guides.length) {
            x = align.x; z = align.z;
            showGuides(align.guides, room);
        } else {
            if (settings.snapEnabled) { x = I.snap(x, settings.snapSize); z = I.snap(z, settings.snapSize); }
            hideGuides();
        }

        const bounds = RD.Room.getBounds(room);
        const clamped = I.clampToBounds(x, z, bounds, dragging.footprint, item.rotationY || 0);
        S.dragItemTo(dragging.id, clamped.x, clamped.z);
        dragging.moved = true;
        checkDragOverlap(dragging.id);
    }

    function onPointerUp() {
        hideGuides();
        if (!dragging) return;
        const id = dragging.id;
        const moved = dragging.moved;
        dragging = null;
        controls.enabled = true;
        S.endDrag();
        updateHighlight();
        if (moved && RD.UI && RD.UI.reportQuickCheck) RD.UI.reportQuickCheck(id);
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
        return S.addItem(entry, { position: { x: clamped.x, y: 0, z: clamped.z } });
    }

    // spec: { name, category, color, footprint:{w,d,h} in meters, photo }
    function addCustomItem(spec) {
        const offset = nextSpawnOffset();
        const bounds = RD.Room.getBounds(S.get().room);
        const clamped = I.clampToBounds(offset.x, offset.z, bounds, spec.footprint, 0);
        return S.addCustomItem(Object.assign({}, spec, { position: { x: clamped.x, y: 0, z: clamped.z } }));
    }

    // Runs the placement advisor for an existing item (catalog or custom)
    // and, if a spot was found, moves/resizes it there in one undo step.
    function placeAtBestSpot(id) {
        const item = S.getItem(id);
        if (item && item.locked) return { fits: false, reasons: ['הפריט נעול — שחררו אותו כדי להזיז אותו.'] };
        const result = RD.Advisor.findBestSpot(id);
        if (!result) return null;
        if (result.fits) {
            S.updateItem(id, { position: { x: result.x, y: 0, z: result.z }, rotationY: result.rotationY, scale: result.scale });
        }
        return result;
    }

    // Sets one real-world dimension (cm) on the selected axis; since the
    // model only has a single uniform `scale`, whichever dimension the user
    // types drives it and the other two follow proportionally.
    function setRealDimensionCm(id, axis, cmValue) {
        const item = S.getItem(id);
        if (!item || !cmValue || cmValue <= 0) return;
        const fp = getFootprint(item);
        const baseM = fp[axis];
        if (!baseM) return;
        const scale = Math.max(0.1, Math.min(4, (cmValue / 100) / baseM));
        S.updateItem(id, { scale: scale });
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
        const item = S.getItem(id);
        if (item && item.locked) { if (RD.UI) RD.UI.showToast('הפריט נעול — שחררו אותו כדי למחוק'); return; }
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
        if (item.locked) return;
        const bounds = RD.Room.getBounds(S.get().room);
        const footprint = getFootprint(item);
        const clamped = I.clampToBounds(item.position.x + dx, item.position.z + dz, bounds, footprint, item.rotationY || 0);
        S.updateItem(id, { position: { x: clamped.x, y: item.position.y || 0, z: clamped.z } });
    }

    function toggleLockSelected() {
        const id = S.get().selectedId;
        if (!id) return;
        const item = S.getItem(id);
        S.updateItem(id, { locked: !item.locked });
    }

    // Small pop-in tween when an item is added, so it doesn't just snap
    // into existence. Called once per frame from the render loop.
    function tick(dt) {
        Object.keys(liveObjects).forEach(function (id) {
            const obj = liveObjects[id];
            if (obj.userData.spawnT == null || obj.userData.spawnT >= 1) return;
            obj.userData.spawnT = Math.min(1, obj.userData.spawnT + dt / 0.22);
            const item = S.getItem(id);
            const target = item ? (item.scale || 1) : 1;
            const eased = 1 - Math.pow(1 - obj.userData.spawnT, 3);
            obj.scale.setScalar(target * (0.3 + 0.7 * eased));
        });
    }

    return {
        init: init,
        tick: tick,
        getFootprint: getFootprint,
        getLabel: getLabel,
        setHighlightSuppressed: setHighlightSuppressed,
        addFromCatalog: addFromCatalog,
        addCustomItem: addCustomItem,
        placeAtBestSpot: placeAtBestSpot,
        setRealDimensionCm: setRealDimensionCm,
        rotateSelected: rotateSelected,
        recolorSelected: recolorSelected,
        rescaleSelected: rescaleSelected,
        deleteSelected: deleteSelected,
        duplicateSelected: duplicateSelected,
        nudgeSelected: nudgeSelected,
        toggleLockSelected: toggleLockSelected
    };
})();
