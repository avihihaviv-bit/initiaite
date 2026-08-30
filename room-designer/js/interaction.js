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

    function clampToBounds(x, z, bounds, footprint, rotationY) {
        // Use an axis-aligned approximation of the rotated footprint's extent.
        const cos = Math.abs(Math.cos(rotationY));
        const sin = Math.abs(Math.sin(rotationY));
        const halfW = (footprint.w * cos + footprint.d * sin) / 2;
        const halfD = (footprint.w * sin + footprint.d * cos) / 2;
        const minX = bounds.minX + halfW, maxX = bounds.maxX - halfW;
        const minZ = bounds.minZ + halfD, maxZ = bounds.maxZ - halfD;
        return {
            x: minX > maxX ? (bounds.minX + bounds.maxX) / 2 : Math.min(maxX, Math.max(minX, x)),
            z: minZ > maxZ ? (bounds.minZ + bounds.maxZ) / 2 : Math.min(maxZ, Math.max(minZ, z))
        };
    }

    return {
        pickObjects: pickObjects,
        pickFloorPoint: pickFloorPoint,
        snap: snap,
        clampToBounds: clampToBounds
    };
})();
