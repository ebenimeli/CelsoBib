// js/text/format.js
// Controles de formato para #itext (tamaño, familia, esquema)

let _metricsCache = null;
function getFontMetrics(itxt) {
  const cs = getComputedStyle(itxt);
  const fontCanvas = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if (_metricsCache?.font === fontCanvas) return _metricsCache;

  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = fontCanvas;

  // "Hg" suele cubrir ascendente y descendente
  const m = ctx.measureText("Hg");
  const ascent = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
  const descent = m.actualBoundingBoxDescent || parseFloat(cs.fontSize) * 0.2;
  const height = ascent + descent;

  _metricsCache = { font: fontCanvas, ascent, descent, height };
  return _metricsCache;
}

const LS_KEYS = {
  size: "write.fontSize",
  family: "write.fontFamily",
  scheme: "write.colorScheme",
};

// ⬇️ DEFAULTS: monospace y esquema "theme"
const DEFAULTS = {
  sizeRem: 1.0,
  minRem: 0.8,
  maxRem: 2.4,
  stepRem: 0.1,
  family:
    "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Roboto Mono,monospace",
  scheme: "theme", // <- antes: "default"
};

function roundTo(value, step = 0.1) {
  return Math.round(value / step) * step;
}

function $itxt() {
  return document.getElementById("itext");
}
function setInlineVar(varName, value) {
  const itxt = $itxt();
  if (itxt) itxt.style.setProperty(varName, value);
}
function getSavedSize() {
  return parseFloat(localStorage.getItem(LS_KEYS.size)) || DEFAULTS.sizeRem;
}
function getSavedFamily() {
  return localStorage.getItem(LS_KEYS.family) || DEFAULTS.family;
}
function getSavedScheme() {
  return localStorage.getItem(LS_KEYS.scheme) || DEFAULTS.scheme;
}

function applySize(rem) {
  setInlineVar("--write-font-size", `${rem}rem`);
  const out = document.getElementById("font-size-display");
  if (out) out.textContent = `${rem.toFixed(1)}rem`;
}
function applyFamilyInline(family) {
  setInlineVar("--write-font-family", family);
}

// ⬇️ applyScheme: soporta "theme" (quitar clases y heredar)
function applyScheme(scheme) {
  const itxt = document.getElementById("itext");
  if (!itxt) return;

  // Quita cualquier scheme- previo
  [...itxt.classList].forEach(
    (c) => c.startsWith("scheme-") && itxt.classList.remove(c)
  );

  if (scheme === "retro") {
    itxt.classList.add("scheme-retro");
    itxt.style.setProperty(
      "--write-font-family",
      "'CPC464', ui-monospace, monospace"
    );
  } else if (scheme === "default") {
    itxt.classList.add("scheme-default");
    itxt.style.setProperty("--write-font-family", getSavedFamily());
  } else if (scheme === "dark") {
    itxt.classList.add("scheme-dark");
    itxt.style.setProperty("--write-font-family", getSavedFamily());
  } else {
    // "theme" o vacío → heredar tema global
    itxt.style.setProperty("--write-font-family", getSavedFamily());
  }

  localStorage.setItem(LS_KEYS.scheme, scheme);
}

function loadState() {
  return {
    size: getSavedSize(),
    family: getSavedFamily(),
    scheme: getSavedScheme(),
  };
}
function saveState({ size, family, scheme }) {
  if (typeof size === "number")
    localStorage.setItem(LS_KEYS.size, String(size));
  if (typeof family === "string") localStorage.setItem(LS_KEYS.family, family);
  if (typeof scheme === "string") localStorage.setItem(LS_KEYS.scheme, scheme);
}

/* ============================
   Init
============================ */
export function initFormatControls() {
  const itxt = $itxt();
  if (!itxt) return;

  itxt.classList.add("write-target");

  const btnMinus = document.getElementById("font-smaller");
  const btnPlus = document.getElementById("font-bigger");
  const btnReset = document.getElementById("font-reset");
  const selFamily = document.getElementById("font-family-select");
  const selScheme = document.getElementById("scheme-select");

  const state = loadState();

  // Tamaño + familia
  applySize(state.size);
  applyFamilyInline(state.family);

  // Esquema
  applyScheme(state.scheme);

  // Refleja selects
  if (selFamily) selFamily.value = state.family;
  if (selScheme) selScheme.value = state.scheme;

  // Listeners tamaño
  btnMinus?.addEventListener("click", () => {
    const cur = getSavedSize();
    const next = Math.max(
      DEFAULTS.minRem,
      roundTo(cur - DEFAULTS.stepRem, DEFAULTS.stepRem)
    );
    applySize(next);
    saveState({ size: next });
  });
  btnPlus?.addEventListener("click", () => {
    const cur = getSavedSize();
    const next = Math.min(
      DEFAULTS.maxRem,
      roundTo(cur + DEFAULTS.stepRem, DEFAULTS.stepRem)
    );
    applySize(next);
    saveState({ size: next });
  });
  btnReset?.addEventListener("click", () => {
    applySize(DEFAULTS.sizeRem);
    saveState({ size: DEFAULTS.sizeRem });
  });

  // Listener tipografía
  selFamily?.addEventListener("change", (e) => {
    const family = e.target.value;
    saveState({ family });
    if (getSavedScheme() !== "retro") {
      applyFamilyInline(family);
    }
  });

  // Listener esquema
  selScheme?.addEventListener("change", (e) => {
    const scheme = e.target.value;
    applyScheme(scheme);
    saveState({ scheme });
  });
}

localStorage.removeItem("write.fontFamily");
localStorage.removeItem("write.colorScheme");
