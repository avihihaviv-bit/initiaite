// scene.js — Three.js renderer/camera/lights/controls bootstrap.

window.RD = window.RD || {};

RD.Scene = (function () {
    let renderer, scene, camera, controls;
    let ambientLight, sunLight;
    let container;

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
            scene.background = new THREE.Color(0x0a1120);
            ambientLight.intensity = 0.16;
            ambientLight.color.set(0x8fa8ff);
            sunLight.intensity = 0.08;
            sunLight.color.set(0x8fa8ff);
        } else {
            scene.background = new THREE.Color(0xbfd6e8);
            ambientLight.intensity = lighting.ambientIntensity != null ? lighting.ambientIntensity : 0.65;
            ambientLight.color.set(0xffffff);
            sunLight.intensity = lighting.sunIntensity != null ? lighting.sunIntensity : 0.9;
            sunLight.color.set(0xfff2e0);
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
