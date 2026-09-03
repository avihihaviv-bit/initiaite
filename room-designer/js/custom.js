// custom.js — procedural shape + defaults for a user-authored item that
// isn't in the static catalog (RD.Catalog). Given only a category and real
// dimensions (meters), builds a plausible THREE.Group scaled exactly to
// those dimensions, so "bring your own product" items read as the right
// kind of furniture instead of a generic box.

window.RD = window.RD || {};

RD.Custom = (function () {
    const M = RD.Materials;
    const LEG_COLOR = '#3d2b1f';
    const METAL_COLOR = '#555555';

    function box(w, h, d, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(w, 0.01), Math.max(h, 0.01), Math.max(d, 0.01)), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function cyl(r, h, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(h, 0.01), seg || 12), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function cone(r, h, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, Math.max(h, 0.01), seg || 12), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function main(mesh) { M.tagColorable(mesh); return mesh; }

    // Category -> a sensible default real-world footprint (meters), used
    // when the user doesn't know the exact size of the product they found.
    const CATEGORY_DEFAULTS = {
        'ישיבה': { w: 0.9, d: 0.9, h: 0.85 },
        'שולחנות': { w: 1.0, d: 0.6, h: 0.45 },
        'אחסון': { w: 0.9, d: 0.45, h: 0.9 },
        'תאורה': { w: 0.3, d: 0.3, h: 1.5 },
        'מחשבים': { w: 0.55, d: 0.22, h: 0.4 },
        'עיצוב': { w: 0.4, d: 0.4, h: 0.4 }
    };

    function defaultFootprint(category) {
        const d = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS['עיצוב'];
        return { w: d.w, d: d.d, h: d.h };
    }

    function seatingLike(color, w, d, h) {
        const g = new THREE.Group();
        const seatH = h * 0.42, legH = h * 0.16;
        const seat = main(box(w, seatH, d, M.hexMat(color)));
        seat.position.y = legH + seatH / 2;
        g.add(seat);
        const backH = h - legH - seatH;
        if (backH > 0.05) {
            const back = main(box(w, backH, Math.min(d * 0.22, 0.2), M.hexMat(color)));
            back.position.set(0, legH + seatH + backH / 2, -d / 2 + Math.min(d * 0.11, 0.1));
            g.add(back);
        }
        const legMat = M.hexMat(LEG_COLOR, { roughness: 0.6 });
        const inset = Math.min(0.08, w * 0.08, d * 0.08);
        [[w / 2 - inset, d / 2 - inset], [-(w / 2 - inset), d / 2 - inset], [w / 2 - inset, -(d / 2 - inset)], [-(w / 2 - inset), -(d / 2 - inset)]].forEach(function (p) {
            const leg = cyl(Math.max(0.02, w * 0.02), legH, legMat, 8);
            leg.position.set(p[0], legH / 2, p[1]);
            g.add(leg);
        });
        return g;
    }

    function tableLike(color, w, d, h) {
        const g = new THREE.Group();
        const topT = Math.max(0.04, h * 0.06);
        const top = main(box(w, topT, d, M.hexMat(color)));
        top.position.y = h - topT / 2;
        g.add(top);
        const legMat = M.hexMat(LEG_COLOR, { roughness: 0.6 });
        const inset = Math.min(0.08, w * 0.08, d * 0.08);
        const legH = h - topT;
        [[w / 2 - inset, d / 2 - inset], [-(w / 2 - inset), d / 2 - inset], [w / 2 - inset, -(d / 2 - inset)], [-(w / 2 - inset), -(d / 2 - inset)]].forEach(function (p) {
            const leg = cyl(Math.max(0.02, Math.min(w, d) * 0.035), legH, legMat, 8);
            leg.position.set(p[0], legH / 2, p[1]);
            g.add(leg);
        });
        return g;
    }

    function storageLike(color, w, d, h) {
        const g = new THREE.Group();
        const body = main(box(w, h, d, M.hexMat(color)));
        body.position.y = h / 2;
        g.add(body);
        const seam = box(Math.max(0.015, w * 0.015), h * 0.94, d + 0.02, M.hexMat('#00000040', { roughness: 1, metalness: 0 }));
        seam.position.y = h / 2;
        g.add(seam);
        const handleMat = M.hexMat(METAL_COLOR, { metalness: 0.6, roughness: 0.3 });
        [-1, 1].forEach(function (side) {
            const handle = cyl(0.012, h * 0.12, handleMat, 8);
            handle.rotation.z = Math.PI / 2;
            handle.position.set(side * w * 0.14, h * 0.55, d / 2 + 0.01);
            g.add(handle);
        });
        return g;
    }

    function lightingLike(color, w, d, h) {
        const g = new THREE.Group();
        const baseR = Math.max(0.06, Math.min(w, d) / 2);
        const base = cyl(baseR, h * 0.025, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 16);
        base.position.y = h * 0.0125;
        g.add(base);
        const poleH = h * 0.82;
        const pole = cyl(Math.max(0.012, baseR * 0.12), poleH, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 8);
        pole.position.y = h * 0.025 + poleH / 2;
        g.add(pole);
        const shadeH = h - h * 0.025 - poleH;
        const shade = main(cone(Math.max(baseR * 1.1, 0.1), Math.max(shadeH, 0.08), M.hexMat(color, { roughness: 0.6 }), 16));
        shade.position.y = h - Math.max(shadeH, 0.08) / 2;
        g.add(shade);
        const light = new THREE.PointLight(0xffe4b0, 0, h * 3, 2);
        light.position.y = h * 0.9;
        light.userData.isLampLight = true;
        g.add(light);
        g.userData.lampLight = light;
        return g;
    }

    // A flat-screen-on-stand shape — reads as a monitor/PC/laptop-style
    // "computers" item rather than a generic box, for whatever exact
    // electronics product the user is placing.
    function electronicsLike(color, w, d, h) {
        const g = new THREE.Group();
        const standH = h * 0.28;
        const baseR = Math.max(0.05, Math.min(w, d) * 0.35);
        const base = cyl(baseR, h * 0.02, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 16);
        base.position.y = h * 0.01;
        g.add(base);
        const neck = cyl(Math.max(0.012, baseR * 0.25), standH, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 8);
        neck.position.y = h * 0.02 + standH / 2;
        g.add(neck);
        const screenH = h - standH - h * 0.02;
        const screenD = Math.max(0.015, d * 0.15);
        const bezel = main(box(w, screenH, screenD, M.hexMat(color, { roughness: 0.5 })));
        bezel.position.y = standH + h * 0.02 + screenH / 2;
        g.add(bezel);
        const screen = box(w * 0.92, screenH * 0.88, 0.004, M.hexMat('#1a2230', { roughness: 0.3, metalness: 0.2 }));
        screen.position.set(0, bezel.position.y, screenD / 2 + 0.003);
        g.add(screen);
        return g;
    }

    function decorLike(color, w, d, h) {
        const g = new THREE.Group();
        if (h <= 0.08) {
            // Flat, mat/rug-like item.
            const mat = main(box(w, Math.max(h, 0.015), d, M.hexMat(color, { roughness: 1 })));
            mat.position.y = Math.max(h, 0.015) / 2;
            mat.receiveShadow = true;
            g.add(mat);
        } else {
            const body = main(box(w, h, d, M.hexMat(color, { roughness: 0.8 })));
            body.position.y = h / 2;
            g.add(body);
        }
        return g;
    }

    const BUILDERS = {
        'ישיבה': seatingLike,
        'שולחנות': tableLike,
        'אחסון': storageLike,
        'תאורה': lightingLike,
        'מחשבים': electronicsLike,
        'עיצוב': decorLike
    };

    // If the user uploaded a reference photo, put it on the item's front
    // face as a real texture instead of leaving every custom item a flat
    // color — the closest thing to "make it look like the actual product"
    // without fabricating 3D reconstruction from a single photo. Sized
    // from the built shape's own bounding box, so it fits whatever category
    // shape it's attached to.
    function applyPhotoFace(group, photoDataUrl) {
        const box3 = new THREE.Box3().setFromObject(group);
        const size = box3.getSize(new THREE.Vector3());
        const center = box3.getCenter(new THREE.Vector3());
        const faceW = Math.max(0.05, size.x * 0.94);
        const faceH = Math.max(0.05, size.y * 0.94);
        const texture = new THREE.TextureLoader().load(photoDataUrl);
        texture.colorSpace = THREE.SRGBColorSpace || texture.colorSpace;
        const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75, metalness: 0 });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(faceW, faceH), mat);
        plane.position.set(center.x, center.y, box3.max.z + 0.004);
        plane.renderOrder = 1;
        group.add(plane);
        return group;
    }

    function build(color, footprint, category, photo) {
        const fn = BUILDERS[category] || decorLike;
        const group = fn(color, Math.max(footprint.w, 0.05), Math.max(footprint.d, 0.05), Math.max(footprint.h, 0.03));
        if (photo) applyPhotoFace(group, photo);
        return group;
    }

    return {
        CATEGORY_DEFAULTS: CATEGORY_DEFAULTS,
        defaultFootprint: defaultFootprint,
        build: build
    };
})();
