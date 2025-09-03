// js/text/write.js

// (Solo usamos $id si te resulta cómodo; puedes reemplazar por document.getElementById)
import { $id } from "../core/dom.js";

/* ──────────────────────────────────────────────────────────
   Utils
─────────────────────────────────────────────────────────── */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function waitForSelectors(selectors, timeout = 5000, step = 50) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    if (selectors.every((s) => document.querySelector(s))) return true;
    await sleep(step);
  }
  return false;
}

/* ──────────────────────────────────────────────────────────
   Auto–bootstrap: inicializa / limpia según app:main-updated
   - Cuando id === "write-mode": espera la UI y llama initWriteMode()
   - En cualquier otro id: exitWriteMode()
─────────────────────────────────────────────────────────── */
if (!window.__wmBootstrapped) {
  window.__wmBootstrapped = true;

  document.addEventListener("app:main-updated", async (ev) => {
    const id = ev.detail?.id;

    // Limpia timer huérfano si lo hubiera
    if (window.__wmInterval) {
      try {
        clearInterval(window.__wmInterval);
      } catch {}
      window.__wmInterval = null;
    }

    if (id === "write-mode") {
      // Espera a que la UI realmente exista
      const ready = await waitForSelectors([
        "#itext",
        "#nwords",
        "#writeprogress",
        "#timer",
      ]);
      if (!ready) {
        console.warn("[write] UI no encontrada tras cargar write-mode.html");
        return;
      }
      try {
        initWriteMode();
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        exitWriteMode();
      } catch {}
    }
  });
}

