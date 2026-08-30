// interaction.js — pointer/raycast helpers shared by furniture.js.
// Keeps the math (screen -> world, snapping, bounds clamping) in one place.

window.RD = window.RD || {};

RD.Interaction = (function () {
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeHit = new THREE.Vector3();

    function ndcFromEvent(evt, domElement) {
        const rect = domElement.getBoundingClientRect();
        pointerNDC.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
        return pointerNDC;
    }

    function pickObjects(evt, domElement, camera, objects) {
        ndcFromEvent(evt, domElement);
        raycaster.setFromCamera(pointerNDC, camera);
        return raycaster.intersectObjects(objects, true);
    }

    function pickFloorPoint(evt, domElement, camera) {
        ndcFromEvent(evt, domElement);
        raycaster.setFromCamera(pointerNDC, camera);
        const hit = raycaster.ray.intersectPlane(floorPlane, planeHit);
        return hit ? { x: planeHit.x, z: planeHit.z } : null;
    }

    function snap(value, size) {
        if (!size) return value;
        return Math.round(value / size) * size;
    }

    // Axis-aligned approximation of a rotated w x d footprint's half-extents.
    // Used both for room-bounds clamping and for overlap/clearance checks,
    // so every consumer agrees on what "how much space does this take" means.
    function aabbHalfExtents(w, d, rotationY) {
        const cos = Math.abs(Math.cos(rotationY || 0));
        const sin = Math.abs(Math.sin(rotationY || 0));
        return { hw: (w * cos + d * sin) / 2, hd: (w * sin + d * cos) / 2 };
    }

    function clampToBounds(x, z, bounds, footprint, rotationY) {
        const ext = aabbHalfExtents(footprint.w, footprint.d, rotationY);
        const minX = bounds.minX + ext.hw, maxX = bounds.maxX - ext.hw;
        const minZ = bounds.minZ + ext.hd, maxZ = bounds.maxZ - ext.hd;
        return {
            x: minX > maxX ? (bounds.minX + bounds.maxX) / 2 : Math.min(maxX, Math.max(minX, x)),
            z: minZ > maxZ ? (bounds.minZ + bounds.maxZ) / 2 : Math.min(maxZ, Math.max(minZ, z))
        };
    }

    // World-space AABB {minX,maxX,minZ,maxZ} for an item at (x,z) with a given
    // footprint and rotation, optionally grown by `pad` meters on every side
    // (a personal-space buffer for collision/clearance scoring).
    function itemBox(x, z, footprint, rotationY, pad) {
        pad = pad || 0;
        const ext = aabbHalfExtents(footprint.w, footprint.d, rotationY);
        return {
            minX: x - ext.hw - pad, maxX: x + ext.hw + pad,
            minZ: z - ext.hd - pad, maxZ: z + ext.hd + pad
        };
    }

    function boxesOverlap(a, b) {
        return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
    }

    // How deep two boxes interpenetrate on each axis (0 or negative = no
    // overlap on that axis). Useful for "how far apart are these, really".
    function overlapDepth(a, b) {
        return {
            x: Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX),
            z: Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ)
        };
    }

    return {
        pickObjects: pickObjects,
        pickFloorPoint: pickFloorPoint,
        snap: snap,
        aabbHalfExtents: aabbHalfExtents,
        clampToBounds: clampToBounds,
        itemBox: itemBox,
        boxesOverlap: boxesOverlap,
        overlapDepth: overlapDepth
    };
})();
