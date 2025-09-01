// --- Asegura que no quedan timers “huérfanos” entre montajes
if (window.__wmInterval) {
  clearInterval(window.__wmInterval);
  window.__wmInterval = null;
}

// --- Auto-reinit al abrir el panel "Escribir" desde el header
if (!window.__wmAutowire) {
  window.__wmAutowire = true;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-target="#write-mode"]');
    if (!btn) return;
    // Espera a que mountToolbox inserte el template y luego inicializa
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (window.__wmInterval) {
          clearInterval(window.__wmInterval);
          window.__wmInterval = null;
        }
        try {
          initWriteMode();
        } catch (err) {
          console.warn(err);
        }
      })
    );
  });
}

export function initWriteMode() {

  // Reaplica traducción al nuevo contenido del template
  if (typeof loadLocale === "function" && typeof getCurrentLang === "function") {
    loadLocale(getCurrentLang());
  }


  // --- Activa layout de write-mode y oculta zona de salida ---
  const main = document.getElementById("main");
  if (main) main.classList.add("write-mode-active");

  // Oculta salida
  ["omenu", "otext", "statuso"].forEach((id) =>
    document.getElementById(id)?.classList.add("is-hidden")
  );
  // Muestra entrada
  ["imenu", "itext", "statusi"].forEach((id) =>
    document.getElementById(id)?.classList.remove("is-hidden")
  );

  // Limita #imenu a solo copyi, pastei y cleanleft
  const imenu = document.getElementById("imenu");
  if (imenu) {
    Array.from(imenu.children).forEach((el) => el.classList.add("is-hidden"));
    ["copyi", "pastei", "cleanleft"].forEach((action) => {
      imenu
        .querySelector(`button[data-action="${action}"]`)
        ?.classList.remove("is-hidden");
    });
  }

  // (por robustez) Ocultar botón left->right en write-mode
  document
    .querySelector('button[data-action="lefttoright"]')
    ?.classList.add("is-hidden");

  // --- Referencias UI ---
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

  // Modal de éxito + botones de compartir
  const successGoal = document.getElementById("success-goal");
  const successTime = document.getElementById("success-time");
  const shareX = document.getElementById("share-x");
  const shareWA = document.getElementById("share-wa");
  const shareMail = document.getElementById("share-mail");

  const SITE_URL = "https://www.ebenimeli.org/txtlab/";

  // Si la UI no está montada, abortar
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

  // --- Modo concentración: fullscreen de #itext (ESC para salir/fallback)
  const focusBtn = document.getElementById("focus-mode");
  const itxt = document.getElementById("itext");

  // === Helpers para overlay y wrapper de concentración ===
  let __fsWrap = null; // wrapper temporal para fullscreen
  let __wordFloat = null; // div flotante con el contador

  // Botón "cerrar" específico para móvil (vive dentro del wrapper)
  function ensureMobileCloseBtn(fsWrap, onClick) {
    if (!fsWrap) return null;
    // Solo en móvil
    if (!window.matchMedia("(max-width: 500px)").matches) return null;

    let btn = fsWrap.querySelector(".concentration-close");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "concentration-close";
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
        document.body.appendChild(__wordFloat); // fallback
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

  // === NUEVO: botón de cierre en concentración ===
  let __closeBtn = null;

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
    // Siempre dentro del wrapper para no quedar debajo del overlay
    if (__fsWrap) __fsWrap.appendChild(btn);
    // Asegura el botón móvil (X grande) en pantallas pequeñas
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

  // Limpieza previa si ya hubiera listeners de otra sesión
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
        // Fallback CSS en el WRAPPER (no en #itext)
        document.body.classList.add("concentration-active");
        wrap.classList.add("concentration-overlay");
      }
      itxt.focus({ preventScroll: true });
      showWordFloat(countWords(itxt.value));
      ensureMobileCloseBtn(__fsWrap, exitConcentration); // crea botón en móvil
      showCloseBtn(); // tu botón general (desktop también)
    } catch (err) {
      console.warn("[focus] No se pudo entrar en concentración:", err);
    }
  };

  const exitConcentration = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    } catch {}
    document.body.classList.remove("concentration-active");
    __fsWrap?.classList.remove("concentration-overlay");

    hideWordFloat();
    hideCloseBtn(); // NUEVO
    unwrapFs();
  };

  const onEscToExit = (ev) => {
    if (ev.key === "Escape") {
      if (!document.fullscreenElement) exitConcentration(); // fallback
    }
  };

  const onFsChange = () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove("concentration-active");
      __fsWrap?.classList.remove("concentration-overlay");

      hideWordFloat();
      hideCloseBtn(); // NUEVO
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

  // Guardar limpieza para exitWriteMode()
  window.__wmFocusCleanup = () => {
    focusBtn?.removeEventListener("click", enterConcentration);
    document.removeEventListener("keydown", onEscToExit);
    document.removeEventListener("fullscreenchange", onFsChange);
    exitConcentration(); // ya limpia flotantes y wrapper
  };

  // --- Cita aleatoria ---
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
    const el = document.querySelector(".quote");
    if (!el) return;
    const idx = Math.floor(Math.random() * QUOTES.length);
    el.textContent = QUOTES[idx];
  };
  setRandomQuote();

  // --- Estado ---
  let seconds = 0;
  let running = false;
  let goalReached = false;

  // --- Utilidades ---
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

  // --- WPM ---
  const updateWPM = (wordsNow) => {
    if (!wpmEl) return;
    const wpm = seconds > 0 ? Math.round((wordsNow / seconds) * 60) : 0;
    wpmEl.textContent = `${wpm}`;
  };

  // --- Timer ---
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

  // --- Share ---
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

  // --- Lógica palabras/progreso ---
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

  // --- Estado inicial ---
  if (!inputGoal.value) inputGoal.value = "250";
  textInput.value = "";
  seconds = 0;
  timerEl.textContent = "00:00:00";
  if (wpmEl) wpmEl.textContent = "0 palabras/min";
  updateGoal();
  updateTimerButtons();

  // --- Eventos ---
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

  syncSoundButtons(document);

  function wireAmbientToggle(root = document) {
    const ambientBtn = root.getElementById("ambient");
    if (!ambientBtn) return; // no hay botón aún

    const soundBtns = root.querySelectorAll('button[data-action="soundOn"]');
    let visible = false;

    ambientBtn.addEventListener("click", () => {
      visible = !visible;
      soundBtns.forEach((btn) => {
        btn.classList.toggle("is-visible", visible);
      });
    });
  }

  // dentro de initWriteMode():
  wireAmbientToggle(document);

}

