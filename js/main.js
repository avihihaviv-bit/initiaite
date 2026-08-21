import { renderHoursStatus, renderHoursTable } from "./hours.js";
import { initHeaderScroll, initMobileNav, initActiveNavHighlight, initPageLoader, trackStickyHeight } from "./nav.js";
import { initHero3D } from "./hero3d.js";
import { initFlagBackdrop } from "./flag.js";
import { initA11y } from "./a11y.js";
import { initTilt, markTiltTargets } from "./tilt.js";
import {
  initScrollReveal,
  initMagneticButtons,
  initParallax,
  revealStaggerChildren,
} from "./reveal.js";
import {
  renderBestsellers,
  renderMenuTabs,
  renderMenuGrid,
  initMenuControls,
  initProductModal,
  renderRecentlyViewed,
} from "./menu.js";
import { renderGallery, initLightbox } from "./gallery.js";
import { renderReviews } from "./reviews.js";
import { renderFAQ } from "./faq.js";
import { qs, qsa } from "./utils.js";

function init() {
  initPageLoader();

  renderHoursStatus();
  renderHoursTable();
  setInterval(renderHoursStatus, 60_000);

  trackStickyHeight();
  initHeaderScroll();
  initMobileNav();
  initActiveNavHighlight();

  renderBestsellers();
  renderMenuTabs();
  renderMenuGrid();
  initMenuControls();
  initProductModal();
  renderRecentlyViewed();

  renderGallery();
  initLightbox();

  renderReviews();
  renderFAQ();

  qsa(".why-grid, .footer-grid").forEach(revealStaggerChildren);

  initA11y();
  initFlagBackdrop();
  markTiltTargets();
  initTilt();
  initHero3D();
  initScrollReveal();
  initMagneticButtons();
  initParallax();

  const year = qs("#footer-year");
  if (year) year.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
