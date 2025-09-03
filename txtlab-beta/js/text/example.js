// js/text/import.js

import { $id, IDS } from "../core/dom.js";

/** Importa una lista de assets/data/*.txt en el textarea itext */
export async function importList(btn) {
  try {
    const file = btn?.dataset.file;
    if (!file) throw new Error("Falta atributo data-file en el botón");

    const response = await fetch(`js/text/data/${file}`);
    if (!response.ok) throw new Error("No se pudo cargar el archivo: " + file);

    const text = await response.text();
    $id(IDS.itext).value = text;
  } catch (err) {
    console.error("Error en importList:", err);
    $id(IDS.itext).value = "⚠️ Error al cargar la lista.";
  }
}

/**
 * Importa texto en #itext.
 * - Si el botón trae data-file, lo carga desde js/text/data/<archivo>.
 * - Si no trae data-file, abre selector local .txt.
 * @param {HTMLElement} btn - botón que dispara la acción (puede ser null)
 * @param {Object} opts
 * @param {string} [opts.targetId="itext"] - id del textarea destino
 * @param {string} [opts.basePath="js/text/data/"] - carpeta base para data-file
 */
export function importText(
  btn,
  { targetId = "itext", basePath = "js/text/data/" } = {}
) {
  const out = document.getElementById(targetId);
  if (!out) {
    console.error(`[importText] No existe #${targetId}`);
    return Promise.resolve(false);
  }

  const fileFromBtn = btn?.dataset?.file?.trim();

  if (fileFromBtn) {
    // Carga desde el repositorio de textos
    const url =
      (basePath.endsWith("/") ? basePath : basePath + "/") + fileFromBtn;
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
        return res.text();
      })
      .then((text) => {
        out.value = text;
        out.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      })
      .catch((err) => {
        console.error("Error en importText(fetch):", err);
        out.value = "⚠️ Error al importar el archivo.";
        return false;
      });
  }

  // Fallback: selector local .txt
  return new Promise((resolve) => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = ".txt,text/plain";
    picker.style.display = "none";

    const cleanup = () => picker.remove();

    picker.addEventListener("change", async () => {
      try {
        const file = picker.files?.[0];
        if (!file) {
          cleanup();
          return resolve(false);
        }

        const text =
          typeof file.text === "function"
            ? await file.text()
            : await new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(String(r.result || ""));
                r.onerror = () => rej(r.error || new Error("FileReader error"));
                r.readAsText(file);
              });

        out.value = text;
        out.dispatchEvent(new Event("input", { bubbles: true }));
        resolve(true);
      } catch (err) {
        console.error("Error en importText(picker):", err);
        out.value = "⚠️ Error al importar el archivo .txt.";
        resolve(false);
      } finally {
        cleanup();
      }
    });

    document.body.appendChild(picker);
    picker.click();
  });
}
