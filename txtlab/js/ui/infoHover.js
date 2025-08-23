// Updates #info on hover/focus of buttons (works even if #sidebar is replaced)
import { $id, SELECTORS } from "../core/dom.js";

function getInfoEl() {
  const el = $id("info");
  if (el && !el.dataset.default) {
    el.dataset.default = el.textContent || "Información";
  }
  return el;
}

/** Show info text from a button's data-info attribute */
function showFrom(btn) {
  const info = getInfoEl();
  if (!info) return;
  const txt = btn.getAttribute("data-info");
  if (txt) {
    info.textContent = txt;
    info.title = txt; // tooltip with full text
  }
}

/** Reset info to its default content */
function resetInfo() {
  const info = getInfoEl();
  if (!info) return;
  const def = info.dataset.default || "Información";
  info.textContent = def;
  info.title = def;
}

/** Activate handlers for mouse/keyboard focus */
export function initInfoHover() {
  const BTN_SEL = SELECTORS.infoButtons;

  document.addEventListener("mouseover", (e) => {
    const btn = e.target.closest(BTN_SEL);
    if (btn) showFrom(btn);
  });
  document.addEventListener("mouseout", (e) => {
    const from = e.target.closest(BTN_SEL);
    const to = e.relatedTarget?.closest?.(BTN_SEL);
    if (from && !to) resetInfo();
  });

  document.addEventListener("focusin", (e) => {
    const btn = e.target.closest(BTN_SEL);
    if (btn) showFrom(btn);
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.closest(BTN_SEL)) resetInfo();
  });
}
