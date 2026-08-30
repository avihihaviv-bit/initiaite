// templates.js — starter room presets (room shell + a curated furniture layout).
// Applying one calls RD.State.replace(...) with a fully-formed project.

window.RD = window.RD || {};

RD.Templates = (function () {
    function item(type, x, z, rotationDeg, color) {
        const entry = RD.Catalog.get(type);
        return {
            id: 'itm-' + type + '-' + Math.random().toString(36).slice(2, 8),
            type: type,
            position: { x: x, y: 0, z: z },
            rotationY: (rotationDeg || 0) * Math.PI / 180,
            scale: 1,
            color: color || (entry ? entry.defaultColor : '#888888')
        };
    }

    function baseState(name, room, items) {
        const now = Date.now();
        return {
            meta: { name: name, createdAt: now, updatedAt: now },
            room: Object.assign({
                width: 4, depth: 5, height: 2.6,
                wallColor: '#e8e2d5', floorColor: '#c9a876', floorMaterial: 'solid',
                ceilingColor: '#f5f5f0', showCeiling: false
            }, room),
            lighting: { preset: 'day', ambientIntensity: 0.65, sunIntensity: 0.9 },
            items: items,
            selectedId: null,
            settings: { snapSize: 0.1, snapEnabled: true, gridVisible: true }
        };
    }

    const TEMPLATES = {
        bedroom: function () {
            return baseState('חדר שינה', { width: 3.6, depth: 4.2, floorColor: '#caa06e' }, [
                item('bedDouble', -0.2, -1.1, 0, '#dfe6ea'),
                item('wardrobe', -1.4, 1.6, 0, '#f0ece2'),
                item('dresser', 1.3, -1.7, 90, '#f0ece2'),
                item('tableLamp', 0.75, -1.9, 0),
                item('rug', -0.2, 0.4, 0, '#c98a6b'),
                item('plant', 1.5, 1.7, 0)
            ]);
        },
        living: function () {
            return baseState('סלון', { width: 5, depth: 5.5, floorColor: '#b98a5a', floorMaterial: 'wood' }, [
                item('sofa', 0, 1.7, 180, '#4f6f8a'),
                item('armchair', -1.8, 0.6, 90, '#8a6b52'),
                item('coffeeTable', 0, 0.7, 0),
                item('tvStand', 0, -2.0, 0, '#2c2c2c'),
                item('bookshelf', -2.1, -1.6, 90, '#7a5230'),
                item('rug', 0, 1.0, 0, '#b5533c'),
                item('floorLamp', 1.9, 0.6, 0),
                item('plant', 2.0, -2.0, 0)
            ]);
        },
        office: function () {
            return baseState('חדר עבודה', { width: 3.2, depth: 3.6, floorColor: '#d8d3c8', floorMaterial: 'tile' }, [
                item('desk', 0, -1.3, 180, '#6b4a34'),
                item('diningChair', 0, -0.75, 0, '#3a3a3a'),
                item('bookshelf', -1.25, 1.3, 90, '#7a5230'),
                item('floorLamp', 1.2, -1.5, 0),
                item('plant', 1.3, 1.4, 0)
            ]);
        }
    };

    function apply(key) {
        const factory = TEMPLATES[key];
        if (!factory) return;
        RD.State.replace(factory());
    }

    function list() {
        return [
            { key: 'bedroom', label: 'חדר שינה' },
            { key: 'living', label: 'סלון' },
            { key: 'office', label: 'חדר עבודה' }
        ];
    }

    return { apply: apply, list: list };
})();
