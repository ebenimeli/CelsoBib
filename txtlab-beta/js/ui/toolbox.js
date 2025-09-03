// Mount a <template> into #sidebar and (re)wire toolsets
import { $, $id, IDS, SELECTORS } from "../core/dom.js";
import { wireToolsetTrigger } from "../core/a11y.js";

/** Ensure #sidebar host exists; create it under the first <aside> if missing */
function ensureSidebarHost() {
  let host = $id(IDS.sidebar); // usually "sidebar"
  if (host) return host;

  const aside = document.querySelector("aside");
  if (!aside) {
    console.warn("[mountToolbox] No <aside> found to host #sidebar.");
    return null;
  }

  host = document.createElement("div");
  host.id = IDS.sidebar;
  host.className = "box";
  aside.appendChild(host);
  return host;
}

/** Initialize toolset toggles within a given scope (ARIA-friendly) */
export function initToolsetsWithin(scope) {
  scope.querySelectorAll(SELECTORS.toolset).forEach((set, i) => {
    set.hidden = true;
    if (!set.id) set.id = `toolset-${Date.now()}-${i}`;

    // Trigger: previous sibling if button; otherwise any button[data-target="#id"]
    const prev = set.previousElementSibling;
    const trigger =
      prev?.tagName === "BUTTON"
        ? prev
        : scope.querySelector(`button[data-target="#${set.id}"]`);

    if (!trigger) return;
    wireToolsetTrigger(trigger, set, /* singleOpen */ false);
  });
}

/** Carga en #main el HTML assets/main/<id>.html si existe. Silencioso si 404. */
async function tryLoadMainForId(id) {
  if (!id) return;
  const main = $id("main");
  if (!main) return;

  const url = `assets/main/${id}.html`;

  // Estado accesible de carga
  const prevHTML = main.innerHTML;
  const prevBusy = main.getAttribute("aria-busy");
  main.setAttribute("aria-busy", "true");
  main.innerHTML = `<div class="loading" role="status" aria-live="polite">Cargando…</div>`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      // Si no existe (404/410…), restauramos y salimos sin ruido
      main.innerHTML = prevHTML;
      if (prevBusy === null) main.removeAttribute("aria-busy");
      else main.setAttribute("aria-busy", prevBusy);
      return;
    }

    const html = await res.text();

    // Inserta el HTML
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    main.innerHTML = "";
    while (tmp.firstChild) {
      main.appendChild(tmp.firstChild);
    }

    // Re-ejecutar <script> (inline o con src)
    main.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });

    // Notificar que #main ha cambiado
    document.dispatchEvent(
      new CustomEvent("app:main-updated", { detail: { id } })
    );

    // Enfocar algo accionable
    (
      main.querySelector("[autofocus], button, a, input, select, textarea") ||
      main
    ).focus?.();
  } catch (err) {
    // En errores de red, restauramos el contenido anterior
    main.innerHTML = prevHTML;
    console.debug("[tryLoadMainForId] No se pudo cargar", url, err);
  } finally {
    main.removeAttribute("aria-busy");
  }
}

/**
 * Mount toolbox content into #sidebar.
 * Accepts either a selector string (e.g. "#tplId") OR a HTMLTemplateElement.
 * Returns true if mounted successfully.
 *
 * Además: intenta cargar assets/main/<tplId>.html en #main (si existe).
 */
export function mountToolbox(selectorOrTpl) {
  const tpl =
    selectorOrTpl instanceof HTMLTemplateElement
      ? selectorOrTpl
      : document.querySelector(`template${selectorOrTpl}`);

  const host = ensureSidebarHost();
  if (!tpl || !host) {
    console.warn("[mountToolbox] Missing template or #sidebar host.", {
      tpl,
      host,
    });
    return false;
  }

  // Replace sidebar content while keeping id/classes
  const fresh = host.cloneNode(false);
  fresh.appendChild(tpl.content.cloneNode(true));
  host.replaceWith(fresh);

  // Re-init toolsets inside the new content
  initToolsetsWithin(fresh);

  // Reset #info text (if present)
  const info = $id(IDS.info);
  if (info) {
    const def = info.dataset?.default || info.textContent || "Información";
    info.textContent = def;
    info.title = def;
  }

  // Cargar el HTML correspondiente en #main si existe
  tryLoadMainForId(tpl.id); // fire-and-forget (no bloquea el sidebar)

  return true;
}

/** Click delegación: cuando se pulsa un botón .tool con data-target, monta su template */
export function initToolboxDelegation() {
  document.addEventListener("click", (e) => {
    // Solo botones que tengan data-target (evita theme-toggle y otros sin template)
    const btn = e.target.closest("button.tool[data-target]");
    if (!btn) return;

    const sel = btn.dataset.target; // siempre presente por el selector de arriba
    mountToolbox(sel);
  });
}
