// firstperson.js — walk-through mode: stand inside the room at eye height
// and move around with WASD/arrows (desktop) or a touch joystick (mobile),
// looking around by dragging, instead of only orbiting from outside.

window.RD = window.RD || {};

RD.FirstPerson = (function () {
    const S = RD.State;
    const EYE_HEIGHT = 1.65;
    const BODY_RADIUS = 0.28;
    const SPEED = 2.0; // m/s, top speed once fully accelerated
    const ACCEL = 9; // how fast speed ramps up to SPEED (1/s)
    const DECEL = 12; // how fast it ramps back down to a stop (1/s)
    const LOOK_SPEED = 0.0032;
    const PITCH_LIMIT = 1.15; // radians, ~66deg up/down

    let ctx = null; // { scene, camera, renderer, controls }
    let domEl = null;
    let active = false;
    let pos = { x: 0, z: 0 };
    let yaw = 0, pitch = 0;
    let speedFactor = 0, lastDir = { x: 0, z: 0 };
    const keys = {};
    let looking = false;
    let lastLookX = 0, lastLookY = 0;
    let joystick = null; // { active, startX, startY, dx, dz }
    let savedCameraState = null;
    let els = {};

    function isActive() { return active; }

    function scaledFootprint(item) {
        const fp = RD.Furniture.getFootprint(item);
        const s = item.scale || 1;
        return { w: fp.w * s, d: fp.d * s };
    }

    function obstacleBoxes() {
        return S.get().items.map(function (it) {
            return RD.Interaction.itemBox(it.position.x, it.position.z, scaledFootprint(it), it.rotationY || 0, BODY_RADIUS);
        });
    }

    function pointInBox(x, z, b) {
        return x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
    }

    function tryMove(dx, dz) {
        const room = S.get().room;
        const bounds = RD.Room.getBounds(room);
        const obstacles = obstacleBoxes();
        const minX = bounds.minX + BODY_RADIUS, maxX = bounds.maxX - BODY_RADIUS;
        const minZ = bounds.minZ + BODY_RADIUS, maxZ = bounds.maxZ - BODY_RADIUS;

        let nx = Math.min(maxX, Math.max(minX, pos.x + dx));
        if (!obstacles.some(function (b) { return pointInBox(nx, pos.z, b); })) pos.x = nx;

        let nz = Math.min(maxZ, Math.max(minZ, pos.z + dz));
        if (!obstacles.some(function (b) { return pointInBox(pos.x, nz, b); })) pos.z = nz;
    }

    function applyCamera() {
        const room = S.get().room;
        const eyeY = Math.min(EYE_HEIGHT, Math.max(0.9, room.height - 0.25));
        ctx.camera.position.set(pos.x, eyeY, pos.z);
        const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
        ctx.camera.lookAt(pos.x + dir.x, eyeY + dir.y, pos.z + dir.z);
    }

    function onKeyDown(evt) {
        if (!active) return;
        const tag = (evt.target && evt.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        if (evt.key === 'Escape') { exit(); return; }
        // `code` is the physical key (layout-independent) — `key` would
        // report a Hebrew letter for the W/A/S/D positions on a Hebrew
        // keyboard layout, silently breaking movement.
        keys[evt.code] = true;
    }
    function onKeyUp(evt) { keys[evt.code] = false; }

    function onPointerDown(evt) {
        if (!active) return;
        if (joystick && joystick.pointerId != null) return; // joystick owns its own pointer
        looking = true;
        lastLookX = evt.clientX; lastLookY = evt.clientY;
        domEl.setPointerCapture(evt.pointerId);
    }
    function onPointerMove(evt) {
        if (!active || !looking) return;
        const dx = evt.clientX - lastLookX, dy = evt.clientY - lastLookY;
        lastLookX = evt.clientX; lastLookY = evt.clientY;
        yaw -= dx * LOOK_SPEED;
        pitch = Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, pitch - dy * LOOK_SPEED));
    }
    function onPointerUp() { looking = false; }

    // ---- Touch joystick (mobile movement) ----
    function initJoystick(container) {
        const base = document.createElement('div');
        base.className = 'rd-joystick-base';
        const knob = document.createElement('div');
        knob.className = 'rd-joystick-knob';
        base.appendChild(knob);
        container.appendChild(base);
        joystick = { el: base, knob: knob, pointerId: null, dx: 0, dz: 0 };

        base.addEventListener('pointerdown', function (evt) {
            joystick.pointerId = evt.pointerId;
            joystick.originX = evt.clientX; joystick.originY = evt.clientY;
            base.setPointerCapture(evt.pointerId);
            evt.stopPropagation();
        });
        base.addEventListener('pointermove', function (evt) {
            if (joystick.pointerId !== evt.pointerId) return;
            const maxR = 34;
            let dx = evt.clientX - joystick.originX, dy = evt.clientY - joystick.originY;
            const len = Math.hypot(dx, dy) || 1;
            const clamped = Math.min(maxR, len);
            dx = (dx / len) * clamped; dy = (dy / len) * clamped;
            knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            joystick.dx = dx / maxR; joystick.dz = dy / maxR;
            evt.stopPropagation();
        });
        function release(evt) {
            if (joystick.pointerId !== evt.pointerId) return;
            joystick.pointerId = null; joystick.dx = 0; joystick.dz = 0;
            knob.style.transform = 'translate(0,0)';
        }
        base.addEventListener('pointerup', release);
        base.addEventListener('pointercancel', release);
    }

    function tick(dt) {
        if (!active) return;
        let mx = 0, mz = 0;
        if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
        if (joystick && joystick.pointerId != null) { mx += joystick.dx; mz += joystick.dz; }

        // Eased acceleration/deceleration instead of snapping straight to
        // full speed — holding a movement key keeps the last direction
        // while ramping down smoothly the instant it's released.
        const inputLen = Math.hypot(mx, mz);
        const hasInput = inputLen > 0.001;
        if (hasInput) { lastDir.x = mx / inputLen; lastDir.z = mz / inputLen; }
        const targetFactor = hasInput ? Math.min(1, inputLen) : 0;
        const rate = targetFactor > speedFactor ? ACCEL : DECEL;
        speedFactor += (targetFactor - speedFactor) * Math.min(1, rate * dt);
        if (speedFactor < 0.001) speedFactor = 0;

        if (speedFactor > 0) {
            const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
            const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
            const step = SPEED * speedFactor * dt;
            const dx = (forward.x * -lastDir.z + right.x * lastDir.x) * step;
            const dz = (forward.z * -lastDir.z + right.z * lastDir.x) * step;
            tryMove(dx, dz);
        }
        applyCamera();
    }

    // Picks a spot to stand that isn't inside a piece of furniture — the
    // room center is often already occupied (items spawn fanning out from
    // there), so a few candidates are tried before falling back to it.
    function findEntryPoint(room) {
        const bounds = RD.Room.getBounds(room);
        const obstacles = S.get().items.map(function (it) {
            return RD.Interaction.itemBox(it.position.x, it.position.z, scaledFootprint(it), it.rotationY || 0, 0.9);
        });
        const candidates = [
            { x: 0, z: bounds.maxZ - 0.6 },
            { x: bounds.minX + 0.6, z: bounds.minZ + 0.6 },
            { x: bounds.maxX - 0.6, z: bounds.minZ + 0.6 },
            { x: bounds.minX + 0.6, z: bounds.maxZ - 0.6 },
            { x: bounds.maxX - 0.6, z: bounds.maxZ - 0.6 },
            { x: 0, z: 0 }
        ];
        for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            if (!obstacles.some(function (b) { return pointInBox(c.x, c.z, b); })) return c;
        }
        return candidates[0];
    }

    function enter() {
        if (active || !ctx) return;
        active = true;
        speedFactor = 0; lastDir.x = 0; lastDir.z = 0;
        savedCameraState = { position: ctx.camera.position.clone(), target: ctx.controls.target.clone() };
        ctx.controls.enabled = false;

        const room = S.get().room;
        const entry = findEntryPoint(room);
        pos.x = entry.x; pos.z = entry.z;
        const toCenter = { x: -pos.x, z: -pos.z };
        const len = Math.hypot(toCenter.x, toCenter.z) || 1;
        yaw = Math.atan2(toCenter.x / len, toCenter.z / len);
        pitch = 0;
        applyCamera();
        RD.Room.setCeilingOverride(true);
        RD.Furniture.setHighlightSuppressed(true);

        domEl.style.cursor = 'grab';
        domEl.addEventListener('pointerdown', onPointerDown);
        domEl.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        if ('ontouchstart' in window) initJoystick(domEl.parentElement);
        if (els.hint) els.hint.hidden = false;
        if (els.btn) { els.btn.textContent = '🚪 צא ממצב הליכה'; els.btn.classList.add('rd-btn-accent'); }
    }

    function exit() {
        if (!active) return;
        active = false;
        ctx.controls.enabled = true;
        RD.Room.setCeilingOverride(null);
        RD.Furniture.setHighlightSuppressed(false);
        if (savedCameraState) {
            ctx.camera.position.copy(savedCameraState.position);
            ctx.controls.target.copy(savedCameraState.target);
            ctx.controls.update();
        }
        domEl.style.cursor = '';
        domEl.removeEventListener('pointerdown', onPointerDown);
        domEl.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        for (const k in keys) keys[k] = false;
        if (joystick) { joystick.el.remove(); joystick = null; }
        if (els.hint) els.hint.hidden = true;
        if (els.btn) { els.btn.textContent = '🚶 הליכה בחדר'; els.btn.classList.remove('rd-btn-accent'); }
    }

    function toggle() { if (active) exit(); else enter(); }

    function init(sceneCtx, buttonEl, hintEl) {
        ctx = sceneCtx;
        domEl = ctx.renderer.domElement;
        els.btn = buttonEl;
        els.hint = hintEl;
        RD.State.on('state:replaced', function () { if (active) exit(); });
    }

    return { init: init, enter: enter, exit: exit, toggle: toggle, tick: tick, isActive: isActive };
})();
