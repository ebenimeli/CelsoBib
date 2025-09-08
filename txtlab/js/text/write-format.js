// js/text/write-format.js
import { clamp, readCssRemVar, getItxt } from "./write-utils.js";

const FONT_MIN = 0.6;
const FONT_MAX = 3.0;
const FONT_STEP = 0.1;

export function applyFontSize(rem) {
  const itxt = getItxt();
  if (!itxt) return;
  const size = clamp(Number(rem) || 1.0, FONT_MIN, FONT_MAX);
  itxt.style.setProperty("--write-font-size", `${size}rem`);
  localStorage.setItem("write.fontSize", String(size));
  const disp = document.getElementById("font-size-display");
  if (disp) disp.textContent = `${size.toFixed(1)}rem`;
}

export function nudgeFontSize(delta) {
  const itxt = getItxt();
  if (!itxt) return;
  const current = readCssRemVar(itxt, "--write-font-size", 1.0);
  applyFontSize(current + delta);
}

export function resetFontSize() {
  applyFontSize(1.0);
}

export function applyFontFamily(family) {
  const itxt = getItxt();
  if (!itxt) return;
  const val = String(family || "").trim();
  if (val) {
    itxt.style.setProperty("--write-font-family", val);
    localStorage.setItem("write.fontFamily", val);
  }
  const sel = document.getElementById("font-family-select");
  if (sel && sel.value !== val) sel.value = val;
}

export function applyScheme(scheme) {
  const itxt = getItxt();
  if (!itxt) return;
  // elimina clases scheme-*
  [...itxt.classList]
    .filter((c) => c.startsWith("scheme-"))
    .forEach((c) => itxt.classList.remove(c));
  // "theme" = base por tema
  if (scheme && scheme !== "theme") itxt.classList.add(`scheme-${scheme}`);
  localStorage.setItem("write.colorScheme", scheme || "theme");
  const sel = document.getElementById("scheme-select");
  if (sel && sel.value !== scheme) sel.value = scheme || "theme";
}

export function restoreFormatFromStorage() {
  const itxt = getItxt();
  if (!itxt) return;
  const storedSize = parseFloat(localStorage.getItem("write.fontSize") || "1");
  const storedFamily = localStorage.getItem("write.fontFamily");
  const storedScheme = localStorage.getItem("write.colorScheme") || "theme";
  if (Number.isFinite(storedSize)) applyFontSize(storedSize);
  if (storedFamily) applyFontFamily(storedFamily);
  applyScheme(storedScheme);
}

export function wireFormatControls(root = document) {
  const smaller = root.getElementById("font-smaller");
  const bigger = root.getElementById("font-bigger");
  const reset = root.getElementById("font-reset");
  const selFam = root.getElementById("font-family-select");
  const selSch = root.getElementById("scheme-select");

  smaller?.addEventListener("click", () => nudgeFontSize(-FONT_STEP));
  bigger?.addEventListener("click", () => nudgeFontSize(+FONT_STEP));
  reset?.addEventListener("click", resetFontSize);

  selFam?.addEventListener("change", (e) => applyFontFamily(e.target.value));
  selSch?.addEventListener("change", (e) => applyScheme(e.target.value));

  restoreFormatFromStorage();
}

export function resetSchemeToTheme() {
  const itxt = document.getElementById("itext");
  if (!itxt) return;

  // Quitar clases scheme-*
  [...itxt.classList]
    .filter((c) => c.startsWith("scheme-"))
    .forEach((c) => itxt.classList.remove(c));

  const DEFAULT_FONT_FAMILY =
    "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif";
  const DEFAULT_FONT_SIZE_REM = 1.0;

  itxt.style.setProperty("--write-font-family", DEFAULT_FONT_FAMILY);
  itxt.style.setProperty("--write-font-size", `${DEFAULT_FONT_SIZE_REM}rem`);

  const selFamily = document.getElementById("font-family-select");
  if (selFamily) selFamily.value = DEFAULT_FONT_FAMILY;
  const sizeDisplay = document.getElementById("font-size-display");
  if (sizeDisplay)
    sizeDisplay.textContent = `${DEFAULT_FONT_SIZE_REM.toFixed(1)}rem`;

  localStorage.setItem("write.fontFamily", DEFAULT_FONT_FAMILY);
  localStorage.setItem("write.fontSize", String(DEFAULT_FONT_SIZE_REM));
  localStorage.setItem("write.colorScheme", "theme");
}
