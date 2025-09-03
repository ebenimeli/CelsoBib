// js/text/write-utils.js
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitForSelectors(selectors, timeout = 5000, step = 50) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    if (selectors.every((s) => document.querySelector(s))) return true;
    await sleep(step);
  }
  return false;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function readCssRemVar(el, varName, fallbackRem = 1.0) {
  const raw = getComputedStyle(el).getPropertyValue(varName).trim();
  if (!raw) return fallbackRem;
  const m = raw.match(/^([0-9.]+)\s*rem$/i);
  return m ? parseFloat(m[1]) : fallbackRem;
}

export function getItxt() {
  return document.getElementById("itext");
}
