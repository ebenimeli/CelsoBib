// Mount a <template> into #sidebar and (re)wire toolsets
import { $, $id, IDS, SELECTORS } from "../core/dom.js";
import { wireToolsetTrigger } from "../core/a11y.js";

/** Initialize toolset toggles within a given scope */
export function initToolsetsWithin(scope) {
  scope.querySelectorAll(SELECTORS.toolset).forEach((set, i) => {
    set.hidden = true;
    if (!set.id) set.id = `toolset-${Date.now()}-${i}`;

    // Trigger: previous sibling if button, else any matching data-target
    const prev = set.previousElementSibling;
    const trigger = prev?.tagName === "BUTTON" ? prev : scope.querySelector(`button[data-target="#${set.id}"]`);
    if (!trigger) return;
    wireToolsetTrigger(trigger, set, /*singleOpen*/ false);
  });
}

/** Replace #sidebar content with template content and re-init toolsets */
export function mountToolbox(selector) {
  const tpl = $(`template${selector}`);
  const oldSidebar = $id(IDS.sidebar);
  if (!tpl || !oldSidebar) return;

  const fresh = oldSidebar.cloneNode(false);
  fresh.appendChild(tpl.content.cloneNode(true));
  oldSidebar.replaceWith(fresh);

  initToolsetsWithin(fresh);

  // Reset #info text to default
  const info = $id(IDS.info);
  if (info) {
    const def = info.dataset?.default || info.textContent || "Información";
    info.textContent = def;
    info.title = def;
  }
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
