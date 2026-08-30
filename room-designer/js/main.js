// main.js — boots the app: wires scene + room + furniture + ui together
// and drives the render loop.

(function () {
    function boot() {
        const viewport = document.getElementById('viewport');
        const ctx = RD.Scene.init(viewport);

        function rebuildRoom() {
            RD.Room.build(ctx.scene, RD.State.get().room);
            RD.Room.setGridVisible(RD.State.get().settings.gridVisible);
        }

        rebuildRoom();
        RD.Scene.applyLightingPreset(RD.State.get().lighting);
        RD.Scene.focusRoom(RD.State.get().room.width, RD.State.get().room.depth, RD.State.get().room.height);

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
        RD.UI.init();

        RD.Scene.startLoop(function () {
            RD.Room.updateWallVisibility(ctx.camera);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
