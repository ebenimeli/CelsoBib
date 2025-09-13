// js/modules/readerAccessible.js
export function mountReaderAccessible(opts = {}) {
  const host = opts.root instanceof Element ? opts.root : document;
  const root = host.querySelector("#read-accessible");
  if (!root || root.dataset.raMounted === "1") return;
  root.dataset.raMounted = "1";

  const content = root.querySelector("#ra-content");
  const input = root.querySelector("#ra-input");
  const attrib = root.querySelector(".ra-attrib");

  // Helpers
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));
  const setVar = (name, value) => root.style.setProperty(name, value);

  // ==============================
  //  Controles tipográficos
  // ==============================
  const fs = $("#ra-fs");
  const fsOut = $("#ra-fs-val");
  const lh = $("#ra-lh");
  const lhOut = $("#ra-lh-val");
  const ls = $("#ra-ls");
  const lsOut = $("#ra-ls-val");
  const ws = $("#ra-ws");
  const wsOut = $("#ra-ws-val");
  const mw = $("#ra-mw");
  const mwOut = $("#ra-mw-val");
  const fontSel = $("#ra-font");

  function applyVars() {
    if (!content) return;

    if (fs) {
      const v = `${fs.value}px`;
      setVar("--ra-font-size", v);
      content.style.fontSize = v;
      fsOut && (fsOut.textContent = v);
    }
    if (lh) {
      const v = String(lh.value);
      setVar("--ra-line-height", v);
      content.style.lineHeight = v;
      lhOut && (lhOut.textContent = v);
    }
    if (ls) {
      const v = `${Number(ls.value).toFixed(2)}em`;
      setVar("--ra-letter-spacing", v);
      content.style.letterSpacing = v;
      lsOut && (lsOut.textContent = v);
    }
    if (ws) {
      const v = `${Number(ws.value).toFixed(2)}em`;
      setVar("--ra-word-spacing", v);
      content.style.wordSpacing = v;
      wsOut && (wsOut.textContent = v);
    }
    if (mw) {
      const v = `${mw.value}ch`;
      setVar("--ra-max-width", v);
      content.style.maxWidth = v;
      mwOut && (mwOut.textContent = v);
    }
  }
  [fs, lh, ls, ws, mw].forEach((ctrl) =>
    ctrl?.addEventListener("input", applyVars)
  );

  // === Cambio de fuente (elimina cualquier clase .font-*) ===
  const FONT_PREFIX = "font-";
  function clearFontClasses(el) {
    if (!el) return;
    [...el.classList].forEach((cls) => {
      if (cls.startsWith(FONT_PREFIX)) el.classList.remove(cls);
    });
  }

  fontSel?.addEventListener("change", () => {
    clearFontClasses(content);
    if (fontSel.value) content.classList.add(fontSel.value);
    applyVars();
    void content.offsetWidth; // fuerza reflow (Safari)
  });

  // ===== Temas sobre el visor (.ra-reader) =====
  const themeClasses = [
    "theme-white",
    "theme-soft",
    "theme-sepia",
    "theme-blue",
    "theme-gray",
    "theme-dark",
    "theme-high",
  ];
  const themeTarget = root.querySelector(".ra-reader") || root;
  root.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="raTheme"][data-theme]');
    if (!btn) return;
    themeTarget.classList.remove(...themeClasses);
    themeTarget.classList.add(btn.dataset.theme);
  });

  // ==============================
  //  PROCESADO (captura botones)
  // ==============================
  const btnSyll = $("#ra-toggle-syll");
  const btnLine = $("#ra-toggle-line");
  const btnFSent = $("#ra-focus-sent");
  const btnFPar = $("#ra-focus-par");
  const btnFOff = $("#ra-focus-off");

  const btnSelectAll = root.querySelector('[data-action="raSelectAll"]');
  const btnClearMarks = root.querySelector('[data-action="raClearMarks"]');
  const btnPrint = root.querySelector('[data-action="raPrint"]');

  // ==============================
  //  PICTOGRAMAS — Controles y estado
  // ==============================
  const LS_KEY_DICT = "txtlab:ra:pictos:dict:v1";
  const $picOn = $("#ra-pictos-on");
  const $picMode = $("#ra-pictos-mode");
  const $picSize = $("#ra-pictos-size");
  const $picSizeVal = $("#ra-pictos-size-val");

  // ¡Por defecto ARASAAC!
  const $picProv = $("#ra-pictos-provider"); // valores esperados: arasaac (o null si no hay select)
  // Opciones ARASAAC (opcionales, con defaults sensatos)
  const arasaacOpts = {
    lang: opts.arasaacLang || "es", // idioma de búsqueda
    format: opts.arasaacFormat || "png", // "svg" | "png"
    pngSize: opts.arasaacPngSize || 300, // 150, 300, 500...
  };

  // (Diccionario local por compat.)
  const DEFAULT_DICT = {
    casa: "pictos/house.svg",
    perro: "pictos/dog.svg",
    gato: "pictos/cat.svg",
    colegio: "pictos/school.svg",
    escuela: "pictos/school.svg",
    leer: "pictos/read.svg",
    escribir: "pictos/write.svg",
    jugar: "pictos/play.svg",
    comer: "pictos/eat.svg",
    beber: "pictos/drink.svg",
    baño: "pictos/toilet.svg",
    patio: "pictos/yard.svg",
    amigo: "pictos/friend.svg",
    amiga: "pictos/friend.svg",
    manzana: "pictos/apple.svg",
  };

  function loadDict() {
    try {
      const raw = localStorage.getItem(LS_KEY_DICT);
      if (!raw) return { ...DEFAULT_DICT };
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_DICT };
    }
  }
  function saveDict(obj) {
    localStorage.setItem(LS_KEY_DICT, JSON.stringify(obj));
  }

  let PICTO_DICT = loadDict();

  // ==============================
  //  Modo de foco actual
  // ==============================
  let focusMode = "none";

  // Helpers visuales
  function setPressed(btn, on) {
    btn?.setAttribute("aria-pressed", String(!!on));
  }
  function updateFocusButtons() {
    setPressed(btnFSent, focusMode === "sentence");
    setPressed(btnFPar, focusMode === "paragraph");
    setPressed(btnFOff, focusMode === "none");
  }

  // --- Volcar textarea al visor con pictos ---
  function fixSpanishAccents(s = "") {
    const nfc = String(s).normalize("NFC");
    const map = {
      a: "á",
      e: "é",
      i: "í",
      o: "ó",
      u: "ú",
      A: "Á",
      E: "É",
      I: "Í",
      O: "Ó",
      U: "Ú",
    };
    return nfc.replace(
      /([AaEeIiOoUu])[\u00B4\u2019\u2018\u02BC\u02CA\u2032']/g,
      (_, v) => map[v] || v
    );
  }

  function paintFromTextarea() {
    const raw = input?.value || "";
    const txt = fixSpanishAccents(raw);

    // Render con pictogramas (si están activados)
    // ⬇️ Si no hay checkbox en la UI, asumimos ON
    const on = $picOn ? $picOn.checked : true;
    const mode = $picMode?.value || "inline";
    theSizeUpdate();
    const size = Number($picSize?.value || 28);
    // Por defecto 'arasaac' si no hay select o no tiene valor
    const provider = $picProv?.value || "arasaac";

    const html = paragraphizeWithPictos(txt, { on, mode, size, provider });
    content.innerHTML = html;

    content.classList.toggle("pictos-only", on && mode === "only");
    content.classList.toggle("pictos-margin", on && mode === "margin");
    content.classList.toggle("pictos-inline", on && mode === "inline"); // ← nuevo

    // Atribución mínima
    if (attrib) {
      if (on && provider === "arasaac") {
        attrib.textContent =
          "Pictogramas de Sergio Palao para ARASAAC (Gobierno de Aragón). Licencia CC BY-NC-SA 4.0. https://arasaac.org";
      } else if (on) {
        attrib.textContent =
          "Incluye pictogramas de terceros; respeta la licencia del conjunto utilizado.";
      } else {
        attrib.textContent = "";
      }
    }
  }

  function paragraphizeWithPictos(text, opts) {
    if (!text) return "";
    const parts = String(text).split(/\n{2,}/);
    return parts
      .map((p) => `<p>${renderWithPictos(p, opts).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  // ==============================
  //  Tokenización y render de pictos
  // ==============================
  function stripDiacritics(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function normalizeWord(w) {
    return stripDiacritics(w.toLowerCase());
  }
  function tokenize(text) {
    // palabras (con marcas diacríticas), números, signos, espacios
    const out = [];
    const re = /(\p{L}+\p{M}*|\d+|[^\s\p{L}\p{M}\d]+|\s+)/gu;
    let m;
    while ((m = re.exec(text)) !== null) out.push(m[0]);
    return out;
  }

  function lookupPicto(word, provider) {
    // Proveedor ARASAAC (prioritario)
    if (provider === "arasaac") {
      const key = `txtlab:ra:ar:${arasaacOpts.lang}:${arasaacOpts.format}:${arasaacOpts.pngSize}:${word}`;
      const cached = sessionStorage.getItem(key);
      if (cached) return cached;
      fetchArasaac(word, {
        lang: arasaacOpts.lang,
        format: arasaacOpts.format,
        pngSize: arasaacOpts.pngSize,
      }).then((url) => {
        if (url) {
          sessionStorage.setItem(key, url);
          // ⬇️ Re-pinta si pictos están ON; si no hay checkbox, asumimos ON
          const pictosOn = $picOn ? $picOn.checked : true;
          const prov = $picProv?.value || "arasaac";
          if (pictosOn && prov === "arasaac") {
            paintFromTextarea();
          }
        }
      });
      return null;
    }

    // Fallback (no debería usarse si solo ofreces ARASAAC en la UI)
    return PICTO_DICT[word] || null;
  }

  // ===== ARASAAC =====
  async function fetchArasaac(
    q,
    { lang = "es", format = "png", pngSize = 300 } = {}
  ) {
    if (!q) return null;
    try {
      // 1) Buscar por término (evitar 304)
      const baseURL = `https://api.arasaac.org/api/pictograms/${encodeURIComponent(
        lang
      )}/search/${encodeURIComponent(q)}`;

      // Primer intento: forzar recarga (puede devolver 304 si hay ETag)
      let res = await fetch(baseURL, { cache: "reload" });

      // Si llega 304, reintenta sin usar caché y con cache-buster
      if (res.status === 304) {
        const bustURL = `${baseURL}?_=${Date.now()}`;
        res = await fetch(bustURL, { cache: "no-store" });
      }

      if (!res.ok) {
        console.warn("[ARASAAC] Respuesta no OK:", res.status, res.statusText);
        return null;
      }

      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) return null;

      // 2) Elegimos el primer resultado
      const id = arr[0]?.id;
      if (!id && id !== 0) return null;

      // 3) Construimos URL de imagen estática (CORS friendly)
      if (format === "svg") {
        return `https://static.arasaac.org/pictograms/${id}/${id}.svg`;
      }
      const size = Number.isFinite(pngSize) ? pngSize : 300;
      return `https://static.arasaac.org/pictograms/${id}/${id}_${size}.png`;
    } catch (e) {
      console.warn("[ARASAAC] Error de red/búsqueda:", e);
      return null;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(
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
  }

  function renderWithPictos(
    text,
    { on = true, mode = "inline", size = 28, provider = "arasaac" } = {}
  ) {
    if (!on) return escapeHtml(text);
    const tokens = tokenize(text);
    const out = [];

    for (const tk of tokens) {
      // espacios
      if (/^\s+$/.test(tk)) {
        out.push(tk.replace(/ /g, "&nbsp;"));
        continue;
      }
      // signos sin letras al inicio
      if (/[^\p{L}\p{M}\d]/u.test(tk) && !/^\p{L}/u.test(tk)) {
        out.push(escapeHtml(tk));
        continue;
      }

      const key = normalizeWord(tk);
      const url = lookupPicto(key, provider);
      if (!url) {
        out.push(escapeHtml(tk));
        continue;
      }

      if (mode === "only") {
        out.push(
          `<img class="ra-picto" src="${url}" alt="${escapeHtml(
            tk
          )}" style="height:${size}px">`
        );
      } else {
        out.push(
          `<span class="ra-token">` +
            (mode === "margin"
              ? `<img class="ra-picto" src="${url}" alt="${escapeHtml(
                  tk
                )}" style="height:${size}px">`
              : ``) +
            (mode === "inline"
              ? `<img class="ra-picto" src="${url}" alt="${escapeHtml(
                  tk
                )}" style="height:${Math.round(size * 0.9)}px">`
              : ``) +
            `<span class="ra-word">${escapeHtml(tk)}</span>` +
            `</span>`
        );
      }
    }
    return out.join("");
  }

  // ==============================
  //  Aplicar desde UI
  // ==============================
  root
    .querySelector('[data-action="raApply"]')
    ?.addEventListener("click", () => {
      paintFromTextarea();
      applyVars();
    });

  // Re-pintar si cambia proveedor/modo/tamaño
  $picProv?.addEventListener("change", paintFromTextarea);
  $picMode?.addEventListener("change", paintFromTextarea);
  $picOn?.addEventListener("change", paintFromTextarea);
  $picSize?.addEventListener("change", paintFromTextarea);

  // Live output del tamaño
  function theSizeUpdate() {
    if ($picSizeVal && $picSize)
      $picSizeVal.textContent = `${$picSize.value}px`;
  }
  $picSize?.addEventListener("input", theSizeUpdate);

  // ==============================
  //  Utilidades comunes
  // ==============================
  let lastActive = null;
  const clearActive = () => {
    lastActive?.classList?.remove("is-active");
    lastActive = null;
  };
  const setActive = (el) => {
    if (!el) return clearActive();
    if (el !== lastActive) {
      clearActive();
      el.classList.add("is-active");
      lastActive = el;
    }
  };

  function unwrapAll(rootEl, selector) {
    rootEl.querySelectorAll(selector).forEach((el) => {
      const parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
    });
  }
  const unwrapSyllables = (rootEl) => unwrapAll(rootEl, ".syll");

  function ensureHasContent() {
    if (!content) return;
    if (!content.textContent.trim() && input?.value.trim()) {
      paintFromTextarea();
    }
  }

  // ==============================
  //  Sílabas
  // ==============================
  btnSyll?.addEventListener("click", () => {
    ensureHasContent();
    const on = btnSyll.getAttribute("aria-pressed") === "true";
    const next = !on;
    setPressed(btnSyll, next);
    btnSyll.textContent = next ? "Sílabas: on" : "Sílabas: off";
    if (!content) return;
    if (next) markSyllables(content);
    else unwrapSyllables(content);
  });

  function markSyllables(rootEl) {
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const txt = node.nodeValue;
        if (!txt || !txt.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest(".syll"))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

    nodes.forEach((node) => {
      const parent = node.parentNode;
      const frag = document.createDocumentFragment();
      const tokens = String(node.nodeValue).split(
        /(\s+|[.,;:!?()\[\]"“”«»…—–-]+)/
      );

      tokens.forEach((tok) => {
        if (!tok) return;
        if (/^(\s+|[.,;:!?()\[\]"“”«»…—–-]+)$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
          return;
        }
        syllabifyES(tok).forEach((syl, i) => {
          const span = document.createElement("span");
          span.className = "syll s" + (i % 2);
          span.textContent = syl;
          frag.appendChild(span);
        });
      });

      parent.replaceChild(frag, node);
    });
  }

  function syllabifyES(rawWord) {
    const word = String(rawWord || "");
    const isV = (ch) => /[aeiouáéíóúü]/i.test(ch);
    const isC = (ch) => /[bcdfghjklmnñpqrstvwxyz]/i.test(ch);
    const parts = [];
    let i = 0,
      n = word.length;

    while (i < n) {
      let j = i;
      while (j < n && !isV(word[j])) j++;
      if (j >= n) {
        parts.push(word.slice(i));
        break;
      }

      let k = j + 1;
      while (k < n && isV(word[k])) k++;

      let cut = k;
      const c1 = String(word[k] || "");
      const c2 = String(word[k + 1] || "");
      const c1c = c1.toLowerCase();
      const c2c = c2.toLowerCase();
      const pair = (c1 + c2).toLowerCase();

      if (isC(c1c) && isC(c2c)) {
        if (
          c2c === "l" ||
          c2c === "r" ||
          pair === "ch" ||
          pair === "ll" ||
          pair === "rr"
        ) {
          cut = k; // V|CL/CR/CH/LL/RR
        } else {
          cut = k + 1; // VC|C
        }
      } else {
        cut = k;
      }

      parts.push(word.slice(i, cut));
      i = cut;
    }
    return parts.length ? parts : [word];
  }

  // ==============================
  //  Resaltar línea
  // ==============================
  let lineHoverBound = false;
  const lineHoverHandler = (e) => {
    const el = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!el) return;
    const line = el.closest(".line");
    if (!line || !content.contains(line)) return;
    setActive(line);
  };

  function ensureLinesWrapped() {
    content.querySelectorAll("p").forEach(wrapLinesInParagraph);
  }

  function wrapLinesInParagraph(p) {
    if (p.querySelector(".line")) return;
    const frag = document.createDocumentFragment();
    let current = document.createElement("span");
    current.className = "line";

    [...p.childNodes].forEach((node) => {
      if (node.nodeName === "BR") {
        frag.appendChild(current);
        frag.appendChild(node.cloneNode(true));
        current = document.createElement("span");
        current.className = "line";
      } else {
        current.appendChild(node.cloneNode(true));
      }
    });
    if (current.childNodes.length) frag.appendChild(current);
    p.replaceChildren(frag);
  }

  function turnOffLineHighlight(alsoUnwrap = false) {
    setPressed(btnLine, false);
    btnLine && (btnLine.textContent = "Resaltar línea: off");
    if (lineHoverBound) {
      content.removeEventListener("pointermove", lineHoverHandler);
      content.removeEventListener("pointerleave", clearActive);
      lineHoverBound = false;
    }
    content
      .querySelectorAll(".line.is-active")
      .forEach((el) => el.classList.remove("is-active"));
    clearActive();
    if (alsoUnwrap) unwrapAll(content, ".line");
  }

  btnLine?.addEventListener("click", () => {
    ensureHasContent();
    const on = btnLine.getAttribute("aria-pressed") === "true";
    const next = !on;
    setPressed(btnLine, next);
    btnLine.textContent = next ? "Resaltar línea: on" : "Resaltar línea: off";

    if (!content) return;
    if (next) {
      ensureLinesWrapped();
      if (!lineHoverBound) {
        content.addEventListener("pointermove", lineHoverHandler);
        content.addEventListener("pointerleave", clearActive);
        lineHoverBound = true;
      }
    } else {
      turnOffLineHighlight(false);
    }
  });

  // ==============================
  //  Foco: frases / párrafos / off
  // ==============================
  function focusMoveHandler(e) {
    const el = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!el) return;

    if (focusMode === "sentence") {
      const sent = el.closest(".sent");
      if (sent && content.contains(sent)) setActive(sent);
    } else if (focusMode === "paragraph") {
      const p = el.closest("p");
      if (p && content.contains(p)) setActive(p);
    }
  }

  function wrapSentences(rootEl) {
    rootEl.querySelectorAll("p").forEach((p) => {
      if (p.querySelector(".sent")) return;

      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim())
            return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.closest(".sent"))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

      const SENT_RE = /[^.!?…]+[.!?…]+(?:["”»']+)?|\S+$/g;

      nodes.forEach((node) => {
        const text = node.nodeValue;
        const matches = text.match(SENT_RE);
        if (!matches) return;

        const frag = document.createDocumentFragment();
        matches.forEach((chunk) => {
          const span = document.createElement("span");
          span.className = "sent";
          span.textContent = chunk;
          frag.appendChild(span);
        });

        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  btnFSent?.addEventListener("click", () => {
    ensureHasContent();
    focusMode = "sentence";
    content.dataset.focus = "sentence";
    wrapSentences(content);
    content.removeEventListener("pointermove", focusMoveHandler);
    content.removeEventListener("pointerleave", clearActive);
    content.addEventListener("pointermove", focusMoveHandler);
    content.addEventListener("pointerleave", clearActive);
    updateFocusButtons();
  });

  btnFPar?.addEventListener("click", () => {
    ensureHasContent();
    focusMode = "paragraph";
    content.dataset.focus = "paragraph";
    content.removeEventListener("pointermove", focusMoveHandler);
    content.removeEventListener("pointerleave", clearActive);
    content.addEventListener("pointermove", focusMoveHandler);
    content.addEventListener("pointerleave", clearActive);
    updateFocusButtons();
  });

  btnFOff?.addEventListener("click", () => {
    focusMode = "none";
    delete content.dataset.focus;
    content.removeEventListener("pointermove", focusMoveHandler);
    content.removeEventListener("pointerleave", clearActive);
    clearActive();
    updateFocusButtons();
  });

  // ==============================
  //  Reset
  // ==============================
  root
    .querySelector('[data-action="raReset"]')
    ?.addEventListener("click", () => {
      [
        "--ra-font-size",
        "--ra-line-height",
        "--ra-letter-spacing",
        "--ra-word-spacing",
        "--ra-max-width",
      ].forEach((v) => root.style.removeProperty(v));
      themeTarget.classList.remove(...themeClasses);

      clearFontClasses(content);
      content.classList.add("font-system");
      if (fontSel) fontSel.value = "font-system";

      if (input) input.value = "";
      content.innerHTML = "";
      attrib && (attrib.textContent = "");
      [fs, lh, ls, ws, mw].forEach((ctrl) => {
        if (ctrl) ctrl.value = ctrl.defaultValue;
      });

      // Reset pictos UI
      if ($picOn) $picOn.checked = false;
      if ($picMode) $picMode.value = "inline";
      if ($picSize) {
        $picSize.value = 28;
        theSizeUpdate();
      }
      if ($picProv) $picProv.value = "arasaac"; // <- por defecto ARASAAC
      content.classList.remove("pictos-only", "pictos-margin");

      turnOffLineHighlight(true);
      focusMode = "none";
      clearActive();
      delete content.dataset.focus;
      unwrapAll(content, ".syll,.line,.sent");
      applyVars();
      updateFocusButtons();
    });

  // ==============================
  //  Extra: Seleccionar todo / Quitar resaltos
  // ==============================
  btnSelectAll?.addEventListener("click", () => {
    if (input && input.value.trim()) {
      input.focus();
      input.select();
    } else if (content) {
      const range = document.createRange();
      range.selectNodeContents(content);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  btnClearMarks?.addEventListener("click", () => {
    content
      .querySelectorAll(".is-active")
      .forEach((n) => n.classList.remove("is-active"));
    clearActive();
  });

  // ==============================
  //  IMPRIMIR (iframe + fuentes cargadas)
  // ==============================
  btnPrint?.addEventListener("click", () => printReader());

  async function printReader() {
    ensureHasContent();
    applyVars();

    const frame = document.createElement("iframe");
    Object.assign(frame.style, {
      position: "fixed",
      width: "1px",
      height: "1px",
      left: "-9999px",
      top: "0",
      border: "0",
      opacity: "0.01",
      pointerEvents: "none",
    });
    frame.srcdoc =
      '<!doctype html><html><head><meta charset="utf-8"></head><body class="ra-print"></body></html>';
    document.body.appendChild(frame);
    await new Promise((res) =>
      frame.addEventListener("load", res, { once: true })
    );

    const w = frame.contentWindow;
    const d = frame.contentDocument;

    const base = d.createElement("base");
    base.href = document.baseURI;
    d.head.appendChild(base);

    // Copia CSS del documento principal
    [...document.querySelectorAll('link[rel="stylesheet"]')].forEach((n) =>
      d.head.appendChild(n.cloneNode(true))
    );
    [...document.querySelectorAll("style")].forEach((n) =>
      d.head.appendChild(n.cloneNode(true))
    );

    const extra = d.createElement("style");
    extra.textContent = `
      @page { margin: 12mm; }
      html, body { margin:0; padding:0; }
      @media print{
        body * { visibility: hidden !important; }
        .print-root, .print-root * { visibility: visible !important; }
      }
      .print-root{ width:100%; margin:0 auto; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-synthesis: none; }
      .ra-reader { border:0 !important; box-shadow:none !important; background: var(--ra-bg, #fff) !important; }
      .ra-content { margin:0 auto !important; }
    `;
    d.head.appendChild(extra);

    // Clona SOLO el visor
    const reader = root.querySelector(".ra-reader");
    const clone = (reader || content.parentElement).cloneNode(true);

    // Fija el ancho actual en px
    const px = Math.ceil(content.getBoundingClientRect().width);
    const cloneArticle = clone.querySelector("#ra-content") || clone;
    cloneArticle.style.width = px + "px";
    cloneArticle.style.maxWidth = px + "px";

    const shell = d.createElement("section");
    shell.id = "read-accessible";
    shell.appendChild(clone);

    const mount = d.createElement("div");
    mount.className = "print-root";
    mount.appendChild(shell);
    d.body.appendChild(mount);

    // Espera estilos
    await Promise.all(
      [...d.querySelectorAll('link[rel="stylesheet"]')].map(
        (l) =>
          new Promise((res) => {
            if (l.sheet) return res();
            l.addEventListener("load", res, { once: true });
            l.addEventListener("error", res, { once: true });
            setTimeout(res, 300);
          })
      )
    ).catch(() => {});

    await ensureSelectedFontLoadedInFrame(d, content);

    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );

    w.focus();
    const cleanup = () => frame.remove();
    w.addEventListener("afterprint", cleanup, { once: true });
    w.print();
    setTimeout(cleanup, 1500);
  }

  async function ensureSelectedFontLoadedInFrame(d, originalEl) {
    try {
      if (!d.fonts || !d.fonts.load) return;
      const cs = getComputedStyle(originalEl);
      let fam = (cs.fontFamily || "")
        .split(",")[0]
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!fam) return;
      const size = cs.fontSize || "16px";
      const weight = cs.fontWeight || "400";
      const style = cs.fontStyle || "normal";

      await Promise.all([
        d.fonts.load(`${style} ${weight} ${size} "${fam}"`),
        d.fonts.load(`normal 700 ${size} "${fam}"`),
        d.fonts.load(`italic 400 ${size} "${fam}"`),
      ]);
      await d.fonts.ready;
    } catch {
      /* no-op */
    }
  }

  // ---------- Estado inicial ----------
  clearFontClasses(content);
  content.classList.add("font-system");
  if (fontSel) fontSel.value = "font-system";
  applyVars();
  updateFocusButtons();
  syncInitialToggles();
  //if ($picOn && !$picOn.checked) $picOn.checked = true;
  //paintFromTextarea();

  function syncInitialToggles() {
    const lineOn = btnLine?.getAttribute("aria-pressed") === "true";
    if (lineOn) {
      ensureHasContent();
      ensureLinesWrapped();
      if (!lineHoverBound) {
        content.addEventListener("pointermove", lineHoverHandler);
        content.addEventListener("pointerleave", clearActive);
        lineHoverBound = true;
      }
      btnLine && (btnLine.textContent = "Resaltar línea: on");
    } else {
      turnOffLineHighlight(false);
    }

    const syllOn = btnSyll?.getAttribute("aria-pressed") === "true";
    if (syllOn) {
      ensureHasContent();
      markSyllables(content);
      btnSyll && (btnSyll.textContent = "Sílabas: on");
    } else {
      btnSyll && (btnSyll.textContent = "Sílabas: off");
    }

    const fm = content.dataset.focus;
    if (fm === "sentence") {
      wrapSentences(content);
      focusMode = "sentence";
      content.addEventListener("pointermove", focusMoveHandler);
      content.addEventListener("pointerleave", clearActive);
    } else if (fm === "paragraph") {
      focusMode = "paragraph";
      content.addEventListener("pointermove", focusMoveHandler);
      content.addEventListener("pointerleave", clearActive);
    }
    updateFocusButtons();

    // Valor inicial del slider de tamaño de pictos
    theSizeUpdate();
  }

  // ===== Modales/acciones de pictos (opcionales) =====
  const $dlgDict = $("#ra-pictos-dict");
  const $dictArea = $("#ra-pictos-dict-json");
  const $dlgSearch = $("#ra-pictos-search");
  const $q = $("#ra-pictos-q");
  const $results = $("#ra-pictos-results");

  root
    .querySelector('[data-action="raPictosEditDict"]')
    ?.addEventListener("click", () => {
      if (!$dlgDict || !$dictArea) return;
      $dictArea.value = JSON.stringify(PICTO_DICT, null, 2);
      $dlgDict.showModal();
    });

  $("#ra-pictos-dict-save")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!$dictArea || !$dlgDict) return;
    try {
      const obj = JSON.parse($dictArea.value || "{}");
      PICTO_DICT = obj;
      saveDict(obj);
      $dlgDict.close();
      // Re-render
      paintFromTextarea();
      applyVars();
    } catch {
      alert("JSON no válido");
    }
  });

  root
    .querySelector('[data-action="raPictosTest"]')
    ?.addEventListener("click", () => {
      if (!$dlgSearch || !$results || !$q) return;
      $q.value = "";
      $results.innerHTML = "";
      $dlgSearch.showModal();
    });

  $q?.addEventListener(
    "input",
    debounce(async () => {
      if (!$results || !$q) return;
      const term = $q.value.trim();
      $results.innerHTML = "";
      if (!term) return;
      // Aquí podrías integrar una previsualización de ARASAAC si quisieras
      $results.textContent = "Previsualizador no activo.";
    }, 300)
  );

  // (opcional) Cargar desde editor principal
  root
    .querySelector('[data-action="raLoadFromEditor"]')
    ?.addEventListener("click", () => {
      const fromEditor = opts.getEditorText?.() || "";
      if (input) input.value = fromEditor;
    });
}

export function wireReaderAccessibleShortcuts() {}

/* ==============================
   Utilidades generales
============================== */
function debounce(fn, ms = 300) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
