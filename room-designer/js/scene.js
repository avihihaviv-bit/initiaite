// scene.js — Three.js renderer/camera/lights/controls bootstrap.

window.RD = window.RD || {};

RD.Scene = (function () {
    const M = RD.Materials;
    let renderer, scene, camera, controls;
    let ambientLight, sunLight;
    let container;
    let groundMesh, mountainMat, celestialSprite;

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

    function groundTexture(base, speck) {
        return M.makeCanvasTexture(function (ctx, s) {
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, s, s);
            let seed = 11;
            function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
            ctx.fillStyle = speck;
            for (let i = 0; i < 700; i++) {
                const x = rnd() * s, y = rnd() * s, r = rnd() * 2.4 + 0.4;
                ctx.globalAlpha = 0.12 + rnd() * 0.22;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }, 256);
    }

    // A soft radial-gradient billboard for the sun/moon glow.
    function glowSprite(inner, size) {
        const tex = M.makeCanvasTexture(function (ctx, s) {
            const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
            g.addColorStop(0, inner);
            g.addColorStop(0.35, inner);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, s, s);
        }, 128);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
        sprite.scale.set(size, size, 1);
        sprite.renderOrder = -2;
        return sprite;
    }

    // A distant, hazy mountain ring so the horizon has depth instead of
    // ending abruptly at the tree line.
    function buildMountainRing() {
        const group = new THREE.Group();
        mountainMat = M.hexMat('#9db2d1', { roughness: 1 });
        let seed = 21;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        for (let i = 0; i < 11; i++) {
            const angle = (i / 11) * Math.PI * 2 + rnd() * 0.25;
            const radius = 30 + rnd() * 12;
            const h = 5 + rnd() * 6, r = 7 + rnd() * 5;
            const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mountainMat);
            peak.position.set(Math.cos(angle) * radius, h / 2 - 1.2, Math.sin(angle) * radius);
            group.add(peak);
        }
        return group;
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
        const groundTex = groundTexture('#8fae6e', '#6f9350');
        groundTex.repeat.set(26, 26);
        groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(90, 90),
            new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
        );
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -0.02;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        scene.add(buildMountainRing());

        celestialSprite = glowSprite('rgba(255,244,214,0.95)', 14);
        celestialSprite.position.set(-16, 20, -22);
        scene.add(celestialSprite);

        const trees = new THREE.Group();
        let seed = 3;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        for (let i = 0; i < 18; i++) {
            const angle = (i / 18) * Math.PI * 2 + rnd() * 0.3;
            const radius = 9 + rnd() * 9;
            const tree = buildTree(0.8 + rnd() * 0.7);
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

    // A one-time establishing shot on first load: sweeps in from a wide,
    // elevated view down to the normal focused position instead of just
    // snapping there. Skipped for prefers-reduced-motion.
    function playIntro(width, depth, height) {
        const target = new THREE.Vector3(0, height / 2, 0);
        const dist = Math.max(width, depth, height) * 1.6 + 2;
        const finalPos = new THREE.Vector3(dist * 0.55, dist * 0.6, dist * 0.7);

        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.target.copy(target);
        if (reduced) {
            camera.position.copy(finalPos);
            controls.update();
            return;
        }

        const startPos = new THREE.Vector3(finalPos.x * 2.4, finalPos.y * 1.9 + 5, finalPos.z * 2.4);
        camera.position.copy(startPos);
        controls.update();
        controls.enabled = false;
        const duration = 1600;
        const startTime = performance.now();
        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
        function step(now) {
            const t = Math.min(1, (now - startTime) / duration);
            camera.position.lerpVectors(startPos, finalPos, easeOutCubic(t));
            controls.update();
            if (t < 1) requestAnimationFrame(step);
            else controls.enabled = true;
        }
        requestAnimationFrame(step);
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
            if (groundMesh) groundMesh.material.color.set(0x2e4a3a);
            if (mountainMat) mountainMat.color.set(0x121b32);
            if (celestialSprite) {
                celestialSprite.material.map.dispose();
                const tex = M.makeCanvasTexture(function (ctx, s) {
                    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
                    g.addColorStop(0, 'rgba(226,232,255,0.95)');
                    g.addColorStop(0.35, 'rgba(226,232,255,0.9)');
                    g.addColorStop(1, 'rgba(226,232,255,0)');
                    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
                }, 128);
                celestialSprite.material.map = tex;
                celestialSprite.scale.set(6, 6, 1);
                celestialSprite.position.set(14, 16, -20);
            }
        } else {
            if (scene.background && scene.background.dispose) scene.background.dispose();
            scene.background = skyTexture('#8fbfe8', '#e8f1e0');
            scene.fog = new THREE.Fog(0xcfe0ee, 14, 36);
            ambientLight.intensity = lighting.ambientIntensity != null ? lighting.ambientIntensity : 0.65;
            ambientLight.color.set(0xffffff);
            sunLight.intensity = lighting.sunIntensity != null ? lighting.sunIntensity : 0.9;
            sunLight.color.set(0xfff2e0);
            if (groundMesh) groundMesh.material.color.set(0xffffff);
            if (mountainMat) mountainMat.color.set(0x9db2d1);
            if (celestialSprite) {
                celestialSprite.material.map.dispose();
                const tex = M.makeCanvasTexture(function (ctx, s) {
                    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
                    g.addColorStop(0, 'rgba(255,244,214,0.95)');
                    g.addColorStop(0.35, 'rgba(255,244,214,0.9)');
                    g.addColorStop(1, 'rgba(255,244,214,0)');
                    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
                }, 128);
                celestialSprite.material.map = tex;
                celestialSprite.scale.set(14, 14, 1);
                celestialSprite.position.set(-16, 20, -22);
            }
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
        playIntro: playIntro,
        applyLightingPreset: applyLightingPreset,
        startLoop: startLoop,
        handleResize: handleResize
    };
})();