export function exitWriteMode() {
  // Quita la clase de layout
  document.getElementById("main")?.classList.remove("write-mode-active");

  // Muestra todos (restaura visibilidad)
  ["omenu", "otext", "statuso", "imenu", "itext", "statusi"].forEach((id) => {
    const el = document.getElementById(id);
    el?.classList.remove("is-hidden");
    el?.style.removeProperty("display");
    el?.style.removeProperty("width");
    el?.style.removeProperty("height");
    el?.style.removeProperty("flex");
  });

  // Restaura TODOS los hijos de #imenu
  const imenu = document.getElementById("imenu");
  if (imenu) {
    Array.from(imenu.children).forEach((el) =>
      el.classList.remove("is-hidden")
    );
  }

  // Restablece posibles estilos forzados en #main
  const main = document.getElementById("main");
  main?.style.removeProperty("display");
  main?.style.removeProperty("flex-direction");
  main?.style.removeProperty("gap");
  main?.style.removeProperty("align-items");

  // Salir y limpiar modo concentración si estuviera activo
  if (window.__wmFocusCleanup) {
    try {
      window.__wmFocusCleanup();
    } catch {}
    window.__wmFocusCleanup = null;
  }

  // Forzar esquema base, tipografía y tamaño por defecto en #itext
  resetSchemeToTheme();

  // Limpieza: timers
  if (window.__wmInterval) {
    clearInterval(window.__wmInterval);
    window.__wmInterval = null;
  }
}

