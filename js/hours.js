import { HOURS } from "./data.js";
import { qs, qsa } from "./utils.js";

const TIME_ZONE = "Asia/Jerusalem";

function nowInIsrael() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    map.weekday
  );
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + parseInt(map.minute, 10);
  return { day: weekdayIndex, minutes };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function getOpenStatus() {
  const { day, minutes } = nowInIsrael();
  const today = HOURS.find((h) => h.day === day);

  if (today && !today.closed) {
    const open = toMinutes(today.open);
    // "00:00" as a closing time means midnight at the end of today (1440),
    // not a window spilling into tomorrow.
    const close = today.close === "00:00" ? 1440 : toMinutes(today.close);
    if (minutes >= open && minutes < close) {
      return { open: true, today, closesAt: today.close };
    }
  }

  return { open: false, today, nextOpen: findNextOpen(day, minutes) };
}

function findNextOpen(day, minutes) {
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const entry = HOURS.find((h) => h.day === d);
    if (!entry || entry.closed) continue;
    if (i === 0) {
      const openMin = toMinutes(entry.open);
      if (minutes < openMin) return entry;
      continue;
    }
    return entry;
  }
  return null;
}

export function renderHoursStatus() {
  const status = getOpenStatus();
  const texts = qsa(
    "#hero-hours-status, #header-status-text, #mobile-nav-status"
  );
  const pills = qsa("#header-status");
  const locationStatus = qs("#location-status");

  let label;
  if (status.open) {
    label = `פתוח עכשיו · סוגר ב-${status.closesAt}`;
  } else if (status.nextOpen) {
    label = `סגור כרגע · נפתח ${status.nextOpen.label} ב-${status.nextOpen.open}`;
  } else {
    label = "סגור כרגע";
  }

  texts.forEach((el) => (el.textContent = label));
  pills.forEach((el) => el.classList.toggle("is-closed", !status.open));
  if (locationStatus) {
    locationStatus.textContent = status.open ? "· פתוח עכשיו" : "· סגור עכשיו";
    locationStatus.style.color = status.open
      ? "var(--color-basil)"
      : "var(--color-tomato)";
  }
}

export function renderHoursTable() {
  const table = qs("#hours-table");
  if (!table) return;
  const { day: todayIndex } = nowInIsrael();
  table.innerHTML = HOURS.map((h) => {
    const isToday = h.day === todayIndex;
    const hoursLabel = h.closed ? "סגור" : `${h.open}–${h.close}`;
    return `<tr class="${isToday ? "is-today" : ""}"><td>${h.label}</td><td>${hoursLabel}</td></tr>`;
  }).join("");
}
