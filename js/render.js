import { escapeHtml } from "./utils.js";

const CATEGORY_ICON = {
  "build-pizza": "pizza",
  "house-pizza": "pizza",
  pasta: "pasta",
  yemenite: "bread",
  focaccia: "bread",
  "garlic-bread": "garlic",
  toast: "bread",
  dessert: "deal",
  drinks: "drink",
};

export function artPlaceholder(categoryId, label) {
  const icon = CATEGORY_ICON[categoryId] || "pizza";
  return `
    <div class="art-placeholder">
      <svg class="icon icon-fill"><use href="#i-${icon}"></use></svg>
      ${label ? `<span class="art-label">${escapeHtml(label)}</span>` : ""}
    </div>
  `;
}

/**
 * Dish visual: real photography when we have it, otherwise the illustrated
 * category placeholder. A failed image swaps itself out for the placeholder
 * so a missing file never shows a broken-image icon.
 */
export function dishMedia(item, sizes = "(max-width: 700px) 50vw, 300px") {
  if (!item.img) return artPlaceholder(item.category);
  // No inline onerror: an inline handler is script, and the site's CSP allows
  // only first-party script files. The fallback is wired in initImageFallback.
  return `<img src="${item.img}" alt="${escapeHtml(item.name)} — פיצה איטליאנה חולון"
    loading="lazy" decoding="async" width="320" height="320" sizes="${sizes}"
    data-dish-photo>
    ${artPlaceholder(item.category)}`;
}

export function dishCardHTML(item) {
  const badges = [];
  if (item.bestseller) badges.push(`<span class="badge badge-bestseller">רב מכר</span>`);
  if (item.new) badges.push(`<span class="badge badge-new">חדש</span>`);
  if (item.recommended) badges.push(`<span class="badge badge-recommended">מומלץ</span>`);
  if (item.isPlaceholder) badges.push(`<span class="badge badge-placeholder">לדוגמה</span>`);

  return `
    <article class="dish-card" data-id="${item.id}">
      <button class="dish-card-btn" data-open-dish="${item.id}" aria-label="פרטים על ${escapeHtml(item.name)}">
        <div class="dish-media${item.img ? " has-photo" : ""}">
          <div class="dish-badges">${badges.join("")}</div>
          ${dishMedia(item)}
        </div>
        <div class="dish-body">
          <div class="dish-top-row">
            <h3 class="dish-name">${escapeHtml(item.name)}</h3>
            <span class="dish-price">${escapeHtml(item.price)}</span>
          </div>
          <p class="dish-desc">${escapeHtml(item.desc)}</p>
        </div>
      </button>
      <button class="dish-add" type="button" data-add-to-cart="${item.id}"
              aria-label="הוספת ${escapeHtml(item.name)} לסל">
        <svg class="icon"><use href="#i-plus"></use></svg>
        <span>לסל</span>
      </button>
    </article>
  `;
}

export function categoryChipHTML(cat, isActive) {
  return `
    <button class="category-chip ${isActive ? "is-active" : ""}" data-category="${cat.id}" role="tab" aria-selected="${isActive}">
      <span>${escapeHtml(cat.name)}</span>
    </button>
  `;
}

export function reviewCardHTML(review) {
  const stars = Array.from({ length: review.rating })
    .map(() => `<svg class="icon icon-fill" style="width:14px;height:14px"><use href="#i-star"></use></svg>`)
    .join("");
  return `
    <article class="review-card">
      <div class="review-head">
        <span class="review-avatar">${escapeHtml(review.name.trim().charAt(0))}</span>
        <div>
          <div class="review-name">${escapeHtml(review.name)}</div>
          <div class="review-sub">${escapeHtml(review.meta)} · ${escapeHtml(review.timeAgo)}</div>
        </div>
      </div>
      <span class="review-stars">${stars}</span>
      <p class="review-text">${escapeHtml(review.text)}</p>
      ${review.reply ? `<div class="review-reply"><strong>תגובת הבעלים · ${escapeHtml(review.reply.timeAgo)}</strong>${escapeHtml(review.reply.text)}</div>` : ""}
    </article>
  `;
}

export function faqItemHTML(faq, index) {
  return `
    <div class="faq-item" id="faq-${index}">
      <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${index}">
        <span>${escapeHtml(faq.q)}</span>
        <span class="plus"><svg class="icon" style="width:14px;height:14px"><use href="#i-plus"></use></svg></span>
      </button>
      <div class="faq-answer" id="faq-answer-${index}">
        <div class="faq-answer-inner"><p>${escapeHtml(faq.a)}</p></div>
      </div>
    </div>
  `;
}

/**
 * A dish photo that fails to load hands over to the painted placeholder behind
 * it. Delegated from the document, because the cards are rendered as HTML
 * strings long before this runs — and error events do not bubble, so this
 * listens in the capture phase.
 */
export function initImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || !img.hasAttribute("data-dish-photo")) return;
      img.closest(".dish-media")?.classList.add("img-failed");
      img.remove();
    },
    true
  );
}
