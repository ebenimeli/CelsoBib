// js/i18n.js  (ESM)

// Idiomas soportados y por defecto
const SUPPORTED = ["en", "es", "de", "fr"];
const DEFAULT_LANG = "en";

function normalizeTag(tag) {
  if (!tag) return null;
  const base = String(tag).toLowerCase().split("-")[0];
  return SUPPORTED.includes(base) ? base : null;
}

function detectBrowserLang() {
  try {
    const prefs = [...(navigator.languages || []), navigator.language].filter(
      Boolean
    );
    for (const t of prefs) {
      const n = normalizeTag(t);
      if (n) return n;
    }
  } catch (_) {}
  // Si nada coincide, usa inglés por defecto
  return DEFAULT_LANG;
}

let currentLang =
  normalizeTag(localStorage.getItem("txtlab.lang")) || detectBrowserLang();
let currentDict = null;

// Atributos traducibles vía data-i18n-* (atributos nativos / ARIA / etc.)
const ATTRS = [
  "title",
  "placeholder",
  "ariaLabel",
  "ariaDescription",
  "ariaLabelledby",
  "ariaDescribedby",
];

// Atributos data-* extra que queremos poblar desde i18n
// (clave i18n en el DOM → atributo real a escribir)
const EXTRA_DATA_ATTRS = [
  { i18nAttr: "data-i18n-data-label-on", targetAttr: "data-label-on" },
  { i18nAttr: "data-i18n-data-label-off", targetAttr: "data-label-off" },
];

export async function loadLocale(
  lang = DEFAULT_LANG,
  { fallback = true } = {}
) {
  try {
    const res = await fetch(`assets/locales/${lang}.json`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentDict = await res.json();

    currentLang = lang;
    localStorage.setItem("txtlab.lang", lang);
    document.documentElement.setAttribute("lang", lang);

    // Título / meta opcionales
    if (currentDict.page_title) document.title = currentDict.page_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && currentDict.page_description) {
      metaDesc.setAttribute("content", currentDict.page_description);
    }

    // Aplica inmediatamente
    applyLocaleTo(document);
  } catch (err) {
    console.error("[i18n] Error cargando idioma", lang, err);
    // Fallback primario SIEMPRE a inglés
    if (fallback && lang !== DEFAULT_LANG) {
      console.warn("[i18n] Reintentando con inglés (fallback)...");
      return loadLocale(DEFAULT_LANG, { fallback: false });
    }
    // (Opcional) último recurso: español si incluso falla inglés
    if (fallback && lang === DEFAULT_LANG) {
      try {
        return loadLocale("es", { fallback: false });
      } catch (_) {}
    }
  }
}

export function getCurrentLang() {
  return currentLang;
}

export function applyLocaleTo(root = document, dict = currentDict) {
  if (!dict) return;
  const scope = root instanceof Document ? root : root || document;

  // 1) Contenidos (texto interior)
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && dict[key] != null) {
      el.textContent = String(dict[key]);
    }
  });

  // 2) Atributos nativos (title, placeholder, aria-*, ...)
  ATTRS.forEach((attr) => {
    // Selecciona por el nombre de la "propiedad" camel-cased en el dataset:
    // p.ej. data-i18n-ariaLabel → selector '[data-i18n-ariaLabel]'
    const selector = `[data-i18n-${attr}]`;
    scope.querySelectorAll(selector).forEach((el) => {
      const key = el.getAttribute(`data-i18n-${attr}`);
      if (!key || dict[key] == null) return;

      // Convierte 'ariaLabel' -> 'aria-label', etc.
      const htmlAttr = attr.replace(/([A-Z])/g, (m) => "-" + m.toLowerCase());
      el.setAttribute(htmlAttr, String(dict[key]));
    });
  });

  // 3) Atributos data-* específicos (data-label-on/off, etc.)
  EXTRA_DATA_ATTRS.forEach(({ i18nAttr, targetAttr }) => {
    scope.querySelectorAll(`[${i18nAttr}]`).forEach((el) => {
      const key = el.getAttribute(i18nAttr);
      if (!key || dict[key] == null) return;
      el.setAttribute(targetAttr, String(dict[key]));
    });
  });

  // 4) Visibilidad condicional por idioma
  scope.querySelectorAll("[data-i18n-visible]").forEach((el) => {
    const required = el.getAttribute("data-i18n-visible");
    el.style.display = required === currentLang ? "" : "none";
  });
}

// Debounce simple para ráfagas
function debounce(fn, ms = 0) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export function initI18n() {
  // Selector del footer
  const sel = document.getElementById("lang-switch");

  // Idioma inicial: guardado válido o detectado (con fallback a inglés)
  const saved = normalizeTag(localStorage.getItem("txtlab.lang"));
  const initial = saved || detectBrowserLang();

  // Ajusta el <select> si existe y tiene la opción
  if (sel) {
    const hasOption = [...sel.options].some((o) => o.value === initial);
    sel.value = hasOption ? initial : DEFAULT_LANG;
  }

  // Aplica idioma inicial
  loadLocale(initial);

  // Cambios manuales
  sel?.addEventListener("change", (e) => {
    const lang = e.target.value;
    loadLocale(lang);
  });

  // Observa el DOM para traducir nodos insertados (templates)
  const applyAdded = debounce((nodes) => {
    if (!currentDict) return;
    for (const n of nodes) {
      if (n.nodeType === 1) applyLocaleTo(n);
    }
  }, 0);

  const mo = new MutationObserver((muts) => {
    const added = [];
    for (const m of muts) {
      if (m.addedNodes && m.addedNodes.length) added.push(...m.addedNodes);
    }
    if (added.length) applyAdded(added);
  });

  mo.observe(document.body, { childList: true, subtree: true });
}
