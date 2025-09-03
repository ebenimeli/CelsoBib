// Accessible toggles for .toolset panels
import { $$ } from "./dom.js";

/** Close all .toolset panels except the provided one; sync aria-expanded on triggers */
export function closeAllToolsets(except) {
  $$(".toolset").forEach((panel) => {
    if (panel === except) return;
    panel.hidden = true;
    document
      .querySelectorAll(`button[aria-controls="${panel.id}"]`)
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
  });
}

/** Wire a trigger to a panel with aria-controls/expanded and optional single-open behavior */
export function wireToolsetTrigger(btn, panel, singleOpen = true) {
  btn.type = "button";
  btn.setAttribute("aria-controls", panel.id);
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => {
    const willOpen = panel.hidden;
    if (singleOpen && willOpen) closeAllToolsets(panel);
    panel.hidden = !willOpen;
    btn.setAttribute("aria-expanded", String(willOpen));
  });
}
