import { qs, qsa } from "./utils.js";

const KEY = "pi_a11y";
const MIN_STEP = -2;
const MAX_STEP = 4;

const state = { font: 0, contrast: false, links: false, motion: false };

function load() {
  try {
    Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    /* storage unavailable — run with defaults */
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function apply() {
  const root = document.documentElement;
  root.style.fontSize = state.font ? `${100 + state.font * 12.5}%` : "";
  root.classList.toggle("a11y-contrast", state.contrast);
  root.classList.toggle("a11y-links", state.links);
  root.classList.toggle("a11y-no-motion", state.motion);

  const press = (name, on) => {
    const btn = qs(`[data-a11y="${name}"]`);
    if (btn) btn.setAttribute("aria-pressed", String(on));
  };
  press("contrast", state.contrast);
  press("links", state.links);
  press("motion", state.motion);
}

export function initA11y() {
  const toggle = qs("#a11y-toggle");
  const panel = qs("#a11y-panel");
  if (!toggle || !panel) return;

  load();
  apply();

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(panel.hidden));

  document.addEventListener("click", (e) => {
    if (!panel.hidden && !e.target.closest("#a11y")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  qsa("[data-a11y]", panel).forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.a11y;
      if (action === "font-up") state.font = Math.min(MAX_STEP, state.font + 1);
      else if (action === "font-down") state.font = Math.max(MIN_STEP, state.font - 1);
      else if (action === "reset") Object.assign(state, { font: 0, contrast: false, links: false, motion: false });
      else if (action in state) state[action] = !state[action];
      apply();
      save();
    });
  });
}