/* ──────────────────────────────────────────────────────────
   INIT / EXIT
─────────────────────────────────────────────────────────── */
export function initWriteMode() {
  // Reaplica traducción al nuevo contenido del template
  if (
    typeof loadLocale === "function" &&
    typeof getCurrentLang === "function"
  ) {
    loadLocale(getCurrentLang());
  }

  const main = document.getElementById("main");
  if (main) main.classList.add("write-mode-active");

  // Mostrar input-side, ocultar output-side
  ["omenu", "otext", "statuso"].forEach((id) =>
    document.getElementById(id)?.classList.add("is-hidden")
  );
  ["imenu", "itext", "statusi"].forEach((id) =>
    document.getElementById(id)?.classList.remove("is-hidden")
  );

  // Menú de entrada: deja solo acciones básicas visibles
  const imenu = document.getElementById("imenu");
  if (imenu) {
    Array.from(imenu.children).forEach((el) => el.classList.add("is-hidden"));
    ["copyi", "pastei", "cleanleft"].forEach((action) => {
      imenu
        .querySelector(`button[data-action="${action}"]`)
        ?.classList.remove("is-hidden");
    });
  }
  document
    .querySelector('button[data-action="lefttoright"]')
    ?.classList.add("is-hidden");

  // --- Referencias UI requeridas ---
  const inputGoal = document.getElementById("nwords");
  const goalWords = document.getElementById("goalWords");
  const currentWords = document.getElementById("currentWords");
  const percWords = document.getElementById("percWords");
  const progress = document.getElementById("writeprogress");
  const textInput = document.getElementById("itext"); // textarea principal
  const timerEl = document.getElementById("timer");
  const successDlg = document.getElementById("success-dialog");
  const quoteEl = document.querySelector(".quote");
  const wpmEl = document.querySelector(".wpm");

  // Controles del timer
  const btnPlay = document.getElementById("timer-play");
  const btnPause = document.getElementById("timer-pause");
  const btnReset = document.getElementById("timer-reset");

  // Share
  const successGoal = document.getElementById("success-goal");
  const successTime = document.getElementById("success-time");
  const shareX = document.getElementById("share-x");
  const shareWA = document.getElementById("share-wa");
  const shareMail = document.getElementById("share-mail");

  const SITE_URL = "https://www.ebenimeli.org/txtlab/";

  // Si falta algo clave, abortar
  if (
    !inputGoal ||
    !goalWords ||
    !currentWords ||
    !progress ||
    !textInput ||
    !timerEl
  ) {
    console.warn("[write] UI aún no montada; initWriteMode() aborta.");
    return;
  }

  /* ── Utils ─────────────────────────────────────────── */
  const countWords = (raw) => {
    const t = String(raw || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  };

  const formatClock = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const formatNaturalDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} h`);
    if (m > 0) parts.push(`${m} min`);
    if (sec > 0) parts.push(`${sec} s`);
    return parts.length ? parts.join(" ") : "0 s";
  };

  /* ── Citas ─────────────────────────────────────────── */
  const QUOTES = [
    "Escribe primero, corrige después.",
    "La página en blanco es una invitación, no una amenaza.",
    "Tu primera versión solo necesita existir.",
    "Escribir es pensar en voz baja.",
    "Un párrafo al día construye libros.",
    "La rutina es la musa más fiable.",
    "Pequeños bloques, grandes historias.",
    "Cada palabra cuenta; no todas pesan lo mismo.",
    "La claridad gana a la perfección.",
    "El hábito vence a la inspiración.",
  ];
  const setRandomQuote = () => {
    if (!quoteEl) return;
    const idx = Math.floor(Math.random() * QUOTES.length);
    quoteEl.textContent = QUOTES[idx];
  };
  setRandomQuote();

  /* ── Estado ────────────────────────────────────────── */
  let seconds = 0;
  let running = false;
  let goalReached = false;

  /* ── WPM ───────────────────────────────────────────── */
  const updateWPM = (wordsNow) => {
    if (!wpmEl) return;
    const wpm = seconds > 0 ? Math.round((wordsNow / seconds) * 60) : 0;
    wpmEl.textContent = `${wpm}`;
  };

  /* ── Timer ─────────────────────────────────────────── */
  const updateTimerButtons = () => {
    if (!btnPlay || !btnPause) return;
    btnPlay.disabled = running;
    btnPause.disabled = !running;
  };

  const startTimer = () => {
    if (running) return;
    running = true;
    if (window.__wmInterval) clearInterval(window.__wmInterval);
    window.__wmInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = formatClock(seconds);
      updateWPM(countWords(textInput.value));
    }, 1000);
    updateTimerButtons();
  };

  const pauseTimer = () => {
    if (!running) return;
    clearInterval(window.__wmInterval);
    window.__wmInterval = null;
    running = false;
    updateTimerButtons();
  };

  const resetTimer = () => {
    pauseTimer();
    seconds = 0;
    timerEl.textContent = "00:00:00";
    updateWPM(countWords(textInput.value));
  };

  /* ── Share ─────────────────────────────────────────── */
  function updateShareLinks(goal, naturalTime) {
    const text = `🎉 ¡He alcanzado mi objetivo de escribir ${goal} palabras! He estado ${naturalTime} escribiendo con txtlab: ${SITE_URL}`;
    const enc = encodeURIComponent(text);
    if (shareX) shareX.href = `https://x.com/intent/tweet?text=${enc}`;
    if (shareWA) shareWA.href = `https://api.whatsapp.com/send?text=${enc}`;
    if (shareMail) {
      const subject = encodeURIComponent("¡Objetivo de escritura alcanzado!");
      shareMail.href = `mailto:?subject=${subject}&body=${enc}`;
    }
  }

  /* ── Progreso ──────────────────────────────────────── */
  function updateGoal() {
    const newGoal = parseInt(inputGoal.value, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      goalWords.textContent = newGoal;
      progress.max = newGoal;
    } else {
      goalWords.textContent = "0";
      progress.max = 0;
    }
    updateCurrent();
  }

  function updateCurrent() {
    const words = countWords(textInput.value);
    currentWords.textContent = words;

    const goal = parseInt(goalWords.textContent, 10) || 0;

    if (goal > 0) {
      const perc = Math.min((words / goal) * 100, 100);
      percWords.textContent = Math.round(perc) + " %";
      progress.value = words;

      if (words >= goal && !goalReached) {
        if (!timerEl?.isConnected) return;
        goalReached = true;
        pauseTimer();

        const natural = formatNaturalDuration(seconds);
        if (successGoal) successGoal.textContent = goal;
        if (successTime) successTime.textContent = natural;
        updateShareLinks(goal, natural);

        successDlg?.showModal();
      }
    } else {
      percWords.textContent = "0 %";
      progress.value = 0;
    }

    updateWPM(words);
    if (isConcentrationActive()) updateWordFloat(words);
  }

  /* ── Modo concentración (fullscreen / overlay) ─────── */
  const focusBtn = document.getElementById("focus-mode");
  const itxt = document.getElementById("itext");

  let __fsWrap = null; // wrapper temporal
  let __wordFloat = null; // contador flotante
  let __closeBtn = null; // botón cerrar

  const isMobile = () => window.matchMedia("(max-width: 500px)").matches;

  function ensureMobileCloseBtn(fsWrap, onClick) {
    if (!fsWrap || !isMobile()) return null;
    let btn = fsWrap.querySelector(".concentration-close.mobile");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "concentration-close mobile";
      btn.setAttribute("aria-label", "Salir de concentración");
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      btn.addEventListener("click", onClick);
      fsWrap.appendChild(btn);
    }
    return btn;
  }

  const ensureFsWrap = () => {
    if (__fsWrap && __fsWrap.isConnected) return __fsWrap;
    const wrap = document.createElement("div");
    wrap.id = "itext-wrapper";
    wrap.className = "itext-wrapper";
    const parent = itxt.parentNode;
    parent.insertBefore(wrap, itxt);
    wrap.appendChild(itxt);
    __fsWrap = wrap;
    return wrap;
  };

  const unwrapFs = () => {
    if (!__fsWrap || !__fsWrap.isConnected) return;
    const parent = __fsWrap.parentNode;
    if (parent) parent.insertBefore(itxt, __fsWrap);
    __fsWrap.remove();
    __fsWrap = null;
  };

  const isConcentrationActive = () =>
    document.fullscreenElement === __fsWrap ||
    (__fsWrap && __fsWrap.classList.contains("concentration-overlay"));

  const showWordFloat = (n) => {
    if (!__wordFloat || !__wordFloat.isConnected) {
      __wordFloat = document.createElement("div");
      __wordFloat.className = "word-float is-visible";
      const cs = getComputedStyle(itxt);
      const fg = (cs.getPropertyValue("--write-fg") || cs.color).trim();
      __wordFloat.style.color = fg;
      if (document.fullscreenElement === __fsWrap) {
        __fsWrap.appendChild(__wordFloat);
      } else {
        document.body.appendChild(__wordFloat);
      }
    }
    __wordFloat.textContent = String(n);
  };

  const updateWordFloat = (n) => {
    if (__wordFloat && __wordFloat.isConnected)
      __wordFloat.textContent = String(n);
  };

  const hideWordFloat = () => {
    if (!__wordFloat) return;
    try {
      __wordFloat.remove();
    } catch {}
    __wordFloat = null;
  };

  const ensureCloseBtn = () => {
    if (__closeBtn && __closeBtn.isConnected) return __closeBtn;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "concentration-close";
    b.setAttribute("aria-label", "Salir de concentración (Esc)");
    b.title = "Salir de concentración (Esc)";
    b.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    b.addEventListener("click", () => exitConcentration());
    __closeBtn = b;
    return b;
  };

  const showCloseBtn = () => {
    const btn = ensureCloseBtn();
    if (__fsWrap) __fsWrap.appendChild(btn);
    ensureMobileCloseBtn(__fsWrap, exitConcentration);
    requestAnimationFrame(() => btn.classList.add("is-visible"));
  };

  const hideCloseBtn = () => {
    if (!__closeBtn) return;
    try {
      __closeBtn.remove();
    } catch {}
    __closeBtn = null;
  };

  // Limpieza previa de otro ciclo
  if (window.__wmFocusCleanup) {
    try {
      window.__wmFocusCleanup();
    } catch {}
    window.__wmFocusCleanup = null;
  }

  const enterConcentration = async () => {
    if (!itxt) return;
    try {
      const wrap = ensureFsWrap();
      if (wrap.requestFullscreen) {
        await wrap.requestFullscreen();
      } else {
        document.body.classList.add("concentration-active");
        wrap.classList.add("concentration-overlay");
      }
      itxt.focus({ preventScroll: true });
      showWordFloat(countWords(itxt.value));
      ensureMobileCloseBtn(__fsWrap, exitConcentration);
      showCloseBtn();
    } catch (err) {
      console.warn("[focus] No se pudo entrar en concentración:", err);
    }
  };

  const exitConcentration = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {}
    document.body.classList.remove("concentration-active");
    __fsWrap?.classList.remove("concentration-overlay");
    hideWordFloat();
    hideCloseBtn();
    unwrapFs();
  };

  const onEscToExit = (ev) => {
    if (ev.key === "Escape" && !document.fullscreenElement) exitConcentration();
  };

  const onFsChange = () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove("concentration-active");
      __fsWrap?.classList.remove("concentration-overlay");
      hideWordFloat();
      hideCloseBtn();
      unwrapFs();
    } else if (document.fullscreenElement === __fsWrap) {
      if (__wordFloat && __wordFloat.parentNode !== __fsWrap) {
        try {
          __fsWrap.appendChild(__wordFloat);
          ensureMobileCloseBtn(__fsWrap, exitConcentration);
        } catch {}
      }
      if (__closeBtn && __closeBtn.parentNode !== __fsWrap) {
        try {
          __fsWrap.appendChild(__closeBtn);
          ensureMobileCloseBtn(__fsWrap, exitConcentration);
        } catch {}
      }
    }
  };

  focusBtn?.addEventListener("click", enterConcentration);
  document.addEventListener("keydown", onEscToExit);
  document.addEventListener("fullscreenchange", onFsChange);

  // Guardar limpieza
  window.__wmFocusCleanup = () => {
    focusBtn?.removeEventListener("click", enterConcentration);
    document.removeEventListener("keydown", onEscToExit);
    document.removeEventListener("fullscreenchange", onFsChange);
    exitConcentration();
  };

  /* ── Estado inicial ────────────────────────────────── */
  if (!inputGoal.value) inputGoal.value = "250";
  textInput.value = "";
  seconds = 0;
  timerEl.textContent = "00:00:00";
  if (wpmEl) wpmEl.textContent = "0";
  updateGoal();
  updateTimerButtons();

  /* ── Eventos ───────────────────────────────────────── */
  inputGoal.addEventListener("input", () => {
    goalReached = false;
    updateGoal();
  });

  textInput.addEventListener("input", () => {
    if (!timerEl?.isConnected) return;
    updateCurrent();
    startTimer(); // autostart al escribir
  });

  btnPlay?.addEventListener("click", startTimer);
  btnPause?.addEventListener("click", pauseTimer);
  btnReset?.addEventListener("click", resetTimer);

  // Sonido ambiente y máquina de escribir
  syncSoundButtons(document);
  wireAmbientToggle(document);

  function wireAmbientToggle(root = document) {
    const ambientBtn = root.getElementById("ambient");
    if (!ambientBtn) return;
    const soundBtns = root.querySelectorAll('button[data-action="soundOn"]');
    let visible = false;
    ambientBtn.addEventListener("click", () => {
      visible = !visible;
      soundBtns.forEach((b) => b.classList.toggle("is-visible", visible));
    });
  }

  wireFormatControls()
}

