import { REVIEWS } from "./data.js";
import { qs, qsa, debounce } from "./utils.js";
import { reviewCardHTML } from "./render.js";
import { revealStaggerChildren } from "./reveal.js";

export function renderReviews() {
  const track = qs("#reviews-track");
  const dots = qs("#reviews-dots");
  if (!track || !dots) return;

  track.innerHTML = REVIEWS.map(reviewCardHTML).join("");
  dots.innerHTML = REVIEWS.map(
    (_, i) => `<button class="reviews-dot ${i === 0 ? "is-active" : ""}" data-slide="${i}" aria-label="ביקורת ${i + 1}"></button>`
  ).join("");
  revealStaggerChildren(track);

  const cards = qsa(".review-card", track);

  dots.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-slide]");
    if (!btn) return;
    const card = cards[Number(btn.dataset.slide)];
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  });

  const syncDots = debounce(() => {
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    qsa(".reviews-dot", dots).forEach((dot, i) => dot.classList.toggle("is-active", i === closest));
  }, 100);

  track.addEventListener("scroll", syncDots, { passive: true });

  // Arrow navigation — one card per press, RTL aware.
  const step = (dir) => {
    const card = cards[0];
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
    track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
  };
  // In RTL the visual "next" is a negative scrollLeft delta.
  qs("#reviews-next")?.addEventListener("click", () => step(-1));
  qs("#reviews-prev")?.addEventListener("click", () => step(1));
}
