// labels.js — floating "what is this" pills above each placed item. DOM
// overlays (not 3D sprites) so Hebrew text stays crisp at any zoom level;
// position is re-projected from the item's 3D top-center every frame.

window.RD = window.RD || {};

RD.Labels = (function () {
    const S = RD.State;
    let container, camera, renderer;
    const nodes = {}; // id -> { el, thumb }
    const vec = new THREE.Vector3();

    function init(viewportEl, ctx) {
        camera = ctx.camera; renderer = ctx.renderer;
        container = document.createElement('div');
        container.className = 'rd-labels-layer';
        viewportEl.appendChild(container);

        S.on('state:replaced', sync);
        S.on('item:added', sync);
        S.on('item:deleted', sync);
        S.on('item:updated', sync);
        S.on('selection:changed', sync);

        sync();
    }

    function labelText(item) {
        const label = (item.locked ? '🔒 ' : '') + RD.Furniture.getLabel(item);
        const fp = RD.Furniture.getFootprint(item);
        const s = item.scale || 1;
        const wCm = Math.round(fp.w * s * 100), dCm = Math.round(fp.d * s * 100);
        return { name: label, size: wCm + '×' + dCm + ' ס״מ' };
    }

    function sync() {
        if (!container) return;
        const settings = S.get().settings;
        const show = settings.showLabels !== false;
        const selectedId = S.get().selectedId;
        const items = S.get().items;
        const seen = {};

        if (!show) {
            Object.keys(nodes).forEach(function (id) { nodes[id].el.hidden = true; });
        }

        items.forEach(function (item) {
            seen[item.id] = true;
            let entry = nodes[item.id];
            if (!entry) {
                const el = document.createElement('div');
                el.className = 'rd-item-label';
                const thumb = document.createElement('span');
                thumb.className = 'rd-item-label-thumb';
                thumb.hidden = true;
                const text = document.createElement('span');
                text.className = 'rd-item-label-text';
                el.appendChild(thumb);
                el.appendChild(text);
                container.appendChild(el);
                entry = nodes[item.id] = { el: el, thumb: thumb, text: text };
            }
            if (!show) return;
            const info = labelText(item);
            const isSelected = item.id === selectedId;
            entry.el.classList.toggle('rd-item-label-selected', isSelected);
            entry.text.textContent = isSelected ? (info.name + ' · ' + info.size) : info.name;
            if (item.photo) {
                entry.thumb.hidden = false;
                entry.thumb.style.backgroundImage = 'url(' + item.photo + ')';
            } else {
                entry.thumb.hidden = true;
            }
            entry.el.hidden = false;
        });

        Object.keys(nodes).forEach(function (id) {
            if (!seen[id]) { container.removeChild(nodes[id].el); delete nodes[id]; }
        });
    }

    function updateFrame() {
        if (!container || !camera || !renderer) return;
        const settings = S.get().settings;
        if (settings.showLabels === false) return;
        const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
        if (!w || !h) return;
        S.get().items.forEach(function (item) {
            const entry = nodes[item.id];
            if (!entry || entry.el.hidden) return;
            const fp = RD.Furniture.getFootprint(item);
            const topY = (item.position.y || 0) + fp.h * (item.scale || 1) + 0.12;
            vec.set(item.position.x, topY, item.position.z).project(camera);
            if (vec.z > 1) { entry.el.style.display = 'none'; return; }
            entry.el.style.display = '';
            const x = (vec.x * 0.5 + 0.5) * w;
            const y = (-vec.y * 0.5 + 0.5) * h;
            entry.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
        });
    }

    return { init: init, sync: sync, updateFrame: updateFrame };
})();