function resetSchemeToTheme() {
  const itxt = document.getElementById("itext");
  if (!itxt) return;

  // Quitar cualquier clase scheme-*
  [...itxt.classList]
    .filter((c) => c.startsWith("scheme-"))
    .forEach((c) => itxt.classList.remove(c));

  // ⚙️ Valores por defecto al cargar la app
  const DEFAULT_FONT_FAMILY =
    "system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif";
  const DEFAULT_FONT_SIZE_REM = 1.0;

  // Aplicar tipografía y tamaño por defecto
  itxt.style.setProperty("--write-font-family", DEFAULT_FONT_FAMILY);
  itxt.style.setProperty("--write-font-size", `${DEFAULT_FONT_SIZE_REM}rem`);

  // Actualizar (opcional) controles visibles si existen
  const selFamily = document.getElementById("font-family-select");
  if (selFamily) selFamily.value = DEFAULT_FONT_FAMILY;

  const sizeDisplay = document.getElementById("font-size-display");
  if (sizeDisplay)
    sizeDisplay.textContent = `${DEFAULT_FONT_SIZE_REM.toFixed(1)}rem`;

  // Guardar en localStorage como estado base
  localStorage.setItem("write.fontFamily", DEFAULT_FONT_FAMILY);
  localStorage.setItem("write.fontSize", String(DEFAULT_FONT_SIZE_REM));
  localStorage.setItem("write.colorScheme", "theme");
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-target]");
  if (!btn) return;

  const target = btn.getAttribute("data-target");
  if (target !== "#write-mode") {
    try {
      exitWriteMode();
    } catch (_) {}
  } else {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        try {
          initWriteMode();
        } catch (err) {
          console.warn(err);
        }
      })
    );
  }
});

// js/text/write.js

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
    .catch((err) => {
      console.error("[suggestWord] Error:", err);
    });
}

// js/text/write.js (colecciones)

const WORDS_BASE_PATH = "assets/data/words/";

/* ========= Utilidades comunes ========= */

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

/** Lee un archivo (en assets/data/words/) y devuelve una línea aleatoria no vacía. */
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

/** Factoría: usa data-file del botón; si falta, registra aviso. */
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

/* ========= Funciones exportadas para actionMap ========= */

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
export function suggestAll(btn) {
  suggestFromFileName("Personaje", "characters.txt");
  suggestFromFileName("Lugar", "places.txt");
  suggestFromFileName("Momento/tiempo", "times.txt");
  suggestFromFileName("Sentimiento/Emoción", "feelings.txt");
  suggestFromFileName("Conflicto", "conflicts.txt");
}

/* --- Sonido de fondo (multipista con data-file) --- */
const MEDIA_BASE = "assets/media/";
let bgAudio = null;
let currentBgKey = null;

// Volumen persistente (opcional)
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

// Prepara / cambia la pista si es necesario
function ensureBgAudio(fileKey = "rainthunder") {
  const key = String(fileKey).trim() || "rainthunder";
  if (!bgAudio || currentBgKey !== key) {
    try {
      bgAudio?.pause();
    } catch (_) {}

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

// Actualiza el estado visual de los botones
function syncSoundButtons(root = document) {
  const offBtn = root.querySelector('button[data-action="soundOff"]');
  const isPlaying = !!(bgAudio && !bgAudio.paused && !bgAudio.ended);

  if (offBtn) offBtn.style.display = isPlaying ? "inline-block" : "none";

  root.querySelectorAll('button[data-action="soundOn"]').forEach((b) => {
    const key = (b.dataset.file || "rainthunder").trim();
    b.classList.toggle("is-active", isPlaying && key === currentBgKey);
  });
}

// Acción: encender sonido
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

// Acción: apagar sonido
function soundOffAction() {
  if (!bgAudio) return;
  try {
    bgAudio.pause();
  } catch (_) {}
  syncSoundButtons(document);
}

// (Opcional) API volumen
function setBgVolumeFromInput(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener("input", () => {
    setSavedVolume(inputEl.value);
  });
}

// Restaurar última pista
(function restoreLastTrackOnLoad() {
  const lastKey = localStorage.getItem("write.bgKey");
  if (lastKey) ensureBgAudio(lastKey);
  syncSoundButtons(document);
})();

// Exporta para actionMap / main.js
export {
  soundOnAction as soundOn,
  soundOffAction as soundOff,
  syncSoundButtons,
  setBgVolumeFromInput, // opcional
};

/* --- Máquina de escribir --- */
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

export function typewriterToggle(btn) {
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
