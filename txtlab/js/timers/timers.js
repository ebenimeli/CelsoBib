// js/timers/timers.js
import { $id } from "../core/dom.js";

/**
 * Carga en #main el temporizador HTML de assets/timers/<file>.
 * Acepta "digtimer" o "digtimer.html". Devuelve true/false según éxito.
 */
export async function loadTimer(fileOrId) {
  const main = $id("main");
  if (!main) {
    console.warn("[loadTimer] #main no existe en el DOM.");
    return false;
  }
  if (!fileOrId) {
    console.warn("[loadTimer] Falta el nombre de archivo/id.");
    return false;
  }

  const file = fileOrId.endsWith(".html") ? fileOrId : `${fileOrId}.html`;
  const url  = `assets/timers/${file}`;

  // Estado accesible de carga
  const prevHTML = main.innerHTML;
  const prevBusy = main.getAttribute("aria-busy");

  main.setAttribute("aria-busy", "true");
  main.innerHTML = `<div class="loading" role="status" aria-live="polite">Cargando…</div>`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      main.innerHTML = prevHTML;
      if (prevBusy === null) main.removeAttribute("aria-busy");
      else main.setAttribute("aria-busy", prevBusy);
      console.warn(`[loadTimer] No se pudo cargar ${url} (HTTP ${res.status}).`);
      return false;
    }

    const html = await res.text();

    // 1) Avisar al módulo anterior para que haga cleanup ANTES de reemplazar #main
    const id = file.replace(/\.html$/i, "");
    document.dispatchEvent(new CustomEvent("app:main-updated", { detail: { id } }));

    // 2) Insertar HTML y ejecutar <script> embebidos
    main.innerHTML = html;
    runScripts(main);

    // 3) Enfocar algo accionable
    (main.querySelector("[autofocus], button, a, input, select, textarea") || main).focus?.();

    return true;
  } catch (err) {
    console.error("[loadTimer] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    if (prevBusy === null) main.removeAttribute("aria-busy");
    else main.setAttribute("aria-busy", prevBusy);
  }
}

/**
 * Delegación SOLO para la sección de timers:
 * escucha clicks en botones .action[data-file] que estén DENTRO de
 * #basictimers, #tasktimers o #clocks (los contenedores del template #timer).
 */
export function initTimerDelegation() {
  if (initTimerDelegation._wired) return;

  document.addEventListener("click", (e) => {
    // 1) Asegúrate de que el click ocurrió dentro de los contenedores del módulo
    const container = e.target.closest("#basictimers, #tasktimers, #clocks");
    if (!container) return;

    // 2) Localiza el botón objetivo dentro de ese contenedor
    const btn = e.target.closest("button.action[data-file]");
    if (!btn || !container.contains(btn)) return;

    // 3) Carga el temporizador
    const file = btn.dataset.file?.trim();
    if (file) {
      e.preventDefault();
      loadTimer(file);
    }
  });

  initTimerDelegation._wired = true;
}

// Auto-init (una sola vez)
if (!window.__timerDelegation) {
  window.__timerDelegation = true;
  initTimerDelegation();
}

/**
 * Ejecuta los <script> contenidos en el fragmento recién inyectado.
 * Necesario porque innerHTML no ejecuta scripts por sí mismo.
 */
function runScripts(container) {
  container.querySelectorAll("script").forEach((old) => {
    const s = document.createElement("script");
    // Copiar atributos (type, etc.) y el contenido
    for (const { name, value } of Array.from(old.attributes)) {
      s.setAttribute(name, value);
    }
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}
