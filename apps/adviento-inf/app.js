/**
 * CALENDARIO DE ADVIENTO — funcionamiento
 * Los textos diarios viven exclusivamente en content.json.
 * Para modificar mensajes, oraciones, gestos o imágenes, edita ese archivo.
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
  const byDay = new Map();
  const openableDoors = new Set();
  let toastTimer;
  let lastTrigger = null;
  let dialogImageReady = false;

  const config = typeof CONFIG === "undefined" ? {
    testMode: false, calendarYear: new Date().getFullYear(),
    timeZone: "Europe/Madrid", animationsEnabled: true
  } : CONFIG;

  if (!config.animationsEnabled) {
    document.documentElement.classList.add("no-animations");
  }
  document.querySelector("#test-mode-label").hidden = !config.testMode;

  // Obtiene el día, mes y año en la zona horaria indicada, incluso si el
  // equipo que muestra el calendario está configurado en otra zona horaria.
  function localToday() {
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
    if (!payload || !Array.isArray(payload.days)) {
      throw new Error("content.json debe contener una lista llamada 'days'.");
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
      console.error("Revisa content.json:\n" + errors.join("\n"));
      if (config.testMode) showToast("Algunos días necesitan revisión en content.json.");
    }
    return errors;
  }

  function buildCalendar() {
    const today = localToday();
    updateStatus(today);
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
    dayImage.onerror = () => {
      dayImage.onerror = null;
      dayImage.src = fallbackImage;
      largeImage.src = fallbackImage;
    };
    dayImage.onload = () => { dialogImageReady = true; };
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

  async function init() {
    buildCalendar();
    try {
      // No-store + parámetro de versión: facilita que las ediciones del JSON
      // se vean tras recargar, incluso con una caché HTTP muy persistente.
      const response = await fetch(`content.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const errors = loadAndValidate(data);
      buildCalendar();
      if (!byDay.size) throw new Error("No hay días válidos en content.json.");
      if (errors.length && config.testMode) status.textContent = "✦ Calendario cargado; revisa los avisos de contenido";
    } catch (error) {
      console.error("No se pudo cargar el calendario:", error);
      status.textContent = "No hemos podido preparar las ventanitas. Prueba a recargar la página.";
      showToast("No se ha podido cargar content.json. Consulta el archivo README.md.");
    }
  }

  init();
})();
