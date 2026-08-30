// viewport-scale.js — on a narrow screen, shrink the exact desktop layout
// to fit instead of switching to a different mobile layout (no drawer, no
// bottom sheet): the app is a scaled-down but pixel-faithful replica of the
// desktop UI, the same way a browser's "desktop site" mode works.

(function () {
    const REF_WIDTH = 1280;

    function apply() {
        const host = document.getElementById('app-scale-host');
        const app = document.getElementById('app');
        if (!host || !app) return;

        if (window.innerWidth >= REF_WIDTH) {
            app.style.width = '';
            app.style.transform = '';
            host.style.width = '';
            host.style.height = '';
            host.style.overflow = '';
            return;
        }

        const scale = window.innerWidth / REF_WIDTH;
        app.style.width = REF_WIDTH + 'px';
        app.style.transform = 'scale(' + scale + ')';
        host.style.width = '100%';
        host.style.overflow = 'hidden';
        host.style.height = (window.innerHeight * scale) + 'px';
    }

    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', function () { setTimeout(apply, 60); });
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }
})();