/* ──────────────────────────────────────────────────────────
   Formato (tamaño, tipografía, esquema)
─────────────────────────────────────────────────────────── */
const FONT_MIN = 0.6;
const FONT_MAX = 3.0;
const FONT_STEP = 0.1;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function getItxt() { return document.getElementById("itext"); }

function readCssRemVar(el, varName, fallbackRem = 1.0) {
  const raw = getComputedStyle(el).getPropertyValue(varName).trim();
  if (!raw) return fallbackRem;
  const m = raw.match(/^([0-9.]+)\s*rem$/i);
  return m ? parseFloat(m[1]) : fallbackRem;
}

function applyFontSize(rem) {
  const itxt = getItxt();
  if (!itxt) return;
  const size = clamp(Number(rem) || 1.0, FONT_MIN, FONT_MAX);
  itxt.style.setProperty("--write-font-size", `${size}rem`);
  localStorage.setItem("write.fontSize", String(size));
  // (opcional) muestra en #font-size-display si existe
  const disp = document.getElementById("font-size-display");
  if (disp) disp.textContent = `${size.toFixed(1)}rem`;
}

function nudgeFontSize(delta) {
  const itxt = getItxt();
  if (!itxt) return;
  const current = readCssRemVar(itxt, "--write-font-size", 1.0);
  applyFontSize(current + delta);
}

