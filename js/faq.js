import { FAQS } from "./data.js";
import { qs, qsa } from "./utils.js";
import { faqItemHTML } from "./render.js";
import { revealStaggerChildren } from "./reveal.js";

export function renderFAQ() {
  const list = qs("#faq-list");
  if (!list) return;
  list.innerHTML = FAQS.map(faqItemHTML).join("");
  revealStaggerChildren(list);

  list.addEventListener("click", (e) => {
    const question = e.target.closest(".faq-question");
    if (!question) return;
    const item = question.closest(".faq-item");
    const isOpen = item.classList.contains("is-open");

    qsa(".faq-item", list).forEach((el) => {
      el.classList.remove("is-open");
      el.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
    });

    if (!isOpen) {
      item.classList.add("is-open");
      question.setAttribute("aria-expanded", "true");
    }
  });
}
