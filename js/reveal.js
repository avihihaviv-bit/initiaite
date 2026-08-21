import { qsa, prefersReducedMotion, isFinePointer } from "./utils.js";

export function initScrollReveal() {
  const targets = qsa(".reveal, .reveal-scale");
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/** Re-observe newly injected cards inside a stagger container (sets --stagger-i) */
export function revealStaggerChildren(container) {
  if (!container) return;
  const children = Array.from(container.children);
  children.forEach((child, i) => {
    child.style.setProperty("--stagger-i", i % 8);
    child.classList.add("reveal");
  });
  initScrollRevealFor(children);
}

function initScrollRevealFor(elements) {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
  );
  elements.forEach((el) => observer.observe(el));
}

/** Subtle magnetic pull toward the pointer, desktop fine-pointer only. */
export function initMagneticButtons() {
  if (!isFinePointer() || prefersReducedMotion()) return;

  qsa(".magnetic").forEach((btn) => {
    let raf = null;
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
    });
    btn.addEventListener("mouseleave", () => {
      if (raf) cancelAnimationFrame(raf);
      btn.style.transform = "";
    });
  });
}
