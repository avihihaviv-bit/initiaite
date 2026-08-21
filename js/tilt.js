import { qsa, prefersReducedMotion, isFinePointer } from "./utils.js";

/**
 * Cursor-tracking 3D tilt + a glow that follows the pointer across the
 * element's surface. Desktop fine-pointer only; disabled under reduced motion.
 *
 * Elements opt in with [data-tilt]. Two CSS custom properties are written per
 * frame — --mx/--my (pointer position in %) for the glow, and the transform
 * itself for the tilt — so all the visual work stays on the compositor.
 */
const MAX_DEG = 7;

export function initTilt() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  const targets = qsa("[data-tilt]");
  if (!targets.length) return;

  targets.forEach((el) => {
    let raf = null;
    let hovering = false;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const strength = Number(el.dataset.tilt) || 1;
        const rotY = (px - 0.5) * 2 * MAX_DEG * strength;
        const rotX = -(py - 0.5) * 2 * MAX_DEG * strength;
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        el.style.setProperty("--rx", `${rotX.toFixed(2)}deg`);
        el.style.setProperty("--ry", `${rotY.toFixed(2)}deg`);
      });
    };

    el.addEventListener("pointerenter", () => {
      hovering = true;
      el.classList.add("is-tilting");
    });

    el.addEventListener("pointermove", (e) => {
      if (hovering) onMove(e);
    });

    el.addEventListener("pointerleave", () => {
      hovering = false;
      if (raf) cancelAnimationFrame(raf);
      el.classList.remove("is-tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

/** Tag the elements that should tilt. Called after dynamic content renders. */
export function markTiltTargets() {
  const sel = [
    ".dish-card",
    ".why-card",
    ".review-card",
    ".gallery-item",
    ".location-card",
    ".btn-lg",
  ].join(",");
  qsa(sel).forEach((el) => {
    if (!el.hasAttribute("data-tilt")) el.setAttribute("data-tilt", "1");
  });
}
