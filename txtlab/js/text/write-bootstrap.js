// js/text/write-bootstrap.js
import { waitForSelectors } from "./write-utils.js";
import { initWriteMode, exitWriteMode } from "./write-mode.js";

if (!window.__wmBootstrapped) {
  window.__wmBootstrapped = true;

  document.addEventListener("app:main-updated", async (ev) => {
    const id = ev.detail?.id;

    // Limpia timer huérfano si lo hubiera
    if (window.__wmInterval) {
      try {
        clearInterval(window.__wmInterval);
      } catch {}
      window.__wmInterval = null;
    }

    if (id === "write-mode") {
      const ready = await waitForSelectors([
        "#itext",
        "#nwords",
        "#writeprogress",
        "#timer",
      ]);
      if (!ready) {
        console.warn("[write] UI no encontrada tras cargar write-mode.html");
        return;
      }
      try {
        initWriteMode();
      } catch (err) {
        console.warn(err);
      }
    } else {
      try {
        exitWriteMode();
      } catch {}
    }
  });
}
