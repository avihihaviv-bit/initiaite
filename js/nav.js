import { qs, qsa, debounce } from "./utils.js";

export function initHeaderScroll() {
  const header = qs("#site-header");
  const backToTop = qs("#back-to-top");
  const stickyCta = qs("#sticky-cta");
  if (!header) return;

  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 12);

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

export function initPageLoader() {
  const loader = qs("#page-loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("is-hidden"), 250);
  });
  // Safety net in case load event already fired or is slow to register.
  setTimeout(() => loader.classList.add("is-hidden"), 2500);
}
