// ui/dialog.js
import { $id, IDS } from "../core/dom.js";

export function initWelcomeDialog({ modal = false } = {}) {
  const dlg = $id(IDS.welcomeDialog);
  if (!dlg) return;

  if (modal && typeof dlg.showModal === "function") {
    if (!dlg.open) dlg.showModal();
  } else if (typeof dlg.show === "function") {
    if (!dlg.open) dlg.show(); // ← no bloquea la página
  } else {
    dlg.setAttribute("open", "");
  }

  // Cierra al hacer clic fuera del rectángulo
  dlg.addEventListener("click", (e) => {
    const r = dlg.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside && typeof dlg.close === "function") dlg.close("backdrop");
  });
}
