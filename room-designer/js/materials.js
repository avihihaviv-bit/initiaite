// materials.js — material helpers and procedurally generated canvas textures
// (no external image assets are used anywhere in this app).

window.RD = window.RD || {};

RD.Materials = (function () {
    function hexMat(color, opts) {
        opts = opts || {};
        return new THREE.MeshStandardMaterial(Object.assign({
            color: color,
            roughness: 0.85,
            metalness: 0.05
        }, opts));
    }

    // Marks a mesh's material as the one the user can recolor from the UI.
    function tagColorable(mesh) {
        mesh.userData.colorable = true;
        return mesh;
    }

    // Applies a color to every "colorable" mesh inside a group.
    function setGroupColor(group, hex) {
        group.traverse(function (child) {
            if (child.isMesh && child.userData && child.userData.colorable) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    if (m && m.color) m.color.set(hex);
                    if (m && m.map) { m.map.dispose(); m.map = null; m.needsUpdate = true; }
                });
            }
        });
    }

    function makeCanvasTexture(draw, size) {
        size = size || 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        draw(ctx, size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    function woodTexture(base, grain) {
        base = base || '#a97a4a';
        grain = grain || '#6b4a2a';
        return makeCanvasTexture(function (ctx, size) {
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = grain;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 20; i++) {
                const y = (i / 20) * size + (Math.sin(i) * 4);
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x <= size; x += 16) {
                    ctx.lineTo(x, y + Math.sin(x * 0.06 + i) * 5);
                }
                ctx.lineWidth = 1 + (i % 3);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        });
    }

    function tileTexture(base, line, cells) {
        base = base || '#d8d3c8';
        line = line || '#a8a196';
        cells = cells || 4;
        return makeCanvasTexture(function (ctx, size) {
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = line;
            ctx.lineWidth = 3;
            const step = size / cells;
            for (let i = 0; i <= cells; i++) {
                ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
            }
        });
    }

    function applyFloorMaterial(mesh, room) {
        const mat = mesh.material;
        if (mat.map) { mat.map.dispose(); mat.map = null; }
        if (room.floorMaterial === 'wood') {
            const tex = woodTexture(room.floorColor, '#00000055');
            tex.repeat.set(room.width, room.depth);
            mat.map = tex;
            mat.color.set('#ffffff');
        } else if (room.floorMaterial === 'tile') {
            const tex = tileTexture(room.floorColor, '#00000033', 4);
            tex.repeat.set(room.width, room.depth);
            mat.map = tex;
            mat.color.set('#ffffff');
        } else {
            mat.color.set(room.floorColor);
        }
        mat.needsUpdate = true;
    }

    return {
        hexMat: hexMat,
        tagColorable: tagColorable,
        setGroupColor: setGroupColor,
        makeCanvasTexture: makeCanvasTexture,
        woodTexture: woodTexture,
        tileTexture: tileTexture,
        applyFloorMaterial: applyFloorMaterial
    };
})();