function resetFontSize() {
  applyFontSize(1.0);
}

function applyFontFamily(family) {
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

function applyScheme(scheme) {
  const itxt = getItxt();
  if (!itxt) return;
  // elimina clases scheme-*
  [...itxt.classList].filter(c => c.startsWith("scheme-")).forEach(c => itxt.classList.remove(c));
  // "theme" = base por tema → sin clase adicional
  if (scheme && scheme !== "theme") itxt.classList.add(`scheme-${scheme}`);
  localStorage.setItem("write.colorScheme", scheme || "theme");
  // refleja en el select
  const sel = document.getElementById("scheme-select");
  if (sel && sel.value !== scheme) sel.value = scheme || "theme";
}

function restoreFormatFromStorage() {
  const itxt = getItxt();
  if (!itxt) return;
  const storedSize   = parseFloat(localStorage.getItem("write.fontSize") || "1");
  const storedFamily = localStorage.getItem("write.fontFamily");
  const storedScheme = localStorage.getItem("write.colorScheme") || "theme";
  if (Number.isFinite(storedSize)) applyFontSize(storedSize);
  if (storedFamily) applyFontFamily(storedFamily);
  applyScheme(storedScheme);
}

function wireFormatControls(root = document) {
  const smaller = root.getElementById("font-smaller");
  const bigger  = root.getElementById("font-bigger");
  const reset   = root.getElementById("font-reset");
  const selFam  = root.getElementById("font-family-select");
  const selSch  = root.getElementById("scheme-select");

  smaller?.addEventListener("click", () => nudgeFontSize(-FONT_STEP));
  bigger ?.addEventListener("click", () => nudgeFontSize(+FONT_STEP));
  reset  ?.addEventListener("click", resetFontSize);

  selFam?.addEventListener("change", (e) => applyFontFamily(e.target.value));
  selSch?.addEventListener("change", (e) => applyScheme(e.target.value));

  // Aplica lo que haya en localStorage (o defaults)
  restoreFormatFromStorage();
}


export function exitWriteMode() {
  // Quita la clase de layout
  document.getElementById("main")?.classList.remove("write-mode-active");

  // Muestra todo (restaura visibilidad)
  ["omenu", "otext", "statuso", "imenu", "itext", "statusi"].forEach((id) => {
    const el = document.getElementById(id);
    el?.classList.remove("is-hidden");
    el?.style.removeProperty("display");
    el?.style.removeProperty("width");
    el?.style.removeProperty("height");
    el?.style.removeProperty("flex");
  });

  // Restaura hijos de #imenu
  const imenu = document.getElementById("imenu");
  if (imenu)
    Array.from(imenu.children).forEach((el) =>
      el.classList.remove("is-hidden")
    );

  // Restablece estilos forzados en #main
  const main = document.getElementById("main");
  main?.style.removeProperty("display");
  main?.style.removeProperty("flex-direction");
  main?.style.removeProperty("gap");
  main?.style.removeProperty("align-items");

  // Salir/limpiar concentración si estuviera activa
  if (window.__wmFocusCleanup) {
    try {
      window.__wmFocusCleanup();
    } catch {}
    window.__wmFocusCleanup = null;
  }

  // Esquema/Tipografía por defecto en #itext
  resetSchemeToTheme();

  // Limpieza timers
  if (window.__wmInterval) {
    try {
      clearInterval(window.__wmInterval);
    } catch {}
    window.__wmInterval = null;
  }
}

function resetSchemeToTheme() {
  const itxt = document.getElementById("itext");
  if (!itxt) return;

  // Quitar clases scheme-*
  [...itxt.classList]
    .filter((c) => c.startsWith("scheme-"))
    .forEach((c) => itxt.classList.remove(c));

  // Valores por defecto
  const DEFAULT_FONT_FAMILY =
    "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif";
  const DEFAULT_FONT_SIZE_REM = 1.0;

  itxt.style.setProperty("--write-font-family", DEFAULT_FONT_FAMILY);
  itxt.style.setProperty("--write-font-size", `${DEFAULT_FONT_SIZE_REM}rem`);

  // Controles visibles (si existen)
  const selFamily = document.getElementById("font-family-select");
  if (selFamily) selFamily.value = DEFAULT_FONT_FAMILY;
  const sizeDisplay = document.getElementById("font-size-display");
  if (sizeDisplay)
    sizeDisplay.textContent = `${DEFAULT_FONT_SIZE_REM.toFixed(1)}rem`;

  // Persistencia
  localStorage.setItem("write.fontFamily", DEFAULT_FONT_FAMILY);
  localStorage.setItem("write.fontSize", String(DEFAULT_FONT_SIZE_REM));
  localStorage.setItem("write.colorScheme", "theme");
}

/* ──────────────────────────────────────────────────────────
   Sugerencias y colecciones (igual que antes)
─────────────────────────────────────────────────────────── */
const WORDS_BASE = "assets/data/words/";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getEditorTextarea() {
  return document.querySelector("#text") || document.querySelector("#itext");
}

export function suggestWord() {
  const ta = getEditorTextarea();
  if (!ta) {
    console.warn("No se encontró textarea con id='text' ni 'itext'.");
    return Promise.resolve();
  }
  const idx = 1 + Math.floor(Math.random() * 3);
  const url = `${WORDS_BASE}dic.txt_part${idx}.txt`;
  return fetch(url, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.text();
    })
    .then((text) => {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return;
      const word = pickRandom(lines);
      const needsSpace = ta.value.length > 0 && !/\s$/.test(ta.value);
      ta.value += `${needsSpace ? " " : ""}${word}`;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      return word;
    })
    .catch((err) => console.error("[suggestWord] Error:", err));
}

