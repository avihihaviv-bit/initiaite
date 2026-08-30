// room.js — builds/rebuilds the room shell (walls/floor/ceiling) from state.room.
// Dimension changes trigger a full rebuild; color/material changes update in place.

window.RD = window.RD || {};

RD.Room = (function () {
    const M = RD.Materials;
    let group = null;
    let wallEntries = []; // { mesh, normal }
    let floorMesh = null;
    let ceilingMesh = null;
    let gridHelper = null;

    function disposeObject(obj) {
        obj.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
        });
    }

    function build(scene, room) {
        if (group) {
            scene.remove(group);
            disposeObject(group);
        }
        group = new THREE.Group();
        wallEntries = [];

        const width = room.width, depth = room.depth, height = room.height;
        const thickness = 0.12;
        const halfW = width / 2, halfD = depth / 2, halfH = height / 2;

        // Floor
        const floorGeo = new THREE.PlaneGeometry(width, depth);
        const floorMat = M.hexMat(room.floorColor, { roughness: 0.9 });
        floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        floorMesh.userData.isFloor = true;
        M.applyFloorMaterial(floorMesh, room);
        group.add(floorMesh);

        // Ceiling (hidden by default so the interior stays visible from above)
        const ceilGeo = new THREE.PlaneGeometry(width, depth);
        const ceilMat = M.hexMat(room.ceilingColor, { side: THREE.DoubleSide });
        ceilingMesh = new THREE.Mesh(ceilGeo, ceilMat);
        ceilingMesh.rotation.x = Math.PI / 2;
        ceilingMesh.position.y = height;
        ceilingMesh.visible = !!room.showCeiling;
        group.add(ceilingMesh);

        // Walls: back(-z), front(+z), left(-x), right(+x)
        function addWall(w, x, z, ry, normal) {
            const geo = new THREE.BoxGeometry(w, height, thickness);
            const mesh = new THREE.Mesh(geo, M.hexMat(room.wallColor, { side: THREE.DoubleSide, roughness: 0.95 }));
            mesh.position.set(x, halfH, z);
            mesh.rotation.y = ry;
            mesh.receiveShadow = true;
            mesh.userData.isWall = true;
            group.add(mesh);
            wallEntries.push({ mesh: mesh, normal: normal.clone() });
        }

        addWall(width, 0, -halfD, 0, new THREE.Vector3(0, 0, -1));
        addWall(width, 0, halfD, 0, new THREE.Vector3(0, 0, 1));
        addWall(depth, -halfW, 0, Math.PI / 2, new THREE.Vector3(-1, 0, 0));
        addWall(depth, halfW, 0, Math.PI / 2, new THREE.Vector3(1, 0, 0));

        // Grid overlay: one line per 0.5m so it lines up with the default snap size.
        const gridSpan = Math.max(width, depth);
        const gridDivisions = Math.max(1, Math.round(gridSpan / 0.5));
        gridHelper = new THREE.GridHelper(gridSpan, gridDivisions, 0x334455, 0x334455);
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;
        gridHelper.position.y = 0.005;
        gridHelper.visible = true;
        group.add(gridHelper);

        scene.add(group);
        return group;
    }

    function updateStyle(room) {
        if (!group) return;
        M.applyFloorMaterial(floorMesh, room);
        ceilingMesh.material.color.set(room.ceilingColor);
        ceilingMesh.visible = !!room.showCeiling;
        wallEntries.forEach(function (w) { w.mesh.material.color.set(room.wallColor); });
    }

    function setGridVisible(visible) {
        if (gridHelper) gridHelper.visible = !!visible;
    }

    // Hides whichever wall(s) sit between the camera and the room interior,
    // so orbiting never leaves you staring at the outside of a wall.
    function updateWallVisibility(camera) {
        wallEntries.forEach(function (w) {
            const toCam = new THREE.Vector3().subVectors(camera.position, w.mesh.position);
            const d = toCam.dot(w.normal);
            w.mesh.visible = d <= 0.02;
        });
    }

    function getBounds(room) {
        // Inset by half the wall thickness plus a small clearance so
        // furniture can't visually clip into the inner wall face.
        const inset = 0.06 + 0.03;
        return {
            minX: -room.width / 2 + inset,
            maxX: room.width / 2 - inset,
            minZ: -room.depth / 2 + inset,
            maxZ: room.depth / 2 - inset
        };
    }

    return {
        build: build,
        updateStyle: updateStyle,
        updateWallVisibility: updateWallVisibility,
        setGridVisible: setGridVisible,
        getBounds: getBounds,
        getGroup: function () { return group; }
    };
})();
