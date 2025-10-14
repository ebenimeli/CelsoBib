// js/students/students.js
import { $id } from "../core/dom.js";

/**
 * Carga en #main el documento HTML de assets/students/<file>.
 * Acepta "ada-lovelace" o "ada-lovelace.html". Devuelve true/false según éxito.
 */
export async function loadStudent(fileOrId) {
  const main = $id("main");
  if (!main) {
    console.warn("[loadStudent] #main no existe en el DOM.");
    return false;
  }
  if (!fileOrId) {
    console.warn("[loadStudent] Falta el nombre de archivo/id.");
    return false;
  }

  const file = fileOrId.endsWith(".html") ? fileOrId : `${fileOrId}.html`;
  const url = `assets/students/${file}`;

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
        `[loadStudent] No se pudo cargar ${url} (HTTP ${res.status}).`
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
        detail: { id, section: "students" },
      })
    );

    // Enfocar algo accionable
    (
      main.querySelector("[autofocus], button, a, input, select, textarea") ||
      main
    ).focus?.();

    return true;
  } catch (err) {
    console.error("[loadStudent] Error de red:", err);
    main.innerHTML = prevHTML;
    return false;
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/**
 * Delegación SOLO para la sección de estudiantes:
 * escucha clicks en .action[data-student] o .action[data-file] dentro de los contenedores.
 *
 * Por defecto atiende #students y alias habituales; ajusta a tu estructura si hace falta.
 */
export function initStudentDelegation(
  scopeSelector = "#students, #alumnos, #student-list, #geohis, #quimica"
) {
  if (initStudentDelegation._wired) return;

  document.addEventListener("click", (e) => {
    // 1) Asegura que el click ocurrió dentro del contenedor de students
    const container = e.target.closest(scopeSelector);
    if (!container) return;

    // 2) Localiza el botón objetivo dentro de ese contenedor
    const btn = e.target.closest(
      "button.action,[role='button'].action,a.action"
    );
    if (!btn || !container.contains(btn)) return;

    // 3) Obtiene el archivo de data-student o data-file
    const file = btn.dataset.student?.trim() || btn.dataset.file?.trim();

    if (file) {
      e.preventDefault();
      loadStudent(file);
    }
  });

  initStudentDelegation._wired = true;
}

// Auto-init (una sola vez)
if (!window.__studentsDelegation) {
  window.__studentsDelegation = true;
  initStudentDelegation(); // escucha dentro de #students (y alias)
}
