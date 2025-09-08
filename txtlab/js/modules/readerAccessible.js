// js/modules/readerAccessible.js
export function mountReaderAccessible(opts = {}) {
  const host = opts.root instanceof Element ? opts.root : document;
  const root = host.querySelector("#read-accessible");
  if (!root || root.dataset.raMounted === "1") return;
  root.dataset.raMounted = "1";

  const content = root.querySelector("#ra-content");
  const input = root.querySelector("#ra-input");

  // Helpers
  const $ = (sel) => root.querySelector(sel);
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

  // Modo de foco actual
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

  // --- Volcar textarea al visor (fix acentos compuestos) ---
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
    content.innerHTML = txt
      ? txt
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("")
      : "";
  }
  root
    .querySelector('[data-action="raApply"]')
    ?.addEventListener("click", () => {
      paintFromTextarea();
      applyVars();
    });

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
      [fs, lh, ls, ws, mw].forEach((ctrl) => {
        if (ctrl) ctrl.value = ctrl.defaultValue;
      });
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

    // Iframe oculto pero renderizable; marcado con body.ra-print
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

    // <base> para que funcionen rutas relativas (CSS, fuentes…)
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

    // Refuerzo CSS dentro del iframe (por si hubiera reglas globales agresivas)
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

    // Fija el ancho actual en px (respeta slider de "Anchura (ch)")
    const px = Math.ceil(content.getBoundingClientRect().width);
    const cloneArticle = clone.querySelector("#ra-content") || clone;
    cloneArticle.style.width = px + "px";
    cloneArticle.style.maxWidth = px + "px";

    // Inserta bajo #read-accessible para que coincidan tus selectores de impresión
    const shell = d.createElement("section");
    shell.id = "read-accessible";
    shell.appendChild(clone);

    const mount = d.createElement("div");
    mount.className = "print-root";
    mount.appendChild(shell);
    d.body.appendChild(mount);

    // Espera a que carguen las hojas de estilo
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

    // Asegura la fuente seleccionada dentro del iframe
    await ensureSelectedFontLoadedInFrame(d, content);

    // Deja respirar el layout
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );

    w.focus();
    const cleanup = () => frame.remove();
    w.addEventListener("afterprint", cleanup, { once: true });
    w.print();
    setTimeout(cleanup, 1500); // fallback
  }

  // Carga la fuente seleccionada del elemento original 'content' dentro del documento 'd'
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
  }

  // (opcional) Cargar desde editor principal
  root
    .querySelector('[data-action="raLoadFromEditor"]')
    ?.addEventListener("click", () => {
      const fromEditor = opts.getEditorText?.() || "";
      if (input) input.value = fromEditor;
    });
}

export function wireReaderAccessibleShortcuts() {}
