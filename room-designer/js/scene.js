// scene.js — Three.js renderer/camera/lights/controls bootstrap.

window.RD = window.RD || {};

RD.Scene = (function () {
    const M = RD.Materials;
    let renderer, scene, camera, controls;
    let ambientLight, sunLight;
    let container;
    let groundMesh, skyDome;

    function skyTexture(top, bottom) {
        return M.makeCanvasTexture(function (ctx, s) {
            const g = ctx.createLinearGradient(0, 0, 0, s);
            g.addColorStop(0, top);
            g.addColorStop(1, bottom);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, s, s);
        }, 256);
    }

    function starTexture() {
        return M.makeCanvasTexture(function (ctx, s) {
            const g = ctx.createLinearGradient(0, 0, 0, s);
            g.addColorStop(0, '#050912');
            g.addColorStop(1, '#182a4a');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, s, s);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            let seed = 7;
            function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
            for (let i = 0; i < 140; i++) {
                const x = rnd() * s, y = rnd() * s * 0.75, r = rnd() * 1.1 + 0.2;
                ctx.globalAlpha = 0.4 + rnd() * 0.6;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }, 256);
    }

    // A simple low-poly tree so the outside world isn't an empty plane.
    function buildTree(scale) {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.1, 7), M.hexMat('#6b4a34', { roughness: 0.9 }));
        trunk.position.y = 0.55;
        trunk.castShadow = true;
        g.add(trunk);
        const foliageMat = M.hexMat('#3f6b3f', { roughness: 0.9 });
        [[0, 1.5, 0, 0.65], [0.3, 1.9, 0.15, 0.45], [-0.28, 1.85, -0.2, 0.4]].forEach(function (p) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(p[3], 9, 7), foliageMat);
            leaf.position.set(p[0], p[1], p[2]);
            leaf.castShadow = true;
            g.add(leaf);
        });
        g.scale.setScalar(scale);
        return g;
    }

    function buildEnvironment() {
        groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({ color: 0x8fae6e, roughness: 1 })
        );
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -0.02;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        const trees = new THREE.Group();
        let seed = 3;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2 + rnd() * 0.3;
            const radius = 10 + rnd() * 6;
            const tree = buildTree(0.9 + rnd() * 0.6);
            tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            trees.add(tree);
        }
        scene.add(trees);
    }

    function init(el) {
        container = el;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xbfd6e8);

        camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
        camera.position.set(6, 6, 8);

        // preserveDrawingBuffer is needed so the PNG-export feature can read
        // back the canvas pixels after the frame has already been presented.
        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = false;
        renderer.domElement.setAttribute('tabindex', '0');
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.minDistance = 1.5;
        controls.maxDistance = 30;
        controls.target.set(0, 1, 0);

        ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        sunLight = new THREE.DirectionalLight(0xfff2e0, 0.9);
        sunLight.position.set(6, 10, 4);
        scene.add(sunLight);

        buildEnvironment();

        if (window.ResizeObserver) {
            new ResizeObserver(handleResize).observe(container);
        } else {
            window.addEventListener('resize', handleResize);
        }
        handleResize();

        return { scene: scene, camera: camera, renderer: renderer, controls: controls };
    }

    function handleResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }

    function focusRoom(width, depth, height) {
        controls.target.set(0, height / 2, 0);
        const dist = Math.max(width, depth, height) * 1.6 + 2;
        camera.position.set(dist * 0.55, dist * 0.6, dist * 0.7);
        controls.update();
    }

    function applyLightingPreset(lighting) {
        if (lighting.preset === 'night') {
            if (scene.background && scene.background.dispose) scene.background.dispose();
            scene.background = starTexture();
            scene.fog = new THREE.Fog(0x0d1830, 12, 34);
            ambientLight.intensity = 0.16;
            ambientLight.color.set(0x8fa8ff);
            sunLight.intensity = 0.08;
            sunLight.color.set(0x8fa8ff);
            if (groundMesh) groundMesh.material.color.set(0x233a2e);
        } else {
            if (scene.background && scene.background.dispose) scene.background.dispose();
            scene.background = skyTexture('#8fbfe8', '#e8f1e0');
            scene.fog = new THREE.Fog(0xcfe0ee, 14, 36);
            ambientLight.intensity = lighting.ambientIntensity != null ? lighting.ambientIntensity : 0.65;
            ambientLight.color.set(0xffffff);
            sunLight.intensity = lighting.sunIntensity != null ? lighting.sunIntensity : 0.9;
            sunLight.color.set(0xfff2e0);
            if (groundMesh) groundMesh.material.color.set(0x8fae6e);
        }
    }

    function startLoop(onFrame) {
        function tick() {
            requestAnimationFrame(tick);
            controls.update();
            if (onFrame) onFrame();
            renderer.render(scene, camera);
        }
        tick();
    }

    function get() {
        return { scene: scene, camera: camera, renderer: renderer, controls: controls };
    }

    return {
        init: init,
        get: get,
        focusRoom: focusRoom,
        applyLightingPreset: applyLightingPreset,
        startLoop: startLoop,
        handleResize: handleResize
    };
})();
