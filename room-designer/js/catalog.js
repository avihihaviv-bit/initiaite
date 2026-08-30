// catalog.js — furniture catalog metadata + parametric THREE.Group builders.
// Every item is built from primitive geometry only (no external model files).

window.RD = window.RD || {};

RD.Catalog = (function () {
    const M = RD.Materials;
    const LEG_COLOR = '#3d2b1f';
    const METAL_COLOR = '#555555';

    function box(w, h, d, mat) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function cyl(rt, rb, h, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function sphere(r, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 12, seg || 10), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function cone(r, h, mat, seg) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 12), mat);
        mesh.castShadow = true; mesh.receiveShadow = true;
        return mesh;
    }
    function main(mesh) { M.tagColorable(mesh); return mesh; }

    function addLegs(group, hw, hd, topY, legH, legR, inset) {
        inset = inset == null ? 0.05 : inset;
        const legMat = M.hexMat(LEG_COLOR, { roughness: 0.6 });
        const pts = [[hw - inset, hd - inset], [-(hw - inset), hd - inset], [hw - inset, -(hd - inset)], [-(hw - inset), -(hd - inset)]];
        pts.forEach(function (p) {
            const leg = cyl(legR, legR, legH, legMat, 8);
            leg.position.set(p[0], topY - legH / 2, p[1]);
            group.add(leg);
        });
    }

    // ---- Seating ----
    function buildSofa(color) {
        const g = new THREE.Group();
        const seat = main(box(1.9, 0.4, 0.85, M.hexMat(color)));
        seat.position.y = 0.34;
        g.add(seat);
        const back = main(box(1.9, 0.55, 0.2, M.hexMat(color)));
        back.position.set(0, 0.34 + 0.2 + 0.275, -0.85 / 2 + 0.1);
        g.add(back);
        [-1, 1].forEach(function (side) {
            const arm = main(box(0.2, 0.5, 0.85, M.hexMat(color)));
            arm.position.set(side * (1.9 / 2 - 0.1), 0.14 + 0.25, 0);
            g.add(arm);
        });
        addLegs(g, 1.9 / 2, 0.85 / 2, 0.14, 0.14, 0.035, 0.1);
        return g;
    }

    function buildArmchair(color) {
        const g = new THREE.Group();
        const seat = main(box(0.8, 0.38, 0.8, M.hexMat(color)));
        seat.position.y = 0.34;
        g.add(seat);
        const back = main(box(0.8, 0.55, 0.18, M.hexMat(color)));
        back.position.set(0, 0.34 + 0.2 + 0.275, -0.8 / 2 + 0.09);
        g.add(back);
        [-1, 1].forEach(function (side) {
            const arm = main(box(0.16, 0.45, 0.8, M.hexMat(color)));
            arm.position.set(side * (0.8 / 2 - 0.08), 0.14 + 0.225, 0);
            g.add(arm);
        });
        addLegs(g, 0.8 / 2, 0.8 / 2, 0.14, 0.14, 0.03, 0.08);
        return g;
    }

    function buildDiningChair(color) {
        const g = new THREE.Group();
        const seat = main(box(0.42, 0.06, 0.42, M.hexMat(color)));
        seat.position.y = 0.46;
        g.add(seat);
        const back = main(box(0.42, 0.5, 0.06, M.hexMat(color)));
        back.position.set(0, 0.46 + 0.28, -0.42 / 2 + 0.03);
        g.add(back);
        addLegs(g, 0.42 / 2, 0.42 / 2, 0.43, 0.43, 0.022, 0.02);
        return g;
    }

    // ---- Tables ----
    function buildDiningTable(color) {
        const g = new THREE.Group();
        const top = main(box(1.6, 0.06, 0.9, M.hexMat(color)));
        top.position.y = 0.75;
        g.add(top);
        addLegs(g, 1.6 / 2, 0.9 / 2, 0.72, 0.72, 0.04, 0.08);
        return g;
    }

    function buildCoffeeTable(color) {
        const g = new THREE.Group();
        const top = main(box(1.0, 0.05, 0.55, M.hexMat(color)));
        top.position.y = 0.4;
        g.add(top);
        addLegs(g, 1.0 / 2, 0.55 / 2, 0.375, 0.375, 0.03, 0.05);
        return g;
    }

    function buildDesk(color) {
        const g = new THREE.Group();
        const top = main(box(1.2, 0.05, 0.6, M.hexMat(color)));
        top.position.y = 0.74;
        g.add(top);
        const drawer = main(box(0.35, 0.3, 0.55, M.hexMat(color).clone()));
        drawer.position.set(0.35, 0.56, 0);
        g.add(drawer);
        addLegs(g, 1.2 / 2, 0.6 / 2, 0.715, 0.715, 0.03, 0.06);
        return g;
    }

    // ---- Bedroom ----
    function buildBed(color, width) {
        const g = new THREE.Group();
        const frame = box(width, 0.28, 2.0, M.hexMat(LEG_COLOR, { roughness: 0.7 }));
        frame.position.y = 0.14;
        g.add(frame);
        const mattress = main(box(width - 0.06, 0.22, 1.94, M.hexMat(color)));
        mattress.position.y = 0.28 + 0.11;
        g.add(mattress);
        const headboard = box(width, 0.65, 0.08, M.hexMat(LEG_COLOR, { roughness: 0.7 }));
        headboard.position.set(0, 0.325, -2.0 / 2 + 0.04);
        g.add(headboard);
        const pillowMat = M.hexMat('#ffffff', { roughness: 0.9 });
        [-1, 1].forEach(function (side) {
            const pillow = box(width / 2 - 0.1, 0.1, 0.35, pillowMat.clone());
            pillow.position.set(side * (width / 4), 0.28 + 0.22 + 0.05, -2.0 / 2 + 0.35);
            g.add(pillow);
        });
        return g;
    }

    // ---- Storage ----
    function buildWardrobe(color) {
        const g = new THREE.Group();
        const body = main(box(1.2, 2.0, 0.6, M.hexMat(color)));
        body.position.y = 1.0;
        g.add(body);
        const seam = box(0.02, 1.9, 0.62, M.hexMat('#00000040', { roughness: 1, metalness: 0 }));
        seam.position.y = 1.0;
        g.add(seam);
        [-0.28, 0.28].forEach(function (x) {
            const handle = cyl(0.015, 0.015, 0.2, M.hexMat(METAL_COLOR, { metalness: 0.6, roughness: 0.3 }), 8);
            handle.rotation.z = Math.PI / 2;
            handle.position.set(x, 1.0, 0.31);
            g.add(handle);
        });
        return g;
    }

    function buildDresser(color) {
        const g = new THREE.Group();
        const body = main(box(1.0, 0.85, 0.5, M.hexMat(color)));
        body.position.y = 0.425;
        g.add(body);
        for (let i = 0; i < 3; i++) {
            const drawerFace = box(0.9, 0.22, 0.02, M.hexMat(color).clone());
            drawerFace.position.set(0, 0.15 + i * 0.26, 0.26);
            g.add(drawerFace);
            const handle = cyl(0.012, 0.012, 0.14, M.hexMat(METAL_COLOR, { metalness: 0.6, roughness: 0.3 }), 6);
            handle.rotation.z = Math.PI / 2;
            handle.position.set(0, 0.15 + i * 0.26, 0.28);
            g.add(handle);
        }
        return g;
    }

    function buildTvStand(color) {
        const g = new THREE.Group();
        const stand = main(box(1.4, 0.45, 0.42, M.hexMat(color)));
        stand.position.y = 0.225;
        g.add(stand);
        const screen = box(1.1, 0.6, 0.04, M.hexMat('#111111', { roughness: 0.4, metalness: 0.2 }));
        screen.position.set(0, 0.45 + 0.3, -0.05);
        g.add(screen);
        const bezel = box(1.14, 0.64, 0.02, M.hexMat('#222222'));
        bezel.position.set(0, 0.45 + 0.3, -0.07);
        g.add(bezel);
        return g;
    }

    function buildBookshelf(color) {
        const g = new THREE.Group();
        const frame = main(box(0.9, 1.8, 0.32, M.hexMat(color)));
        frame.position.y = 0.9;
        g.add(frame);
        const shelfMat = M.hexMat(color).clone();
        for (let i = 1; i < 4; i++) {
            const shelf = box(0.84, 0.03, 0.28, shelfMat);
            shelf.position.set(0, i * 0.42, 0.02);
            g.add(shelf);
        }
        const bookColors = ['#b5533c', '#4a7a6b', '#d9a441', '#5b7c99', '#8a6b52'];
        for (let row = 0; row < 3; row++) {
            let x = -0.36;
            for (let i = 0; i < 5; i++) {
                const w = 0.06 + (i % 2) * 0.02;
                const h = 0.28 + (i % 3) * 0.03;
                const bk = box(w, h, 0.22, M.hexMat(bookColors[(row + i) % bookColors.length]));
                bk.position.set(x + w / 2, row * 0.42 + 0.16 + h / 2, 0.02);
                g.add(bk);
                x += w + 0.015;
            }
        }
        return g;
    }

    // ---- Decor / Lighting ----
    function buildRug(color) {
        const g = new THREE.Group();
        const rug = main(box(2.2, 0.02, 1.5, M.hexMat(color, { roughness: 1 })));
        rug.position.y = 0.011;
        rug.receiveShadow = true;
        g.add(rug);
        return g;
    }

    function buildFloorLamp(color) {
        const g = new THREE.Group();
        const base = cyl(0.18, 0.2, 0.04, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 16);
        base.position.y = 0.02;
        g.add(base);
        const pole = cyl(0.02, 0.02, 1.4, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 8);
        pole.position.y = 0.04 + 0.7;
        g.add(pole);
        const shade = main(cone(0.22, 0.3, M.hexMat(color, { roughness: 0.6 }), 16));
        shade.position.y = 1.4 + 0.19;
        g.add(shade);
        const light = new THREE.PointLight(0xffe4b0, 0, 4.5, 2);
        light.position.y = 1.35;
        light.userData.isLampLight = true;
        g.add(light);
        g.userData.lampLight = light;
        return g;
    }

    function buildTableLamp(color) {
        const g = new THREE.Group();
        const base = cyl(0.09, 0.11, 0.03, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 16);
        base.position.y = 0.015;
        g.add(base);
        const pole = cyl(0.012, 0.012, 0.22, M.hexMat(METAL_COLOR, { metalness: 0.5, roughness: 0.4 }), 8);
        pole.position.y = 0.03 + 0.11;
        g.add(pole);
        const shade = main(cone(0.12, 0.16, M.hexMat(color, { roughness: 0.6 }), 16));
        shade.position.y = 0.25 + 0.1;
        g.add(shade);
        const light = new THREE.PointLight(0xffe4b0, 0, 2.2, 2);
        light.position.y = 0.3;
        light.userData.isLampLight = true;
        g.add(light);
        g.userData.lampLight = light;
        return g;
    }

    function buildPlant(color) {
        const g = new THREE.Group();
        const pot = main(cyl(0.16, 0.13, 0.28, M.hexMat(color, { roughness: 0.9 }), 12));
        pot.position.y = 0.14;
        g.add(pot);
        const foliageMat = M.hexMat('#3f6b3f', { roughness: 0.9 });
        const positions = [[0, 0.65, 0, 0.22], [0.1, 0.55, 0.08, 0.16], [-0.12, 0.5, -0.06, 0.15], [0.05, 0.78, -0.08, 0.14]];
        positions.forEach(function (p) {
            const leaf = sphere(p[3], foliageMat, 8);
            leaf.position.set(p[0], p[1], p[2]);
            g.add(leaf);
        });
        return g;
    }

    // ---- Registry ----
    const ITEMS = [
        { type: 'sofa', label: 'ספה', category: 'ישיבה', footprint: { w: 1.9, d: 0.95, h: 0.95 }, defaultColor: '#5b7c99', build: buildSofa },
        { type: 'armchair', label: 'כורסה', category: 'ישיבה', footprint: { w: 0.8, d: 0.8, h: 0.9 }, defaultColor: '#8a6b52', build: buildArmchair },
        { type: 'diningChair', label: 'כיסא', category: 'ישיבה', footprint: { w: 0.42, d: 0.42, h: 0.9 }, defaultColor: '#6b4a34', build: buildDiningChair },
        { type: 'diningTable', label: 'שולחן אוכל', category: 'שולחנות', footprint: { w: 1.6, d: 0.9, h: 0.75 }, defaultColor: '#7a5230', build: buildDiningTable },
        { type: 'coffeeTable', label: 'שולחן סלון', category: 'שולחנות', footprint: { w: 1.0, d: 0.55, h: 0.4 }, defaultColor: '#8a6b52', build: buildCoffeeTable },
        { type: 'desk', label: 'שולחן כתיבה', category: 'שולחנות', footprint: { w: 1.2, d: 0.6, h: 0.75 }, defaultColor: '#6b4a34', build: buildDesk },
        { type: 'bedSingle', label: 'מיטה יחיד', category: 'חדר שינה', footprint: { w: 1.0, d: 2.0, h: 0.55 }, defaultColor: '#c9d6e0', build: function (c) { return buildBed(c, 1.0); } },
        { type: 'bedDouble', label: 'מיטה זוגית', category: 'חדר שינה', footprint: { w: 1.6, d: 2.0, h: 0.55 }, defaultColor: '#c9d6e0', build: function (c) { return buildBed(c, 1.6); } },
        { type: 'wardrobe', label: 'ארון בגדים', category: 'אחסון', footprint: { w: 1.2, d: 0.6, h: 2.0 }, defaultColor: '#e8e2d5', build: buildWardrobe },
        { type: 'dresser', label: 'שידה', category: 'אחסון', footprint: { w: 1.0, d: 0.5, h: 0.85 }, defaultColor: '#e8e2d5', build: buildDresser },
        { type: 'tvStand', label: 'מזנון טלוויזיה', category: 'אחסון', footprint: { w: 1.4, d: 0.45, h: 0.5 }, defaultColor: '#3a3a3a', build: buildTvStand },
        { type: 'bookshelf', label: 'ספרייה', category: 'אחסון', footprint: { w: 0.9, d: 0.32, h: 1.8 }, defaultColor: '#7a5230', build: buildBookshelf },
        { type: 'rug', label: 'שטיח', category: 'עיצוב', footprint: { w: 2.2, d: 1.5, h: 0.02 }, defaultColor: '#b5533c', build: buildRug },
        { type: 'floorLamp', label: 'מנורת רצפה', category: 'תאורה', footprint: { w: 0.4, d: 0.4, h: 1.6 }, defaultColor: '#f2c14e', build: buildFloorLamp },
        { type: 'tableLamp', label: 'מנורת שולחן', category: 'תאורה', footprint: { w: 0.25, d: 0.25, h: 0.4 }, defaultColor: '#f2c14e', build: buildTableLamp },
        { type: 'plant', label: 'עציץ', category: 'עיצוב', footprint: { w: 0.35, d: 0.35, h: 0.9 }, defaultColor: '#a6664b', build: buildPlant }
    ];

    function get(type) {
        return ITEMS.find(function (i) { return i.type === type; });
    }

    function categories() {
        const seen = [];
        ITEMS.forEach(function (i) { if (seen.indexOf(i.category) === -1) seen.push(i.category); });
        return seen;
    }

    return { ITEMS: ITEMS, get: get, categories: categories };
})();
