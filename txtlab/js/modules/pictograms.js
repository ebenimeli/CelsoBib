// js/pictograms.js
(() => {
  const ARASAAC_LANG = "es";
  const PNG_SIZE = 300; // 150 | 300 | 500…
  const PIC_INLINE_PX = 26; // altura del <img> en línea

  const SELECTORS = {
    root: "#read-accessible",
    input: "#ra-input",
    output: "#ra-content",
    toggle: "#ra-pictos-on",
    apply: '[data-action="raApply"]',
  };

  // ---------- Utils ----------
  const $ = (sel, host = document) => host.querySelector(sel);

  const escapeHtml = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );

  const stripDiacritics = (s) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizeWord = (w) => stripDiacritics(String(w).toLowerCase());

  // Palabras / números / signos / espacios
  const tokenize = (text) => {
    const out = [];
    const re = /(\p{L}+\p{M}*|\d+|[^\s\p{L}\p{M}\d]+|\s+)/gu;
    let m;
    while ((m = re.exec(text)) !== null) out.push(m[0]);
    return out;
  };

  const debounce = (fn, ms = 250) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  // ---------- Cache por sesión ----------
  const cacheKey = (word) => `ra:ar:${ARASAAC_LANG}:png:${PNG_SIZE}:${word}`;
  const getCached = (word) => {
    try {
      return sessionStorage.getItem(cacheKey(word));
    } catch {
      return null;
    }
  };
  const setCached = (word, url) => {
    try {
      sessionStorage.setItem(cacheKey(word), url);
    } catch {}
  };

  // ---------- ARASAAC ----------
  async function fetchArasaacURL(word) {
    if (!word) return null;

    const cached = getCached(word);
    if (cached) return cached;

    // OJO: este endpoint da 400 si añades query params (nada de ?_=timestamp)
    const searchURL = `https://api.arasaac.org/api/pictograms/${encodeURIComponent(
      ARASAAC_LANG
    )}/search/${encodeURIComponent(word)}`;

    try {
      const res = await fetch(searchURL, { cache: "no-store" });
      if (!res.ok) {
        console.warn("[ARASAAC] search NO OK:", res.status, word);
        return null;
      }

      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) return null;

      const id = arr[0]?.id;
      if (id == null) return null;

      const url = `https://static.arasaac.org/pictograms/${id}/${id}_${PNG_SIZE}.png`;
      setCached(word, url);
      return url;
    } catch (err) {
      console.warn("[ARASAAC] error:", err, word);
      return null;
    }
  }

  // ---------- Render rápido (sin esperar a fetch) ----------
  function renderFast(text, pictosOn) {
    const tokens = tokenize(text);
    const html = tokens
      .map((tk) => {
        // espacios → conserva
        if (/^\s+$/.test(tk)) return tk.replace(/ /g, "&nbsp;");
        // tokens que no empiezan por letra → tal cual
        if (!/^\p{L}/u.test(tk)) return escapeHtml(tk);

        if (!pictosOn) return escapeHtml(tk);

        // span marcador para mejora progresiva
        const key = normalizeWord(tk).replace(/[^a-z]/g, ""); // selector seguro
        return (
          `<span class="ra-token" data-word="${key}">` +
          `<span class="ra-word">${escapeHtml(tk)}</span>` +
          `</span>`
        );
      })
      .join("");

    // párrafos por doble salto; saltos simples → <br>
    return String(html)
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  // ---------- Mejora progresiva: inyecta <img> cuando llega cada URL ----------
  async function progressivelyAttachPictos(root, pictosOn) {
    if (!pictosOn) return;

    const output = $(SELECTORS.output, root);
    if (!output) return;

    // palabras únicas que están marcadas en el DOM
    const spans = [...output.querySelectorAll("[data-word]")];
    const unique = [
      ...new Set(spans.map((s) => s.getAttribute("data-word")).filter(Boolean)),
    ];

    // resolvemos en paralelo pero insertamos según llega cada una
    unique.forEach(async (key) => {
      if (!key) return;

      const url = await fetchArasaacURL(key);
      if (!url) return;

      // todos los spans con esa palabra
      output.querySelectorAll(`[data-word="${key}"]`).forEach((span) => {
        if (span.dataset.pictoApplied === "1") return; // ya hecho

        const wordText = span.textContent || key;
        span.innerHTML =
          `<img class="ra-picto" src="${url}" alt="${escapeHtml(wordText)}" ` +
          `style="height:${PIC_INLINE_PX}px">` +
          `<span class="ra-word">${escapeHtml(wordText)}</span>`;
        span.dataset.pictoApplied = "1";
      });
    });
  }

  // ---------- Pintado principal ----------
  async function paint() {
    const root = $(SELECTORS.root);
    const input = $(SELECTORS.input, root);
    const output = $(SELECTORS.output, root);
    const toggle = $(SELECTORS.toggle, root);
    if (!root || !input || !output || !toggle) return;

    const pictosOn = !!toggle.checked;
    const raw = input.value || "";

    // 1) Pintado inmediato
    output.innerHTML = renderFast(raw, pictosOn);

    // 2) Añadir pictos progresivamente
    progressivelyAttachPictos(root, pictosOn);
  }

  // ---------- Wireup ----------
  function init() {
    const root = $(SELECTORS.root);
    if (!root) return;

    const toggle = $(SELECTORS.toggle, root);
    const input = $(SELECTORS.input, root);
    const apply = $(SELECTORS.apply, root);

    if (toggle) toggle.addEventListener("change", paint);
    if (input) input.addEventListener("input", debounce(paint, 200));
    if (apply) apply.addEventListener("click", paint);

    paint(); // primera pasada
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
