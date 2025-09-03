// Mount a <template> into #sidebar and (re)wire toolsets
import { $, $id, IDS, SELECTORS } from "../core/dom.js";
import { wireToolsetTrigger } from "../core/a11y.js";

/** Ensure #sidebar host exists; create it under the first <aside> if missing */
function ensureSidebarHost() {
  let host = $id(IDS.sidebar);          // usually "sidebar"
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
    const trigger = prev?.tagName === "BUTTON"
      ? prev
      : scope.querySelector(`button[data-target="#${set.id}"]`);

    if (!trigger) return;
    wireToolsetTrigger(trigger, set, /* singleOpen */ false);
  });
}

/**
 * Mount toolbox content into #sidebar.
 * Accepts either a selector string (e.g. "#tplId") OR a HTMLTemplateElement.
 * Returns true if mounted successfully.
 */
export function mountToolbox(selectorOrTpl) {
  const tpl = (selectorOrTpl instanceof HTMLTemplateElement)
    ? selectorOrTpl
    : document.querySelector(`template${selectorOrTpl}`);

  const host = ensureSidebarHost();
  if (!tpl || !host) {
    console.warn("[mountToolbox] Missing template or #sidebar host.", { tpl, host });
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
  return true;
}

/** Click delegation: when a .tool button is clicked, mount its template */
export function initToolboxDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button.tool");
    if (!btn) return;
    const sel = btn.dataset.target || `#${btn.id}`;
    mountToolbox(sel);
  });
}
