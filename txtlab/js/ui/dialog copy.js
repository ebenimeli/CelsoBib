// Welcome <dialog> open/close behavior + backdrop click
import { $id, IDS } from "../core/dom.js";

/** Open dialog on load and close when clicking outside the dialog rect */
export function initWelcomeDialog() {
  const dlg = $id(IDS.welcomeDialog);
  if (!dlg) return;

  if (typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
  } else {
    // Basic fallback if <dialog> unsupported
    dlg.setAttribute("open", "");
  }

  dlg.addEventListener("click", (e) => {
    const r = dlg.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dlg.close("backdrop");
  });
}
