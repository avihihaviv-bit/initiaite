// main.js — boots the app: wires scene + room + furniture + ui together
// and drives the render loop.

(function () {
    // #app starts at opacity:0 (class="rd-boot" in index.html) and only
    // becomes visible once boot() finishes — so an uncaught exception
    // anywhere in boot() previously left the whole page permanently blank
    // with no error shown at all. This is the safety net: any boot failure
    // is caught, the most likely cause (a corrupted autosave — normally
    // screened out by RD.State.isValidState, but this covers anything
    // that check doesn't) is cleared, and a real recovery screen is shown
    // instead of silence.
    function showBootFailure(err) {
        console.error('room-designer: boot failed', err);
        try { localStorage.removeItem('rd_autosave_v1'); } catch (e) {}
        const el = document.createElement('div');
        el.setAttribute('dir', 'rtl');
        el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
            'background:#f4f1ec;color:#2b2620;font-family:Heebo,Segoe UI,system-ui,sans-serif;text-align:center;padding:24px;';
        el.innerHTML =
            '<div style="max-width:420px">' +
            '<div style="font-size:40px;margin-bottom:12px">🛠️</div>' +
            '<h2 style="margin:0 0 8px">משהו השתבש בטעינה</h2>' +
            '<p style="color:#6b6459;margin:0 0 20px;line-height:1.5">כנראה שהפרויקט השמור היה פגום. איפסנו את הנתונים השמורים אוטומטית — לחיצה על הכפתור תטען מחדש עם חדר ריק ותקין.</p>' +
            '<button id="rd-boot-retry" style="background:#b5713f;color:#fff;border:none;border-radius:7px;padding:10px 22px;font-size:14px;cursor:pointer">רענון והתחלה מחדש</button>' +
            '</div>';
        document.body.appendChild(el);
        document.getElementById('rd-boot-retry').addEventListener('click', function () { location.reload(); });
        const app = document.getElementById('app');
        if (app) app.style.display = 'none';
    }

    function boot() {
        try {
            bootInner();
        } catch (err) {
            showBootFailure(err);
        }
    }

    function bootInner() {
        // Restore whatever was last in progress (even if never explicitly
        // saved) before anything else reads state, so the initial room
        // build/camera/lighting all reflect it from the start.
        const autosave = RD.Storage.loadAutosave();
        if (autosave) RD.State.replace(autosave);
        RD.Storage.initAutosave();

        const viewport = document.getElementById('viewport');
        const ctx = RD.Scene.init(viewport);

        function rebuildRoom() {
            RD.Room.build(ctx.scene, RD.State.get().room);
            RD.Room.setGridVisible(RD.State.get().settings.gridVisible);
        }

        rebuildRoom();
        RD.Scene.applyLightingPreset(RD.State.get().lighting);
        RD.Scene.playIntro(RD.State.get().room.width, RD.State.get().room.depth, RD.State.get().room.height);

        RD.State.on('room:resized', rebuildRoom);
        RD.State.on('room:styled', function () { RD.Room.updateStyle(RD.State.get().room); });
        RD.State.on('lighting:changed', function () { RD.Scene.applyLightingPreset(RD.State.get().lighting); });
        // Covers undo/redo too, so just resync the shell — camera refocus is
        // triggered explicitly (see RD.UI) only for load/import/template/new,
        // not on every undo step, since that would be jarring mid-edit.
        RD.State.on('state:replaced', function () {
            rebuildRoom();
            RD.Scene.applyLightingPreset(RD.State.get().lighting);
        });

        RD.Furniture.init(ctx);
        RD.Labels.init(viewport, ctx);
        RD.FirstPerson.init(ctx, document.getElementById('btn-walk'), document.getElementById('walk-hint'));
        RD.UI.init();

        requestAnimationFrame(function () {
            document.getElementById('app').classList.remove('rd-boot');
        });

        let lastT = performance.now();
        RD.Scene.startLoop(function () {
            const now = performance.now();
            const dt = Math.min(0.1, (now - lastT) / 1000);
            lastT = now;
            RD.FirstPerson.tick(dt);
            RD.Room.updateWallVisibility(ctx.camera);
            RD.Furniture.tick(dt);
            RD.Labels.updateFrame();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
