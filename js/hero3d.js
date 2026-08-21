import { qs, prefersReducedMotion, isFinePointer } from "./utils.js";

/**
 * Layered CSS-3D pizza: subtle idle rotation (CSS animation) that pauses on
 * hover/drag while pointer/touch input drives rotateX/rotateZ directly.
 * Kept dependency-free (no WebGL) so it stays cheap on low-power phones.
 */
export function initHero3D() {
  const stage = qs("#pizza-stage");
  const pizza = qs("#pizza-3d");
  if (!stage || !pizza) return;

  if (prefersReducedMotion()) {
    stage.classList.add("no-3d");
    return;
  }

  let rotX = 52;
  let rotZ = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const apply = () => {
    pizza.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;
  };

  if (isFinePointer()) {
    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotX = 52 - py * 18;
      rotZ = px * 26;
      apply();
    });
    stage.addEventListener("mouseleave", () => {
      rotX = 52;
      rotZ = 0;
      apply();
    });
  }

  // Touch drag: free rotation while finger is down, spring back on release.
  stage.addEventListener(
    "touchstart",
    (e) => {
      dragging = true;
      stage.classList.add("is-dragging");
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    },
    { passive: true }
  );

  stage.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      rotZ += dx * 0.4;
      rotX = Math.max(30, Math.min(70, rotX - dy * 0.25));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      apply();
    },
    { passive: true }
  );

  stage.addEventListener("touchend", () => {
    dragging = false;
    stage.classList.remove("is-dragging");
    rotX = 52;
    apply();
  });
}
