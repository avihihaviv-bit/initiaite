// main.js — boots the app: wires scene + room + furniture + ui together
// and drives the render loop.

(function () {
    function boot() {
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
