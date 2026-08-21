import { qs } from "./utils.js";

export function showToast(message, type = "success", duration = 3200) {
  const region = qs("#toast-region");
  if (!region) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <span class="icon-wrap">
      <svg class="icon" style="width:16px;height:16px;color:#fbf3e6"><use href="#i-${type === "error" ? "alert-circle" : "check-circle"}"></use></svg>
    </span>
    <span>${message}</span>
  `;
  region.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  const remove = () => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 400);
  };
  setTimeout(remove, duration);
}
