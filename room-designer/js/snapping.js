// snapping.js — smart alignment guides while dragging: snaps an item's
// edges/center to walls, the room's center line, and other items' edges,
// and reports which guide line(s) to draw. Pure geometry, no THREE/DOM here
// (furniture.js owns rendering the guide lines it returns).

window.RD = window.RD || {};

RD.Snapping = (function () {
    const THRESHOLD = 0.06; // meters — how close before it "grabs"

    function halfExtents(footprint, rotationY) {
        return RD.Interaction.aabbHalfExtents(footprint.w, footprint.d, rotationY);
    }

    function axisCandidates(axis, excludeId, room) {
        const bounds = RD.Room.getBounds(room);
        const list = [{ value: 0, source: 'center' }];
        if (axis === 'x') {
            list.push({ value: bounds.minX, source: 'wall' }, { value: bounds.maxX, source: 'wall' });
        } else {
            list.push({ value: bounds.minZ, source: 'wall' }, { value: bounds.maxZ, source: 'wall' });
        }
        RD.State.get().items.forEach(function (it) {
            if (it.id === excludeId) return;
            const fp = RD.Furniture.getFootprint(it);
            const s = it.scale || 1;
            const ext = halfExtents({ w: fp.w * s, d: fp.d * s }, it.rotationY || 0);
            const center = axis === 'x' ? it.position.x : it.position.z;
            const half = axis === 'x' ? ext.hw : ext.hd;
            list.push({ value: center, source: 'object-center' });
            list.push({ value: center - half, source: 'object-edge' });
            list.push({ value: center + half, source: 'object-edge' });
        });
        return list;
    }

    // Tries the dragged item's center and both edges against every
    // candidate on this axis; returns the closest match within THRESHOLD.
    function bestMatch(candidates, center, half) {
        let best = null;
        [{ p: center, off: 0 }, { p: center - half, off: half }, { p: center + half, off: -half }].forEach(function (probe) {
            candidates.forEach(function (c) {
                const d = Math.abs(probe.p - c.value);
                if (d <= THRESHOLD && (!best || d < best.d)) {
                    best = { d: d, target: c.value + probe.off, guideAt: c.value, source: c.source };
                }
            });
        });
        return best;
    }

    // Returns { x, z, guides } — guides is a list of {axis:'x'|'z', at:number}
    // world-space lines to draw. x/z equal the input unless a snap applied.
    function findSnap(itemId, x, z, footprint, rotationY, room) {
        const ext = halfExtents(footprint, rotationY);
        const guides = [];
        let sx = x, sz = z;

        const bx = bestMatch(axisCandidates('x', itemId, room), x, ext.hw);
        if (bx) { sx = bx.target; guides.push({ axis: 'x', at: bx.guideAt }); }

        const bz = bestMatch(axisCandidates('z', itemId, room), z, ext.hd);
        if (bz) { sz = bz.target; guides.push({ axis: 'z', at: bz.guideAt }); }

        return { x: sx, z: sz, guides: guides };
    }

    return { findSnap: findSnap };
})();
