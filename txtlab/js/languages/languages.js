// js/languages/languages.js
import { $id } from "../core/dom.js";

/**
 * Carga en #main el documento HTML de assets/languages/<file>.
 * Acepta "spanish" o "spanish.html". Devuelve true/false según éxito.
 */
export async function loadLanguage(fileOrId) {
  const main = $id("main");
  if (!main) {
    console.warn("[loadLanguage] #main no existe en el DOM.");
    return false;
  }
  if (!fileOrId) {
    console.warn("[loadLanguage] Falta el nombre de archivo/id.");
    return false;
  }

  const file = fileOrId.endsWith(".html") ? fileOrId : `${fileOrId}.html`;
  const url = `assets/languages/${file}`;

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
      console.warn(
        `[loadLanguage] No se pudo cargar ${url} (HTTP ${res.status}).`
      );
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
      new CustomEvent("app:main-updated", {
        detail: { id, section: "languages" },
      })
    );

    // Enfocar algo accionable
    (
      main.querySelector("[autofocus], button, a, input, select, textarea") ||
      main
    ).focus?.();

    return true;
  } catch (err) {
    console.error("[loadLanguage] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/**
 * Delegación SOLO para la sección de idiomas:
 * escucha clicks en .action[data-lang] o .action[data-file] dentro de los contenedores de idiomas.
 *
 * Por defecto atiende #languages y #i18n (ajusta si cambias la estructura).
 */
export function initLanguageDelegation(
  scopeSelector = ".toolset, #languages, #i18n"
) {
  if (initLanguageDelegation._wired) return;

  document.addEventListener("click", (e) => {
    // 1) Asegura que el click ocurrió dentro del contenedor de idiomas
    const container = e.target.closest(scopeSelector);
    if (!container) return;

    // 2) Localiza el botón objetivo dentro de ese contenedor
    const btn = e.target.closest(
      "button.action,[role='button'].action,a.action"
    );
    if (!btn || !container.contains(btn)) return;

    // 3) Obtiene el archivo de data-lang o data-file
    const file = btn.dataset.lang?.trim() || btn.dataset.file?.trim();

    if (file) {
      e.preventDefault();
      loadLanguage(file);
    }
  });

  initLanguageDelegation._wired = true;
}

// Auto-init (una sola vez)
if (!window.__languagesDelegation) {
  window.__languagesDelegation = true;
  initLanguageDelegation(); // escucha dentro de #languages / #i18n
}
