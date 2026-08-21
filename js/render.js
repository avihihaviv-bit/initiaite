import { escapeHtml } from "./utils.js";

const CATEGORY_ICON = {
  deals: "deal",
  "build-pizza": "pizza",
  pasta: "pasta",
  focaccia: "bread",
  "garlic-bread": "garlic",
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

function tagIcon(tag) {
  if (tag === "veg") return `<span class="dish-tag tooltip" data-tooltip="צמחוני"><svg class="icon icon-fill"><use href="#i-leaf"></use></svg></span>`;
  if (tag === "spicy") return `<span class="dish-tag tooltip" data-tooltip="חריף"><svg class="icon icon-fill"><use href="#i-chili"></use></svg></span>`;
  return "";
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
        <div class="dish-media">
          <div class="dish-badges">${badges.join("")}</div>
          ${artPlaceholder(item.category)}
        </div>
        <div class="dish-body">
          <div class="dish-top-row">
            <h3 class="dish-name">${escapeHtml(item.name)}</h3>
            <span class="dish-price">${escapeHtml(item.price)}</span>
          </div>
          <p class="dish-desc">${escapeHtml(item.desc)}</p>
          <div class="dish-tags">${item.tags.map(tagIcon).join("")}</div>
        </div>
      </button>
    </article>
  `;
}

export function categoryChipHTML(cat, isActive) {
  return `
    <button class="category-chip ${isActive ? "is-active" : ""}" data-category="${cat.id}" role="tab" aria-selected="${isActive}">
      <span class="icon-wrap"><svg class="icon icon-fill"><use href="#i-${cat.icon}"></use></svg></span>
      <span>${escapeHtml(cat.name)}</span>
    </button>
  `;
}

export function galleryItemHTML(index, label) {
  const icons = ["pizza", "pasta", "bread", "garlic", "drink", "deal", "pizza", "pasta"];
  const icon = icons[index % icons.length];
  return `
    <div class="gallery-item" data-index="${index}">
      <div class="art-placeholder">
        <svg class="icon icon-fill"><use href="#i-${icon}"></use></svg>
        <span class="art-label">${escapeHtml(label)}</span>
      </div>
      <span class="zoom-icon"><svg class="icon" style="width:16px;height:16px"><use href="#i-zoom"></use></svg></span>
    </div>
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
