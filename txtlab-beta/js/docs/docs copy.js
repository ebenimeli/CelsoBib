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
  const url  = `assets/docs/${file}`;

  // Estado accesible de carga
  const prevHTML = main.innerHTML;
  const prevBusy = main.getAttribute("aria-busy");
  main.setAttribute("aria-busy", "true");
  main.innerHTML = `<div class="loading" role="status" aria-live="polite">Cargando…</div>`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      // Silencioso: restaura y termina si 404/410/etc.
      main.innerHTML = prevHTML;
      if (prevBusy === null) main.removeAttribute("aria-busy");
      else main.setAttribute("aria-busy", prevBusy);
      console.warn(`[loadDoc] No se pudo cargar ${url} (HTTP ${res.status}).`);
      return false;
    }

    // Inserta el HTML
    const html = await res.text();
    const tmp  = document.createElement("div");
    tmp.innerHTML = html;

    main.innerHTML = "";
    while (tmp.firstChild) main.appendChild(tmp.firstChild);

    // Revive <script> para que se ejecuten
    main.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });

    // Notifica que #main ha cambiado (por si otros módulos escuchan)
    const id = file.replace(/\.html$/i, "");
    document.dispatchEvent(new CustomEvent("app:main-updated", { detail: { id } }));

    // Foco en algo accionable
    (main.querySelector("[autofocus], button, a, input, select, textarea") || main).focus?.();

    return true;
  } catch (err) {
    console.error("[loadDoc] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/** Delegación: botones .action con data-file cargan el doc correspondiente */
export function initDocsDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button.action[data-file]');
    if (!btn) return;
    const file = btn.dataset.file?.trim();
    if (file) loadDoc(file);
  });
}

// Auto-init (evita doble cableado en recargas parciales)
if (!window.__docsDelegation) {
  window.__docsDelegation = true;
  initDocsDelegation();
}
