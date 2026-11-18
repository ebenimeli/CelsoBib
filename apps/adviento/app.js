/**
 * CALENDARIO DE ADVIENTO — funcionamiento
 * Una única aplicación con seis fuentes editables en content/<modo>.json.
 * Se conservan el calendario, las restricciones de fecha y las ventanas.
 */
(() => {
  "use strict";

  const grid = document.querySelector("#calendar-grid");
  const status = document.querySelector("#calendar-status");
  const toast = document.querySelector("#toast");
  const dayDialog = document.querySelector("#day-dialog");
  const imageDialog = document.querySelector("#image-dialog");
  const dayImage = document.querySelector("#day-image");
  const largeImage = document.querySelector("#large-day-image");
  const fallbackImage = "assets/fallback.svg";
  const stageSelect = document.querySelector("#stage-select");
  const adventCandles = document.querySelector("#advent-candles");
  const candleElements = Array.from(adventCandles.querySelectorAll(".advent-candle"));
  const MODES = Object.freeze({
    "infantil": { name: "Infantil", eyebrow: "UN ADVIENTO PARA DESCUBRIR", subtitle: "Cada día preparamos nuestro corazón para Jesús", motto: "CADA DÍA, UNA PEQUEÑA LUZ", art: "UN REGALO PARA HOY", action: "Nuestro pequeño gesto" },
    "primaria-1-3": { name: "Primaria 1.º–3.º", eyebrow: "24 DÍAS PARA CRECER EN EL BIEN", subtitle: "Pequeños gestos, grandes descubrimientos", motto: "CADA GESTO ABRE UN CAMINO", art: "UNA HISTORIA PARA HOY", action: "Nuestro compromiso" },
    "primaria-4-6": { name: "Primaria 4.º–6.º", eyebrow: "UN CAMINO DE ESPERANZA", subtitle: "Reflexionar, actuar y preparar la Navidad", motto: "UNA DECISIÓN PUEDE CAMBIAR MUCHO", art: "PARA MIRAR CON ATENCIÓN", action: "Compromiso del día" },
    "eso-1-2": { name: "ESO 1.º–2.º", eyebrow: "EL ADVIENTO TAMBIÉN ES TUYO", subtitle: "24 oportunidades para escuchar, decidir y actuar", motto: "HAZ QUE LA ESPERA CUENTE", art: "MIRA MÁS ALLÁ", action: "Pasa a la acción" },
    "eso-3-4": { name: "ESO 3.º–4.º", eyebrow: "TIEMPO DE PREGUNTAS Y SENTIDO", subtitle: "La esperanza se construye con decisiones", motto: "ESPERAR TAMBIÉN ES TRANSFORMAR", art: "UNA IMAGEN, UNA PREGUNTA", action: "Un compromiso real" },
    "bachillerato": { name: "Bachillerato", eyebrow: "24 PAUSAS PARA PENSAR", subtitle: "La esperanza se piensa, se elige y se vive", motto: "LA ESPERANZA ES UNA DECISIÓN", art: "UNA MIRADA DIFERENTE", action: "Llévalo a la vida" }
  });
  const DEFAULT_MODE = "infantil";
  const KEY = "adviento.educationalMode";
  function rememberedMode() {
    try { const stored = localStorage.getItem(KEY); return Object.hasOwn(MODES, stored) ? stored : DEFAULT_MODE; }
    catch (_) { return DEFAULT_MODE; }
  }
  let mode = rememberedMode();
  let requestSequence = 0;
  document.documentElement.dataset.mode = mode;
  stageSelect.value = mode;

  function renderMode() {
    const labels = MODES[mode];
    document.documentElement.dataset.mode = mode;
    stageSelect.value = mode;
    document.querySelector("#stage-eyebrow").textContent = labels.eyebrow;
    document.querySelector("#stage-subtitle").textContent = labels.subtitle;
    document.querySelector("#village-motto").textContent = labels.motto;
    document.querySelector("#art-motto").textContent = labels.art;
    document.querySelector("#action-label").textContent = labels.action;
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue("--night").trim() || "#26223e";
  }
  const byDay = new Map();
  const openableDoors = new Set();
  let toastTimer;
  let lastTrigger = null;
  let dialogImageReady = false;

  const config = typeof CONFIG === "undefined" ? {
    testMode: false, calendarYear: new Date().getFullYear(),
    timeZone: "Europe/Madrid", animationsEnabled: true, testDate: null,
    candleLightingDates: ["2026-11-29", "2026-12-06", "2026-12-13", "2026-12-20"]
  } : CONFIG;

  if (!config.animationsEnabled) {
    document.documentElement.classList.add("no-animations");
  }
  document.querySelector("#test-mode-label").hidden = !config.testMode;

  // La fecha simulada se utiliza solamente en modo pruebas, tanto para las
  // ventanas como para las velas. Se valida para evitar fechas imposibles.
  function parseCalendarDate(value) {
    if (typeof value !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const test = new Date(Date.UTC(year, month - 1, day));
    if (test.getUTCFullYear() !== year || test.getUTCMonth() + 1 !== month || test.getUTCDate() !== day) return null;
    return { year, month, day };
  }

  const simulatedToday = config.testMode && config.testDate ? parseCalendarDate(config.testDate) : null;
  if (config.testMode && config.testDate && !simulatedToday) {
    console.warn("config.testDate no es una fecha YYYY-MM-DD válida; se utilizará la fecha real.");
  }

  // Obtiene el día, mes y año en la zona horaria indicada, incluso si el
  // equipo que muestra el calendario está configurado en otra zona horaria.
  function localToday() {
    if (simulatedToday) return simulatedToday;
    let dateParts;
    try {
      dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timeZone, year: "numeric", month: "numeric", day: "numeric"
      }).formatToParts(new Date());
    } catch (error) {
      console.warn("Zona horaria no válida; se usará Europe/Madrid", error);
      dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid", year: "numeric", month: "numeric", day: "numeric"
      }).formatToParts(new Date());
    }
    const valueOf = (type) => Number(dateParts.find(p => p.type === type).value);
    return { year: valueOf("year"), month: valueOf("month"), day: valueOf("day") };
  }

  // Las fechas se definen en config.js para mantener el calendario reutilizable.
  // Fuera del año configurado no se muestran velas encendidas.
  function updateAdventCandles(today) {
    const stamp = `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;
    const starts = Array.isArray(config.candleLightingDates) ? config.candleLightingDates : [];
    const lit = today.year === config.calendarYear
      ? Math.min(4, starts.filter(date => parseCalendarDate(date) && date <= stamp).length)
      : 0;
    candleElements.forEach((candle, index) => candle.classList.toggle("is-lit", index < lit));
    const description = lit === 0 ? "ninguna vela encendida" : `${lit} ${lit === 1 ? "vela encendida" : "velas encendidas"}`;
    adventCandles.setAttribute("aria-label", `Corona de Adviento: ${description}`);
  }

  function stateForDay(day, today) {
    if (config.testMode) return "test-open";
    if (today.year < config.calendarYear || (today.year === config.calendarYear && today.month < 12)) return "future";
    if (today.year > config.calendarYear || (today.year === config.calendarYear && today.month > 12)) return "past";
    if (day < today.day) return "past";
    if (day > today.day) return "future";
    return "current";
  }

  function updateStatus(today) {
    if (config.testMode) {
      status.textContent = "✦ Modo pruebas: ¡puedes descubrir los 24 días!";
    } else if (today.year === config.calendarYear && today.month === 12 && today.day >= 1 && today.day <= 24) {
      status.textContent = `✦ Hoy nos espera la ventanita ${today.day}`;
    } else if (today.year > config.calendarYear || (today.year === config.calendarYear && today.month === 12 && today.day > 24)) {
      status.textContent = "✦ ¡Feliz Navidad! Gracias por compartir este camino";
    } else {
      status.textContent = `✦ Nos encontraremos aquí el 1 de diciembre de ${config.calendarYear}`;
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  // La validación de cada día es independiente: un error aislado no impide
  // que los demás contenidos correctos puedan mostrarse.
  function loadAndValidate(payload) {
    byDay.clear();
    if (!payload || !Array.isArray(payload.days)) {
      throw new Error(`content/${mode}.json debe contener una lista llamada 'days'.`);
    }
    const errors = [];
    if (payload.days.length !== 24) errors.push(`Se esperaban 24 entradas, hay ${payload.days.length}.`);
    const fields = ["title", "message", "prayer", "action", "image", "imageAlt"];
    for (const item of payload.days) {
      if (!item || !Number.isInteger(item.day) || item.day < 1 || item.day > 24) {
        errors.push("Hay una entrada sin un número de día válido (1-24).");
        continue;
      }
      if (byDay.has(item.day)) {
        errors.push(`El día ${item.day} aparece más de una vez.`);
        byDay.delete(item.day);
        continue;
      }
      const missing = fields.filter(field => typeof item[field] !== "string" || item[field].trim() === "");
      if (missing.length) {
        errors.push(`Día ${item.day}: faltan los campos ${missing.join(", ")}.`);
        continue;
      }
      byDay.set(item.day, item);
    }
    for (let d = 1; d <= 24; d++) {
      if (!byDay.has(d)) errors.push(`El día ${d} no tiene contenido válido.`);
    }
    if (errors.length) {
      console.error("Revisa content/" + mode + ".json:\n" + errors.join("\n"));
      if (config.testMode) showToast(`Algunos días necesitan revisión en content/${mode}.json.`);
    }
    return errors;
  }

  function buildCalendar() {
    const today = localToday();
    updateStatus(today);
    updateAdventCandles(today);
    const fragment = document.createDocumentFragment();
    openableDoors.clear();
    for (let day = 1; day <= 24; day++) {
      const state = stateForDay(day, today);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `house ${state}`;
      btn.dataset.day = String(day);
      const accessibleStatus = state === "current" ? "disponible hoy" : state === "test-open" ? "disponible en modo pruebas" : state === "past" ? "día pasado" : "todavía cerrado";
      btn.setAttribute("aria-label", `Día ${day}, ${accessibleStatus}`);
      if (state === "past" || state === "future") btn.setAttribute("aria-disabled", "true");
      if ((state === "current" || state === "test-open") && byDay.has(day)) openableDoors.add(day);
      btn.innerHTML = '<span class="house-roof" aria-hidden="true"></span><span class="house-body" aria-hidden="true"><span class="house-door"><span class="house-number"></span></span></span>';
      btn.querySelector(".house-number").textContent = String(day);
      btn.addEventListener("click", () => onDoorClick(day, btn));
      fragment.appendChild(btn);
    }
    grid.replaceChildren(fragment);
  }

  function onDoorClick(day, button) {
    const state = stateForDay(day, localToday());
    if (state === "future") return showToast("¡Todavía no es el momento! Pronto llegará este día ✦");
    if (state === "past") return showToast("Esta ventanita ya forma parte de nuestro camino ♥");
    const data = byDay.get(day);
    if (!data) return showToast("Esta ventanita necesita una pequeña revisión.");
    lastTrigger = button;
    document.querySelector("#day-tag").textContent = `DÍA ${String(day).padStart(2, "0")} · ADVIENTO`;
    document.querySelector("#day-title").textContent = data.title;
    document.querySelector("#day-message").textContent = data.message;
    document.querySelector("#day-prayer").textContent = data.prayer;
    document.querySelector("#day-action").textContent = data.action;
    dayImage.alt = data.imageAlt;
    largeImage.alt = data.imageAlt;
    dialogImageReady = false;
    const requestedImage = new URL(data.image, document.baseURI).href;
    dayImage.onerror = () => {
      if (dayImage.src !== requestedImage) return;
      dayImage.onerror = null;
      dayImage.src = fallbackImage;
      largeImage.src = fallbackImage;
    };
    dayImage.onload = () => { dialogImageReady = dayImage.src === requestedImage; };
    dayImage.src = data.image;
    largeImage.src = data.image;
    dayDialog.showModal();
    document.querySelector("#close-day").focus();
  }

  function closeDay() { if (dayDialog.open) dayDialog.close(); }
  function closeImage() { if (imageDialog.open) imageDialog.close(); }
  document.querySelector("#close-day").addEventListener("click", closeDay);
  document.querySelector("#back-to-calendar").addEventListener("click", closeDay);
  document.querySelector("#close-image").addEventListener("click", closeImage);
  document.querySelector("#expand-image").addEventListener("click", () => {
    largeImage.src = dialogImageReady ? dayImage.src : fallbackImage;
    imageDialog.showModal();
    document.querySelector("#close-image").focus();
  });
  dayDialog.addEventListener("close", () => { if (lastTrigger) lastTrigger.focus(); });
  dayDialog.addEventListener("click", (event) => { if (event.target === dayDialog) closeDay(); });
  imageDialog.addEventListener("click", (event) => { if (event.target === imageDialog) closeImage(); });
  // Cuando llega un nuevo día sin recargar, la página actualiza las ventanas.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) buildCalendar(); });
  window.addEventListener("focus", () => buildCalendar());
  // También se actualiza si la pantalla permanece encendida al cambiar de día.
  let lastDateStamp = JSON.stringify(localToday());
  setInterval(() => {
    const stamp = JSON.stringify(localToday());
    if (stamp !== lastDateStamp) { lastDateStamp = stamp; buildCalendar(); }
  }, 60000);

  async function switchMode(nextMode) {
    if (!Object.hasOwn(MODES, nextMode)) return;
    mode = nextMode;
    const sequence = ++requestSequence;
    // Cerrar modales evita mezclar día o etapa durante la exportación.
    closeImage();
    closeDay();
    byDay.clear();
    renderMode();
    buildCalendar();
    status.textContent = "Preparando los contenidos de " + MODES[mode].name + "…";
    try {
      const response = await fetch(`content/${mode}.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (sequence !== requestSequence) return; // descarta respuestas de modos anteriores
      const errors = loadAndValidate(payload);
      buildCalendar();
      if (!byDay.size) throw new Error("No hay contenidos válidos.");
      if (errors.length && config.testMode) status.textContent = "✦ Revisa los avisos de contenido para " + MODES[mode].name;
      try { localStorage.setItem(KEY, mode); } catch (_) { /* almacenaje bloqueado */ }
    } catch (error) {
      if (sequence !== requestSequence) return;
      console.error("No se pudo cargar el modo", mode, error);
      status.textContent = "No hemos podido cargar esta etapa. Prueba a seleccionarla de nuevo.";
      showToast(`No se pudo cargar content/${mode}.json. Comprueba el servidor.`);
    }
  }
  stageSelect.addEventListener("change", () => switchMode(stageSelect.value));
  renderMode();
  switchMode(mode);
})();
