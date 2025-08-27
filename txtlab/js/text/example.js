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
