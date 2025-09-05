// js/text/write-mode.js
import { wireFormatControls, resetSchemeToTheme } from "./write-format.js";
import { syncSoundButtons } from "./write-audio.js";

// Exported API
export function initWriteMode() {
  // Reaplica traducción (si está disponible global)
  if (typeof loadLocale === "function" && typeof getCurrentLang === "function") {
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
      imenu.querySelector(`button[data-action="${action}"]`)?.classList.remove("is-hidden");
    });
  }
  document.querySelector('button[data-action="lefttoright"]')?.classList.add("is-hidden");

  // --- Referencias UI requeridas ---
  const inputGoal    = document.getElementById("nwords");
  const goalWords    = document.getElementById("goalWords");
  const currentWords = document.getElementById("currentWords");
  const percWords    = document.getElementById("percWords");
  const progress     = document.getElementById("writeprogress");
  const textInput    = document.getElementById("itext");
  const timerEl      = document.getElementById("timer");
  const successDlg   = document.getElementById("success-dialog");
  const quoteEl      = document.querySelector(".quote");
  const wpmEl        = document.querySelector(".wpm");

  const btnPlay  = document.getElementById("timer-play");
  const btnPause = document.getElementById("timer-pause");
  const btnReset = document.getElementById("timer-reset");

  const successGoal = document.getElementById("success-goal");
  const successTime = document.getElementById("success-time");
  const shareX   = document.getElementById("share-x");
  const shareWA  = document.getElementById("share-wa");
  const shareMail= document.getElementById("share-mail");

  const SITE_URL = "https://www.ebenimeli.org/txtlab/";

  if (!inputGoal || !goalWords || !currentWords || !progress || !textInput || !timerEl) {
    console.warn("[write] UI aún no montada; initWriteMode() aborta.");
    return;
  }

  /* ── Utils ────────────────────────────────────────── */
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

  /* ── Citas ────────────────────────────────────────── */
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

  /* ── Estado ───────────────────────────────────────── */
  let seconds = 0;
  let running = false;
  let goalReached = false;

  /* ── WPM ──────────────────────────────────────────── */
  const updateWPM = (wordsNow) => {
    if (!wpmEl) return;
    const wpm = seconds > 0 ? Math.round((wordsNow / seconds) * 60) : 0;
    wpmEl.textContent = `${wpm}`;
  };

  /* ── Timer ────────────────────────────────────────── */
  const updateTimerButtons = () => {
    btnPlay && (btnPlay.disabled = running);
    btnPause && (btnPause.disabled = !running);
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

  /* ── Share ────────────────────────────────────────── */
  function updateShareLinks(goal, naturalTime) {
    const text = `🎉 ¡He alcanzado mi objetivo de escribir ${goal} palabras! He estado ${naturalTime} escribiendo con txtlab: ${SITE_URL}`;
    const enc = encodeURIComponent(text);
    if (shareX)  shareX.href  = `https://x.com/intent/tweet?text=${enc}`;
    if (shareWA) shareWA.href = `https://api.whatsapp.com/send?text=${enc}`;
    if (shareMail) {
      const subject = encodeURIComponent("¡Objetivo de escritura alcanzado!");
      shareMail.href = `mailto:?subject=${subject}&body=${enc}`;
    }
  }

  /* ── Progreso ─────────────────────────────────────── */
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
  const isConcentrationActive = () =>
    document.fullscreenElement === __fsWrap ||
    (__fsWrap && __fsWrap.classList.contains("concentration-overlay"));
  let __wordFloat = null;
  const updateWordFloat = (n) => {
    if (__wordFloat && __wordFloat.isConnected) __wordFloat.textContent = String(n);
  };

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

  /* ── Modo concentración (Fullscreen robusto) ──────── */
  const focusBtn = document.getElementById("focus-mode");
  const itxt     = document.getElementById("itext");
  let __fsWrap   = null;
  let __closeBtn = null;

  // Guardamos dónde estaba el textarea para restaurarlo
  let __origParent = null;
  let __origNext = null;

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

    // Contenedor que vivirá en <body> mientras dure el FS
    const wrap = document.createElement("div");
    wrap.id = "itext-wrapper";
    wrap.className = "itext-wrapper";

    // Reparent a BODY para que no herede layouts de grid al entrar en FS
    __origParent = itxt.parentNode;
    __origNext = itxt.nextSibling;
    wrap.appendChild(itxt);
    document.body.appendChild(wrap);

    __fsWrap = wrap;
    return wrap;
  };

  const unwrapFs = () => {
    if (!__fsWrap) return;
    if (__origParent) {
      if (__origNext) __origParent.insertBefore(itxt, __origNext);
      else __origParent.appendChild(itxt);
    }
    try { __fsWrap.remove(); } catch {}
    __fsWrap = null;
  };

  const showWordFloat = (n) => {
    if (!__wordFloat || !__wordFloat.isConnected) {
      __wordFloat = document.createElement("div");
      __wordFloat.className = "word-float is-visible";
      const cs = getComputedStyle(itxt);
      const fg = (cs.getPropertyValue("--write-fg") || cs.color).trim();
      __wordFloat.style.color = fg;
      if (document.fullscreenElement === __fsWrap) __fsWrap.appendChild(__wordFloat);
      else document.body.appendChild(__wordFloat);
    }
    __wordFloat.textContent = String(n);
  };
  const hideWordFloat = () => {
    if (!__wordFloat) return;
    try { __wordFloat.remove(); } catch {}
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
    try { __closeBtn.remove(); } catch {}
    __closeBtn = null;
  };

  // Fallback de estilo en JS (además del CSS) por si algo falla
  function setFullscreenTextareaStyles(active) {
    if (!itxt) return;
    if (active) {
      itxt.style.width = "100vw";
      itxt.style.height = "100vh";
      itxt.style.margin = "0";
      itxt.style.borderRadius = "0";
      itxt.style.border = "none";
      itxt.style.outlineOffset = "0";
      itxt.style.display = "block";
      itxt.style.background = "var(--write-bg, #000)";
      itxt.style.color = "var(--write-fg, #eee)";
    } else {
      itxt.style.removeProperty("width");
      itxt.style.removeProperty("height");
      itxt.style.removeProperty("margin");
      itxt.style.removeProperty("border-radius");
      itxt.style.removeProperty("border");
      itxt.style.removeProperty("outline-offset");
      itxt.style.removeProperty("display");
      itxt.style.removeProperty("background");
      itxt.style.removeProperty("color");
    }
  }

  if (window.__wmFocusCleanup) {
    try { window.__wmFocusCleanup(); } catch {}
    window.__wmFocusCleanup = null;
  }

  const enterConcentration = async () => {
    if (!itxt) return;
    try {
      const wrap = ensureFsWrap();

      // Fullscreen en el CONTENEDOR (clave para Firefox)
      if (wrap.requestFullscreen) {
        await wrap.requestFullscreen({ navigationUI: "hide" });
      } else {
        // overlay de reserva
        document.body.classList.add("concentration-active");
        wrap.classList.add("concentration-overlay");
      }

      setFullscreenTextareaStyles(true);

      itxt.focus({ preventScroll: true });
      showWordFloat(countWords(itxt.value));
      ensureMobileCloseBtn(__fsWrap, exitConcentration);
      showCloseBtn();
    } catch (err) {
      console.warn("[focus] No se pudo entrar en concentración:", err);
    }
  };

  const exitConcentration = () => {
    try { if (document.fullscreenElement) document.exitFullscreen?.(); } catch {}
    document.body.classList.remove("concentration-active");
    __fsWrap?.classList.remove("concentration-overlay");
    setFullscreenTextareaStyles(false);
    hideWordFloat();
    hideCloseBtn();
    unwrapFs();
  };

  const onEscToExit = (ev) => {
    // En FS, Esc lo maneja el navegador; aquí cubrimos el overlay de reserva
    if (ev.key === "Escape" && !document.fullscreenElement) exitConcentration();
  };

  const onFsChange = () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove("concentration-active");
      __fsWrap?.classList.remove("concentration-overlay");
      setFullscreenTextareaStyles(false);
      hideWordFloat();
      hideCloseBtn();
      unwrapFs();
    } else if (document.fullscreenElement === __fsWrap) {
      // Asegura que la UI auxiliar vive dentro del subárbol fullscreen
      if (__wordFloat && __wordFloat.parentNode !== __fsWrap) {
        try { __fsWrap.appendChild(__wordFloat); } catch {}
      }
      if (__closeBtn && __closeBtn.parentNode !== __fsWrap) {
        try { __fsWrap.appendChild(__closeBtn); } catch {}
      }
      ensureMobileCloseBtn(__fsWrap, exitConcentration);
      setFullscreenTextareaStyles(true);
    }
  };

  const focusBtnEl = document.getElementById("focus-mode");
  focusBtnEl?.addEventListener("click", enterConcentration);
  document.addEventListener("keydown", onEscToExit);
  document.addEventListener("fullscreenchange", onFsChange);

  window.__wmFocusCleanup = () => {
    focusBtnEl?.removeEventListener("click", enterConcentration);
    document.removeEventListener("keydown", onEscToExit);
    document.removeEventListener("fullscreenchange", onFsChange);
    exitConcentration();
  };

  /* ── Estado inicial ───────────────────────────────── */
  if (!inputGoal.value) inputGoal.value = "250";
  textInput.value = "";
  seconds = 0;
  timerEl.textContent = "00:00:00";
  if (wpmEl) wpmEl.textContent = "0";
  updateGoal();
  updateTimerButtons();

  /* ── Eventos ──────────────────────────────────────── */
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

  // Sonido ambiente y su UI
  syncSoundButtons(document);
  (function wireAmbientToggle(root = document) {
    const ambientBtn = root.getElementById("ambient");
    if (!ambientBtn) return;
    const soundBtns = root.querySelectorAll('button[data-action="soundOn"]');
    let visible = false;
    ambientBtn.addEventListener("click", () => {
      visible = !visible;
      soundBtns.forEach((b) => b.classList.toggle("is-visible", visible));
    });
  })();

  // Controles de formato
  wireFormatControls();
}

export function exitWriteMode() {
  document.getElementById("main")?.classList.remove("write-mode-active");

  ["omenu", "otext", "statuso", "imenu", "itext", "statusi"].forEach((id) => {
    const el = document.getElementById(id);
    el?.classList.remove("is-hidden");
    el?.style.removeProperty("display");
    el?.style.removeProperty("width");
    el?.style.removeProperty("height");
    el?.style.removeProperty("flex");
  });

  const imenu = document.getElementById("imenu");
  if (imenu) Array.from(imenu.children).forEach((el) => el.classList.remove("is-hidden"));

  const main = document.getElementById("main");
  main?.style.removeProperty("display");
  main?.style.removeProperty("flex-direction");
  main?.style.removeProperty("gap");
  main?.style.removeProperty("align-items");

  if (window.__wmFocusCleanup) {
    try { window.__wmFocusCleanup(); } catch {}
    window.__wmFocusCleanup = null;
  }

  resetSchemeToTheme();

  if (window.__wmInterval) {
    try { clearInterval(window.__wmInterval); } catch {}
    window.__wmInterval = null;
  }
}
