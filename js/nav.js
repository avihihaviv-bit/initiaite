import { qs, qsa, debounce } from "./utils.js";

/** Publish the sticky bar's real height so the floating buttons clear it. */
export function trackStickyHeight() {
  const bar = qs("#sticky-cta");
  if (!bar) return;
  const update = () =>
    document.documentElement.style.setProperty(
      "--sticky-h",
      `${Math.round(bar.getBoundingClientRect().height)}px`
    );
  update();
  if ("ResizeObserver" in window) new ResizeObserver(update).observe(bar);
  window.addEventListener("resize", update, { passive: true });
}

export function initHeaderScroll() {
  const header = qs("#site-header");
  const backToTop = qs("#back-to-top");
  const stickyCta = qs("#sticky-cta");
  const progress = qs("#scroll-progress span");
  if (!header) return;

  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 12);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    }

    if (backToTop) backToTop.classList.toggle("is-visible", y > 640);

    if (stickyCta) {
      const scrollingDown = y > lastY && y > 200;
      stickyCta.classList.toggle("is-hidden", scrollingDown);
    }
    lastY = y;
  };

  window.addEventListener("scroll", debounce(onScroll, 40), { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export function initMobileNav() {
  const nav = qs("#mobile-nav");
  const toggle = qs("#nav-toggle");
  if (!nav || !toggle) return;

  const open = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", open);
  qsa("[data-nav-close]", nav).forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) close();
  });
}

export function initActiveNavHighlight() {
  const links = qsa(".main-nav a");
  if (!links.length || !("IntersectionObserver" in window)) return;

  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          links.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((s) => observer.observe(s));
}

/**
 * Cinematic intro: logo + wordmark settle, then a circular curtain opens onto
 * the hero, which runs its own staggered entrance. Capped so the site is
 * usable in well under 2.5s even if `load` is slow.
 */
export function initPageLoader() {
  const intro = qs("#intro");
  if (!intro) {
    document.body.classList.add("is-ready");
    return;
  }

  let started = false;

  const reveal = () => {
    if (started) return;
    started = true;

    intro.classList.add("is-leaving");
    // Hero entrance begins while the curtain is still opening.
    setTimeout(() => document.body.classList.add("is-ready"), 320);
    setTimeout(() => intro.classList.add("is-done"), 1200);
  };

  const minHold = new Promise((r) => setTimeout(r, 1700));
  const loaded = new Promise((r) => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once: true });
  });

  Promise.all([minHold, loaded]).then(reveal);
  // Safety net: never keep the visitor waiting on a slow asset.
  setTimeout(reveal, 2500);
}
