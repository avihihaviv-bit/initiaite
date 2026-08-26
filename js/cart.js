import { MENU_ITEMS, RESTAURANT } from "./data.js";
import { qs, qsa, escapeHtml } from "./utils.js";
import { showToast } from "./toast.js";

const STORAGE_KEY = "pi_cart";

/**
 * A list-builder, not a checkout. Nothing is charged here and no order is
 * placed: the basket exists so you can gather what you want and hand it over
 * in one go — to Wolt, where you pay, or to the restaurant over WhatsApp.
 */
let lines = loadCart();

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Drop anything whose dish has since left the menu.
    return raw
      .filter((l) => l && typeof l.id === "string" && MENU_ITEMS.some((i) => i.id === l.id))
      .map((l) => ({ id: l.id, qty: clampQty(l.qty) }));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* private mode — the basket just won't survive a reload */
  }
}

function clampQty(n) {
  const q = Math.round(Number(n) || 1);
  return Math.min(99, Math.max(1, q));
}

function itemOf(id) {
  return MENU_ITEMS.find((i) => i.id === id);
}

/** "₪27" -> 27. Returns null when a price isn't a plain number. */
function priceOf(item) {
  const m = String(item?.price ?? "").match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function cartCount() {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartLines() {
  return lines.map((l) => ({ ...l, item: itemOf(l.id) })).filter((l) => l.item);
}

/** Total, plus whether any line had an unparseable price. */
export function cartTotal() {
  let sum = 0;
  let exact = true;
  for (const { item, qty } of cartLines()) {
    const p = priceOf(item);
    if (p === null) exact = false;
    else sum += p * qty;
  }
  return { sum, exact };
}

export function addToCart(id, qty = 1) {
  const item = itemOf(id);
  if (!item) return;
  const line = lines.find((l) => l.id === id);
  if (line) line.qty = clampQty(line.qty + qty);
  else lines.push({ id, qty: clampQty(qty) });
  saveCart();
  render();
  if (!qs("#cart-backdrop")?.classList.contains("is-open")) {
    showToast(`${item.name} נוסף לסל`, "success");
  }
}

export function setQty(id, qty) {
  const line = lines.find((l) => l.id === id);
  if (!line) return;
  if (qty <= 0) removeFromCart(id);
  else {
    line.qty = clampQty(qty);
    saveCart();
    render();
  }
}

export function removeFromCart(id) {
  lines = lines.filter((l) => l.id !== id);
  saveCart();
  render();
}

export function clearCart() {
  lines = [];
  saveCart();
  render();
}

/** The order as plain text — what actually travels to WhatsApp or the clipboard. */
export function orderText() {
  const rows = cartLines().map(({ item, qty }) => `• ${item.name} × ${qty} — ${item.price}`);
  const { sum, exact } = cartTotal();
  const total = rows.length
    ? `\n\nסה"כ${exact ? "" : " (חלקי)"}: ₪${sum}`
    : "";
  return `היי! רציתי להזמין:\n\n${rows.join("\n")}${total}`;
}

export function whatsappOrderHref() {
  return `https://wa.me/97236225040?text=${encodeURIComponent(orderText())}`;
}

// ---------- UI ----------

function priceLabel(item, qty) {
  const p = priceOf(item);
  // Showing the line total, not the unit price, is what people check against
  // the running total — the unit price stays as the smaller second line.
  return p === null ? escapeHtml(item.price) : `₪${p * qty}`;
}

function lineHTML({ item, qty }) {
  const unit = priceOf(item);
  return `
    <li class="cart-line" data-id="${item.id}">
      ${
        item.img
          ? `<img class="cart-line-img" src="${item.img}" alt="" loading="lazy" decoding="async" width="60" height="60">`
          : `<span class="cart-line-img cart-line-img-empty"><svg class="icon"><use href="#i-bag"></use></svg></span>`
      }
      <div class="cart-line-main">
        <span class="cart-line-name">${escapeHtml(item.name)}</span>
        ${
          unit !== null && qty > 1
            ? `<span class="cart-line-unit">${qty} × ₪${unit}</span>`
            : ""
        }
        <div class="cart-qty" role="group" aria-label="כמות של ${escapeHtml(item.name)}">
          <button type="button" data-cart-dec aria-label="פחות">
            <svg class="icon"><use href="#i-minus"></use></svg>
          </button>
          <span class="cart-qty-value" aria-live="polite">${qty}</span>
          <button type="button" data-cart-inc aria-label="עוד">
            <svg class="icon"><use href="#i-plus"></use></svg>
          </button>
        </div>
      </div>
      <div class="cart-line-end">
        <span class="cart-line-total">${priceLabel(item, qty)}</span>
        <button type="button" class="cart-line-remove" data-cart-remove aria-label="הסרת ${escapeHtml(item.name)} מהסל">
          <svg class="icon"><use href="#i-close"></use></svg>
        </button>
      </div>
    </li>`;
}

export function render() {
  const count = cartCount();

  qsa("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  qsa("[data-cart-open]").forEach((el) => {
    el.classList.toggle("has-items", count > 0);
    el.setAttribute("aria-label", count ? `הסל שלי — ${count} פריטים` : "הסל שלי");
  });

  const headCount = qs("#cart-head-count");
  if (headCount) {
    headCount.textContent = count === 1 ? "פריט אחד" : `${count} פריטים`;
    headCount.hidden = count === 0;
  }

  const list = qs("#cart-lines");
  const empty = qs("#cart-empty");
  const footer = qs("#cart-footer");
  if (!list) return;

  const rows = cartLines();
  list.innerHTML = rows.map(lineHTML).join("");
  if (empty) empty.hidden = rows.length > 0;
  if (footer) footer.hidden = rows.length === 0;

  const { sum, exact } = cartTotal();
  const totalEl = qs("#cart-total");
  if (totalEl) totalEl.textContent = `₪${sum}`;
  const note = qs("#cart-total-note");
  if (note) note.hidden = exact;

  const wa = qs("#cart-whatsapp");
  if (wa) wa.href = whatsappOrderHref();
}

export function openCart() {
  qs("#cart-backdrop")?.classList.add("is-open");
  // The floating corner controls out-rank the drawer on z-index, so they would
  // otherwise sit on top of its buttons.
  document.body.classList.add("cart-open");
  document.body.style.overflow = "hidden";
  render();
  qs("#cart-close")?.focus();
}

export function closeCart() {
  qs("#cart-backdrop")?.classList.remove("is-open");
  document.body.classList.remove("cart-open");
  document.body.style.overflow = "";
}

async function copyOrder() {
  const text = orderText();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context and permission; fall back to a
    // hidden textarea, which works in more places than it looks like it should.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function initCart() {
  document.addEventListener("click", async (e) => {
    const add = e.target.closest("[data-add-to-cart]");
    if (add) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(add.getAttribute("data-add-to-cart"));
      return;
    }

    if (e.target.closest("[data-cart-open]")) {
      openCart();
      return;
    }
    if (
      e.target.closest("#cart-close") ||
      e.target.closest("[data-cart-close-link]") ||
      e.target === qs("#cart-backdrop")
    ) {
      closeCart();
      return;
    }
    if (e.target.closest("#cart-clear")) {
      clearCart();
      showToast("הסל רוקן", "success");
      return;
    }

    const line = e.target.closest(".cart-line");
    if (line) {
      const id = line.dataset.id;
      const cur = lines.find((l) => l.id === id)?.qty ?? 0;
      if (e.target.closest("[data-cart-inc]")) setQty(id, cur + 1);
      else if (e.target.closest("[data-cart-dec]")) setQty(id, cur - 1);
      else if (e.target.closest("[data-cart-remove]")) removeFromCart(id);
      return;
    }

    // Wolt cannot be handed a prepared basket — it has no public API for it —
    // so the next best thing: the list goes to the clipboard, then Wolt opens.
    const wolt = e.target.closest("#cart-wolt");
    if (wolt) {
      const copied = await copyOrder();
      showToast(
        copied ? "הרשימה הועתקה — הדביקו אותה בוולט" : "הרשימה מוכנה למטה",
        copied ? "success" : "error"
      );
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  render();
}
