import { renderHoursStatus, renderHoursTable } from "./hours.js";
import { initHeaderScroll, initMobileNav, initActiveNavHighlight, initPageLoader } from "./nav.js";
import { initHero3D } from "./hero3d.js";
import { initScrollReveal, initMagneticButtons } from "./reveal.js";
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
import { qs } from "./utils.js";

function init() {
  initPageLoader();

  renderHoursStatus();
  renderHoursTable();
  setInterval(renderHoursStatus, 60_000);

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

  initHero3D();
  initScrollReveal();
  initMagneticButtons();

  const year = qs("#footer-year");
  if (year) year.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