/* --- Colecciones --- */
const WORDS_BASE_PATH = "assets/data/words/";

function pickRandomLine(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function addToItext(snippet) {
  const ta = document.getElementById("itext");
  if (!ta || !snippet) return;
  const needsSpace = ta.value.length > 0 && !/\s$/.test(ta.value);
  ta.value += (needsSpace ? " " : "") + snippet;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}
function readRandomLine(fileName) {
  const url = WORDS_BASE_PATH + fileName;
  return fetch(url, { cache: "no-store" })
    .then((res) => {
      if (!res.ok)
        throw new Error(`[readRandomLine] No se pudo cargar: ${url}`);
      return res.text();
    })
    .then((text) => {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return null;
      return pickRandomLine(lines);
    });
}
function suggestFromFile(btn) {
  const file = btn?.dataset?.file;
  if (!file) {
    console.warn("[suggestFromFile] Falta data-file en el botón.");
    return Promise.resolve();
  }
  return readRandomLine(file)
    .then((line) => addToItext(line))
    .catch((err) => console.error("[suggestFromFile]", err));
}
function suggestFromFileName(tag, file) {
  if (!file) {
    console.warn("[suggestFromFile] Falta data-file en el botón.");
    return Promise.resolve();
  }
  return readRandomLine(file)
    .then((line) => addToItext(tag + ": " + line))
    .catch((err) => console.error("[suggestFromFile]", err));
}

export function suggestCharacter(btn) {
  return suggestFromFile(btn);
}
export function suggestPlace(btn) {
  return suggestFromFile(btn);
}
export function suggestTime(btn) {
  return suggestFromFile(btn);
}
export function suggestFeeling(btn) {
  return suggestFromFile(btn);
}
export function suggestConflict(btn) {
  return suggestFromFile(btn);
}
export function suggestAll() {
  suggestFromFileName("Personaje", "characters.txt");
  suggestFromFileName("Lugar", "places.txt");
  suggestFromFileName("Momento/tiempo", "times.txt");
  suggestFromFileName("Sentimiento/Emoción", "feelings.txt");
  suggestFromFileName("Conflicto", "conflicts.txt");
}

/* ──────────────────────────────────────────────────────────
   Sonido de fondo
─────────────────────────────────────────────────────────── */
const MEDIA_BASE = "assets/media/";
let bgAudio = null;
let currentBgKey = null;

function getSavedVolume() {
  const v = parseFloat(localStorage.getItem("write.bgVolume") || "0.5");
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
}
function setSavedVolume(v) {
  const vol = Math.min(1, Math.max(0, Number(v)));
  localStorage.setItem("write.bgVolume", String(vol));
  if (bgAudio) bgAudio.volume = vol;
  return vol;
}
function ensureBgAudio(fileKey = "rainthunder") {
  const key = String(fileKey).trim() || "rainthunder";
  if (!bgAudio || currentBgKey !== key) {
    try {
      bgAudio?.pause();
    } catch {}
    bgAudio = new Audio(`${MEDIA_BASE}${key}.mp3`);
    bgAudio.loop = true;
    bgAudio.preload = "auto";
    bgAudio.volume = getSavedVolume();
    currentBgKey = key;
    localStorage.setItem("write.bgKey", currentBgKey);
    bgAudio.addEventListener("ended", () => syncSoundButtons(document));
    bgAudio.addEventListener("pause", () => syncSoundButtons(document));
    bgAudio.addEventListener("play", () => syncSoundButtons(document));
  }
  return bgAudio;
}
function syncSoundButtons(root = document) {
  const offBtn = root.querySelector('button[data-action="soundOff"]');
  const isPlaying = !!(bgAudio && !bgAudio.paused && !bgAudio.ended);
  if (offBtn) offBtn.style.display = isPlaying ? "inline-block" : "none";
  root.querySelectorAll('button[data-action="soundOn"]').forEach((b) => {
    const key = (b.dataset.file || "rainthunder").trim();
    b.classList.toggle("is-active", isPlaying && key === currentBgKey);
  });
}
async function soundOnAction(btn) {
  const key = (btn?.dataset?.file || "rainthunder").trim();
  const bg = ensureBgAudio(key);
  try {
    await bg.play();
  } catch (e) {
    console.warn("[sound] play()", e);
  }
  syncSoundButtons(document);
}
function soundOffAction() {
  if (!bgAudio) return;
  try {
    bgAudio.pause();
  } catch {}
  syncSoundButtons(document);
}
function setBgVolumeFromInput(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener("input", () => {
    setSavedVolume(inputEl.value);
  });
}
// Restaurar última pista al cargar módulo
(function restoreLastTrackOnLoad() {
  const lastKey = localStorage.getItem("write.bgKey");
  if (lastKey) ensureBgAudio(lastKey);
  syncSoundButtons(document);
})();

// Export para actionMap / main.js
export {
  soundOnAction as soundOn,
  soundOffAction as soundOff,
  syncSoundButtons,
  setBgVolumeFromInput, // opcional
};

/* ──────────────────────────────────────────────────────────
   Máquina de escribir
─────────────────────────────────────────────────────────── */
let __twEnabled = false;

function updateTypewriterUI(root = document) {
  const btn = root.getElementById("typewriter-toggle");
  if (!btn) return;

  btn.classList.toggle("is-on", __twEnabled);
  btn.setAttribute("aria-pressed", String(__twEnabled));
  btn.title = __twEnabled
    ? "Desactivar sonido de máquina de escribir"
    : "Activar sonido de máquina de escribir";

  const icon = btn.querySelector("i");
  const lbl = btn.querySelector(".lbl");
  const onTxt = btn.dataset.labelOn || "Escuchar teclas";
  const offTxt = btn.dataset.labelOff || "Silenciar teclas";

  if (icon) {
    icon.className = __twEnabled
      ? "fa-solid fa-volume-high"
      : "fa-solid fa-keyboard";
  }
  if (lbl) lbl.textContent = __twEnabled ? onTxt : offTxt;

  if (__twEnabled && !btn.querySelector(".state-dot")) {
    const d = document.createElement("span");
    d.className = "state-dot";
    btn.appendChild(d);
  } else if (!__twEnabled) {
    btn.querySelector(".state-dot")?.remove();
  }
}

function ensureTypewriterWired(root = document) {
  if (ensureTypewriterWired._wired) return true;
  const ta = root.getElementById("itext");
  if (!ta) return false;

  const src = `${MEDIA_BASE}typing1.mp3`;
  const mk = () => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = 0.5;
    return a;
  };
  const pool = [mk(), mk(), mk(), mk()];
  let idx = 0;

  const onKey = (ev) => {
    if (!__twEnabled) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const a = pool[idx++ % pool.length];
    try {
      a.currentTime = 0;
      a.play();
    } catch {}
  };

  ta.addEventListener("keydown", onKey);

  const prev = window.__wmTypeCleanup;
  window.__wmTypeCleanup = () => {
    try {
      ta.removeEventListener("keydown", onKey);
    } catch {}
    if (prev)
      try {
        prev();
      } catch {}
    ensureTypewriterWired._wired = false;
  };

  ensureTypewriterWired._wired = true;
  return true;
}

export function typewriterToggle() {
  if (!ensureTypewriterWired(document)) {
    console.warn("[typewriter] Editor aún no montado.");
    return;
  }
  __twEnabled = !__twEnabled;
  localStorage.setItem("write.typewriter", __twEnabled ? "1" : "0");
  updateTypewriterUI(document);
}

export function typewriterRestore() {
  __twEnabled = localStorage.getItem("write.typewriter") === "1";
  updateTypewriterUI(document);
}
