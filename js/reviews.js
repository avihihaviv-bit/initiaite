import { REVIEWS } from "./data.js";
import { qs, qsa } from "./utils.js";
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

  const dotEls = qsa(".reviews-dot", dots);
  const isRtl = getComputedStyle(track).direction === "rtl";

  let lit = -1;
  // Runs straight off the scroll event, with no debounce and no rAF hop: the
  // old debounce(100) only fired once scrolling had *stopped*, so the dot sat
  // still through the whole swipe and then jumped. Scroll events are already
  // coalesced to one per frame, and with three cards the rect reads here are
  // far too cheap to be worth deferring a frame for.
  const syncDots = () => {
    const trackBox = track.getBoundingClientRect();
    // The current card is the one aligned to the scroller's start edge —
    // which is the RIGHT edge under RTL. Measuring left edges picked the
    // last card in view instead of the first.
    const anchor = isRtl ? trackBox.right : trackBox.left;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const box = card.getBoundingClientRect();
      const dist = Math.abs((isRtl ? box.right : box.left) - anchor);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    if (closest === lit) return;
    lit = closest;
    dotEls.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === closest);
      dot.setAttribute("aria-current", i === closest ? "true" : "false");
    });
  };

  track.addEventListener("scroll", syncDots, { passive: true });
  syncDots();

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
