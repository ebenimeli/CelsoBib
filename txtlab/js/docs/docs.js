// js/docs/docs.js
import { $id } from "../core/dom.js";

/**
 * Carga en #main el documento HTML de assets/docs/<file>.
 * Acepta "lists" o "lists.html". Devuelve true/false según éxito.
 */
export async function loadDoc(fileOrId) {
  const main = $id("main");
  if (!main) {
    console.warn("[loadDoc] #main no existe en el DOM.");
    return false;
  }
  if (!fileOrId) {
    console.warn("[loadDoc] Falta el nombre de archivo/id.");
    return false;
  }

  const file = fileOrId.endsWith(".html") ? fileOrId : `${fileOrId}.html`;
  const url = `assets/docs/${file}`;

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
      console.warn(`[loadDoc] No se pudo cargar ${url} (HTTP ${res.status}).`);
      return false;
    }

    const html = await res.text();

    // Inserta el HTML
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    main.innerHTML = "";
    while (tmp.firstChild) main.appendChild(tmp.firstChild);

    // Re-ejecutar <script> embebidos
    main.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });

    // Notificar actualización de #main
    const id = file.replace(/\.html$/i, "");
    document.dispatchEvent(
      new CustomEvent("app:main-updated", { detail: { id } })
    );

    // Enfocar algo accionable
    (
      main.querySelector("[autofocus], button, a, input, select, textarea") ||
      main
    ).focus?.();

    return true;
  } catch (err) {
    console.error("[loadDoc] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/**
 * Delegación SOLO para la sección de documentación:
 * escucha clicks en botones .action[data-file] que estén DENTRO de #documentation.
 */
export function initDocsDelegation() {
  if (initDocsDelegation._wired) return;
  document.addEventListener("click", (e) => {
    // 1) Asegúrate de que el click ocurrió dentro del contenedor #documentation
    const container = e.target.closest("#documentation");
    if (!container) return;

    // 2) Localiza el botón objetivo dentro de ese contenedor
    const btn = e.target.closest("button.action[data-file]");
    if (!btn || !container.contains(btn)) return;

    // 3) Carga el documento
    const file = btn.dataset.file?.trim();
    if (file) {
      e.preventDefault();
      loadDoc(file);
    }
  });
  initDocsDelegation._wired = true;
}

// Auto-init (una sola vez)
if (!window.__docsDelegation) {
  window.__docsDelegation = true;
  initDocsDelegation();
}
