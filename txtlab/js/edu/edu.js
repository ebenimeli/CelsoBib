// js/edu/edu.js
import { $id } from "../core/dom.js";

/**
 * Carga en #main el documento HTML de assets/edu/<file>.
 * Acepta "accessibility" o "accessibility.html". Devuelve true/false según éxito.
 */
export async function loadEdu(fileOrId) {
  const main = $id("main");
  if (!main) {
    console.warn("[loadEdu] #main no existe en el DOM.");
    return false;
  }
  if (!fileOrId) {
    console.warn("[loadEdu] Falta el nombre de archivo/id.");
    return false;
  }

  const file = fileOrId.endsWith(".html") ? fileOrId : `${fileOrId}.html`;
  const url = `assets/edu/${file}`;

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
      console.warn(`[loadEdu] No se pudo cargar ${url} (HTTP ${res.status}).`);
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
    console.error("[loadEdu] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/**
 * Delegación SOLO para la sección educativa:
 * escucha clicks en .action[data-file] dentro de los contenedores educativos.
 *
 * Por defecto atiende #diversity (tu panel) y #education (por si lo renombras).
 * Puedes ajustar el selector si cambias la estructura.
 */
export function initEduDelegation(scopeSelector = "#diversity, #education") {
  if (initEduDelegation._wired) return;

  document.addEventListener("click", (e) => {
    // 1) Asegura que el click ocurrió dentro del contenedor educativo
    const container = e.target.closest(scopeSelector);
    if (!container) return;

    // 2) Localiza el botón objetivo dentro de ese contenedor
    const btn = e.target.closest("button.action[data-file]");
    if (!btn || !container.contains(btn)) return;

    // 3) Carga el documento (assets/edu/<file>)
    const file = btn.dataset.file?.trim();
    if (file) {
      e.preventDefault();
      loadEdu(file);
    }
  });

  initEduDelegation._wired = true;
}

// Auto-init (una sola vez)
if (!window.__eduDelegation) {
  window.__eduDelegation = true;
  initEduDelegation(); // escucha dentro de #diversity / #education
}
