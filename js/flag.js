import { prefersReducedMotion } from "./utils.js";

/**
 * Site-wide Italian flag backdrop.
 *
 * A fixed 2D canvas draws the tricolore as a column of vertical strips whose
 * horizontal offset, width and brightness are driven by two summed sine waves.
 * That gives fabric-like folds with light catching the crests, without the
 * cost (or the load-time) of a WebGL/Three.js scene.
 *
 * Cost control. The output is soft-focus by design, so it is drawn small and
 * scaled up rather than rendered at device resolution: at full DPR this was
 * repainting several megapixels every frame for an image nobody ever sees
 * sharp. The upscale supplies most of the softening the CSS blur used to, and
 * blur is charged on displayed area, so the remaining radius is small.
 *  - fixed low backing resolution, independent of screen size
 *  - capped at ~30fps; the wave is slow enough that nothing is lost
 *  - pauses when the tab is hidden
 *  - falls back to a static painted frame under prefers-reduced-motion
 */
export function initFlagBackdrop() {
  const canvas = document.getElementById("flag-canvas");
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const reduced = prefersReducedMotion();
  const isSmall = window.matchMedia("(max-width: 860px)").matches;

  // Strip width in CSS px — wider strips on mobile means far fewer draw calls.
  const STRIP = isSmall ? 14 : 9;
  const GREEN = [0, 140, 69];
  const WHITE = [244, 240, 232];
  const RED = [206, 43, 55];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = null;
  let running = false;

  // Backing width in device pixels. Vertical colour bands with a slow fold —
  // there is no fine detail to lose, and CSS stretches it back to full size.
  const BACKING_W = 480;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = Math.min(1, BACKING_W / Math.max(w, 1));
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function colorAt(t) {
    // t in 0..1 across the flag width; two soft seams between the bands
    const band = 1 / 3;
    const blend = 0.02;
    if (t < band - blend) return GREEN;
    if (t < band + blend) return mix(GREEN, WHITE, (t - band + blend) / (2 * blend));
    if (t < 2 * band - blend) return WHITE;
    if (t < 2 * band + blend)
      return mix(WHITE, RED, (t - 2 * band + blend) / (2 * blend));
    return RED;
  }

  function mix(a, b, k) {
    k = Math.max(0, Math.min(1, k));
    return [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k,
    ];
  }

  function draw(time) {
    const t = time / 1000;
    ctx.fillStyle = "#0d0a07";
    ctx.fillRect(0, 0, w, h);

    const cols = Math.ceil(w / STRIP) + 1;
    for (let i = 0; i < cols; i++) {
      const x = i * STRIP;
      const u = x / w;

      // Two summed waves at different frequencies keep the loop from reading
      // as a single repeating sine.
      const phase = u * 6.2;
      const wave1 = Math.sin(phase - t * 0.62);
      const wave2 = Math.sin(phase * 0.53 + t * 0.41);
      const fold = wave1 * 0.65 + wave2 * 0.35;

      // Vertical drift + slight vertical squash makes the sheet feel loose.
      const yOff = fold * (isSmall ? 14 : 26);
      const squash = 1 + fold * 0.035;

      // Light: crests catch light, troughs fall into shadow.
      const shade = 0.62 + 0.38 * (fold * 0.5 + 0.5);
      const [r, g, b] = colorAt(u);
      ctx.fillStyle = `rgb(${r * shade | 0}, ${g * shade | 0}, ${b * shade | 0})`;

      const stripH = h * squash;
      ctx.fillRect(x, yOff - (stripH - h) / 2, STRIP + 1, stripH);
    }

    if (running) raf = requestAnimationFrame(frame);
  }

  // ~30fps. The fold takes seconds to travel; drawing it twice per displayed
  // frame buys nothing and costs every visitor half a core.
  const MIN_FRAME_MS = 1000 / 30;
  let lastDraw = 0;

  function frame(time) {
    if (!running) return;
    if (time - lastDraw >= MIN_FRAME_MS) {
      lastDraw = time;
      draw(time);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reduced || !running) draw(performance.now());
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  if (reduced) {
    draw(0); // single static frame
  } else {
    start();
  }
}
