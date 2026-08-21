import { qs } from "./utils.js";
import { revealStaggerChildren } from "./reveal.js";

/**
 * Gallery of real dish photography from the restaurant's Wolt listing.
 * Ordered so the largest tile (first) carries the strongest hero shot.
 */
const GALLERY = [
  { src: "assets/images/hero-pizza.png", alt: "פיצה טרייה עם פפרוני ובזיליקום, פיצה איטליאנה חולון" },
  { src: "assets/images/menu/pizza-levana.png", alt: "פיצה לבנה על בסיס אלפרדו עם פטריות" },
  { src: "assets/images/menu/malawach-patuach.png", alt: "מלווח פתוח מוגש עם ביצה, רסק וטחינה" },
  { src: "assets/images/menu/pasta-penne.png", alt: "פסטה פנה ברוטב שמנת ופטריות" },
  { src: "assets/images/menu/ziva-zeitim.png", alt: "זיווה זיתים מוגשת עם רסק, ביצה וטחינה" },
  { src: "assets/images/menu/ravioli-batata.png", alt: "רביולי בטטה ברוטב עגבניות" },
  { src: "assets/images/menu/pizza-yevanit.png", alt: "פיצה יוונית עם זיתי קלמטה, בולגרית ועגבניות שרי" },
  { src: "assets/images/menu/toast.png", alt: "טוסט חם מוגש עם תוספות ורטבים בצד" },
];

let currentIndex = 0;

export function renderGallery() {
  const grid = qs("#gallery-grid");
  if (!grid) return;
  grid.innerHTML = GALLERY.map(
    (p, i) => `
      <figure class="gallery-item" data-index="${i}">
        <img src="${p.src}" alt="${p.alt}" loading="lazy" decoding="async"
             sizes="(max-width: 640px) 50vw, 25vw">
        <span class="zoom-icon"><svg class="icon" style="width:16px;height:16px"><use href="#i-zoom"></use></svg></span>
      </figure>`
  ).join("");
  revealStaggerChildren(grid);
}

function openLightbox(index) {
  currentIndex = (index + GALLERY.length) % GALLERY.length;
  const lightbox = qs("#lightbox");
  const content = qs("#lightbox-content");
  const counter = qs("#lightbox-counter");
  if (!lightbox || !content) return;

  const p = GALLERY[currentIndex];
  content.innerHTML = `<img src="${p.src}" alt="${p.alt}">`;
  if (counter) counter.textContent = `${currentIndex + 1} / ${GALLERY.length}`;
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
    // RTL: ArrowLeft advances, ArrowRight goes back
    if (e.key === "ArrowLeft") openLightbox(currentIndex + 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex - 1);
  });

  // Swipe on mobile
  let startX = 0;
  lightbox?.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), {
    passive: true,
  });
  lightbox?.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      openLightbox(currentIndex + (dx > 0 ? -1 : 1));
    },
    { passive: true }
  );
}
