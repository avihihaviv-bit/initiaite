import { MENU_CATEGORIES, MENU_ITEMS, RESTAURANT } from "./data.js";
import { qs, qsa, escapeHtml, debounce } from "./utils.js";
import { dishCardHTML, categoryChipHTML, artPlaceholder, dishMedia } from "./render.js";
import { revealStaggerChildren } from "./reveal.js";
import { showToast } from "./toast.js";

const RECENTLY_VIEWED_KEY = "pi_recently_viewed";
const MAX_RECENT = 6;

let activeCategory = "all";
let activeQuery = "";

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentlyViewed(id) {
  try {
    let list = getRecentlyViewed().filter((x) => x !== id);
    list.unshift(id);
    list = list.slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
    if (!sessionStorage.getItem("pi_recent_toast_shown")) {
      sessionStorage.setItem("pi_recent_toast_shown", "1");
      showToast("נשמר לרשימת הנצפו לאחרונה שלכם", "success");
    }
  } catch {
    /* localStorage unavailable — silently skip persistence */
  }
}

export function renderBestsellers() {
  const grid = qs("#bestsellers-grid");
  if (!grid) return;
  const bestsellers = MENU_ITEMS.filter((i) => i.bestseller);
  grid.innerHTML = bestsellers.map(dishCardHTML).join("");
  revealStaggerChildren(grid);
}

export function renderMenuTabs() {
  const tabs = qs("#menu-tabs");
  if (!tabs) return;
  const allChip = `
    <button class="category-chip is-active" data-category="all" role="tab" aria-selected="true">
      <span>הכל</span>
    </button>
  `;
  tabs.innerHTML =
    allChip + MENU_CATEGORIES.map((c) => categoryChipHTML(c, false)).join("");

  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    activeCategory = btn.dataset.category;
    qsa(".category-chip", tabs).forEach((chip) => {
      const active = chip.dataset.category === activeCategory;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-selected", String(active));
    });
    applyMenuFilters();
  });
}

export function renderMenuGrid() {
  const grid = qs("#menu-grid");
  if (!grid) return;
  grid.innerHTML = MENU_ITEMS.map(dishCardHTML).join("");
  revealStaggerChildren(grid);
}

function applyMenuFilters() {
  const grid = qs("#menu-grid");
  const empty = qs("#menu-empty");
  if (!grid) return;

  let visibleCount = 0;
  qsa(".dish-card", grid).forEach((card) => {
    const item = MENU_ITEMS.find((i) => i.id === card.dataset.id);
    if (!item) return;

    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesQuery =
      !activeQuery ||
      item.name.includes(activeQuery) ||
      item.desc.includes(activeQuery);
    const visible = matchesCategory && matchesQuery;
    card.hidden = !visible;
    if (visible) visibleCount++;
  });

  empty?.classList.toggle("is-visible", visibleCount === 0);
}

export function initMenuControls() {
  const search = qs("#menu-search");
  search?.addEventListener(
    "input",
    debounce((e) => {
      activeQuery = e.target.value.trim();
      applyMenuFilters();
    }, 180)
  );

}

// ---------- Product modal ----------

function findItem(id) {
  return MENU_ITEMS.find((i) => i.id === id);
}

function relatedItemsFor(item) {
  return MENU_ITEMS.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 4);
}

export function openProductModal(id) {
  const item = findItem(id);
  if (!item) return;
  const backdrop = qs("#product-modal-backdrop");
  const content = qs("#product-modal-content");
  if (!backdrop || !content) return;

  const related = relatedItemsFor(item);

  content.innerHTML = `
    <div class="modal-media${item.img ? " has-photo" : ""}">${dishMedia(item, "(max-width: 720px) 92vw, 600px")}</div>
    <div class="modal-title-row">
      <h3 id="product-modal-title">${escapeHtml(item.name)}</h3>
      <span class="modal-price">${escapeHtml(item.price)}</span>
    </div>
    <p class="modal-desc">${escapeHtml(item.desc)}</p>
    <div class="modal-tags">
      ${item.bestseller ? `<span class="badge badge-bestseller">רב מכר</span>` : ""}
      ${item.new ? `<span class="badge badge-new">חדש</span>` : ""}
      ${item.recommended ? `<span class="badge badge-recommended">מומלץ</span>` : ""}
      ${item.tags.includes("veg") ? `<span class="badge badge-veg">צמחוני</span>` : ""}
      ${item.tags.includes("spicy") ? `<span class="badge badge-spicy">חריף</span>` : ""}
      ${item.isPlaceholder ? `<span class="badge badge-placeholder">מנה לדוגמה — המחיר והפרטים המדויקים בוולט</span>` : ""}
    </div>
    <div class="modal-ctas">
      <a class="btn btn-wolt btn-lg" href="${RESTAURANT.woltUrl}" target="_blank" rel="noopener" data-wolt-cta="product-modal">
        <svg class="icon"><use href="#i-bag"></use></svg> להזמנה בוולט
      </a>
      <a class="btn btn-outline" href="tel:+97236225040">
        <svg class="icon"><use href="#i-phone"></use></svg> להתקשר
      </a>
    </div>
    ${
      related.length
        ? `<div class="related-block">
            <h4>אולי גם יטעם לכם</h4>
            <div class="related-scroller">
              ${related
                .map(
                  (r) => `
                <div class="related-item" data-open-dish="${r.id}">
                  <div class="dish-media${r.img ? " has-photo" : ""}">${dishMedia(r, "160px")}</div>
                  <div class="dish-name">${escapeHtml(r.name)}</div>
                  <div class="dish-price">${escapeHtml(r.price)}</div>
                </div>`
                )
                .join("")}
            </div>
          </div>`
        : ""
    }
  `;

  backdrop.classList.add("is-open");
  document.body.style.overflow = "hidden";
  addRecentlyViewed(id);
  renderRecentlyViewed();
}

export function closeProductModal() {
  qs("#product-modal-backdrop")?.classList.remove("is-open");
  document.body.style.overflow = "";
}

export function initProductModal() {
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open-dish]");
    if (opener) {
      openProductModal(opener.dataset.openDish || opener.getAttribute("data-open-dish"));
      return;
    }
    if (e.target.closest("#product-modal-close")) closeProductModal();
    if (e.target === qs("#product-modal-backdrop")) closeProductModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProductModal();
  });
}

export function renderRecentlyViewed() {
  const wrap = qs("#recently-viewed");
  const scroller = qs("#recently-viewed-scroller");
  if (!wrap || !scroller) return;
  const ids = getRecentlyViewed();
  const items = ids.map(findItem).filter(Boolean);

  if (!items.length) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "";
  scroller.innerHTML = items
    .map(
      (item) => `
      <div class="related-item" data-open-dish="${item.id}">
        <div class="dish-media${item.img ? " has-photo" : ""}">${dishMedia(item, "160px")}</div>
        <div class="dish-name">${escapeHtml(item.name)}</div>
        <div class="dish-price">${escapeHtml(item.price)}</div>
      </div>`
    )
    .join("");
}
