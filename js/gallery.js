import { qs, qsa } from "./utils.js";
import { galleryItemHTML } from "./render.js";
import { revealStaggerChildren } from "./reveal.js";

const GALLERY_LABELS = [
  "תמונת המנה תתווסף בקרוב",
  "תמונת החלל תתווסף בקרוב",
  "תמונת התנור תתווסף בקרוב",
  "תמונת הצוות תתווסף בקרוב",
  "תמונת המנה תתווסף בקרוב",
  "תמונת החומרים תתווסף בקרוב",
  "תמונת ההגשה תתווסף בקרוב",
  "תמונת הכניסה תתווסף בקרוב",
];

let currentIndex = 0;

// Real photography supplied by the owner, keyed by gallery slot.
const GALLERY_PHOTOS = {
  0: {
    src: "assets/images/hero-pizza.png",
    alt: "פיצה טרייה של פיצה איטליאנה עם פפרוני ובזיליקום",
  },
};

export function renderGallery() {
  const grid = qs("#gallery-grid");
  if (!grid) return;
  grid.innerHTML = GALLERY_LABELS.map((label, i) => {
    const photo = GALLERY_PHOTOS[i];
    if (photo) {
      return `
        <div class="gallery-item" data-index="${i}">
          <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async">
          <span class="zoom-icon"><svg class="icon" style="width:16px;height:16px"><use href="#i-zoom"></use></svg></span>
        </div>`;
    }
    return galleryItemHTML(i, label);
  }).join("");
  revealStaggerChildren(grid);
}

function openLightbox(index) {
  currentIndex = (index + GALLERY_LABELS.length) % GALLERY_LABELS.length;
  const lightbox = qs("#lightbox");
  const content = qs("#lightbox-content");
  const counter = qs("#lightbox-counter");
  if (!lightbox || !content) return;

  const icons = ["pizza", "pasta", "bread", "garlic", "drink", "deal", "pizza", "pasta"];
  const photo = GALLERY_PHOTOS[currentIndex];
  content.innerHTML = photo
    ? `<img src="${photo.src}" alt="${photo.alt}">`
    : `
    <div class="art-placeholder" style="width:100%;height:100%;border-radius: var(--radius-md);">
      <svg class="icon icon-fill" style="width:22%;height:22%"><use href="#i-${icons[currentIndex]}"></use></svg>
      <span class="art-label">${GALLERY_LABELS[currentIndex]}</span>
    </div>
  `;
  if (counter) counter.textContent = `${currentIndex + 1} / ${GALLERY_LABELS.length}`;
  lightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  qs("#lightbox")?.classList.remove("is-open");
  document.body.style.overflow = "";
}

export function initLightbox() {
  qs("#gallery-grid")?.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(Number(item.dataset.index));
  });

  qs("#lightbox-close")?.addEventListener("click", closeLightbox);
  qs("#lightbox-prev")?.addEventListener("click", () => openLightbox(currentIndex - 1));
  qs("#lightbox-next")?.addEventListener("click", () => openLightbox(currentIndex + 1));

  const lightbox = qs("#lightbox");
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox?.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex + 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex - 1);
  });

  // Swipe support on mobile
  let startX = 0;
  lightbox?.addEventListener(
    "touchstart",
    (e) => (startX = e.touches[0].clientX),
    { passive: true }
  );
  lightbox?.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx > 0) openLightbox(currentIndex - 1);
      else openLightbox(currentIndex + 1);
    },
    { passive: true }
  );
}
