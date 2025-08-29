// Basic text transforms and textarea wiring
import { $id, IDS } from "../core/dom.js";
import { getLinesFromValue } from "./textUtils.js";

/** Sort lines A→Z */
export function doAZ() {
  const lines = getLinesFromValue($id(IDS.itext).value).sort((a, b) => a.localeCompare(b));
  $id(IDS.otext).value = lines.join("\n");
}

/** Sort lines Z→A */
export function doZA() {
  const lines = getLinesFromValue($id(IDS.itext).value).sort((a, b) => b.localeCompare(a));
  $id(IDS.otext).value = lines.join("\n");
}

/** Copy left→right */
export function leftToRight() {
  $id(IDS.otext).value = $id(IDS.itext).value;
}

/** Copy right→left */
export function rightToLeft() {
  $id(IDS.itext).value = $id(IDS.otext).value;
}

/** Clear left textarea */
export function cleanLeft() { $id(IDS.itext).value = ""; }

/** Clear right textarea */
export function cleanRight() { $id(IDS.otext).value = ""; }

/** Lowercase transform */
export function lowerCase() {
  $id(IDS.otext).value = $id(IDS.itext).value.toLowerCase();
}

/** Uppercase transform */
export function upperCase() {
  $id(IDS.otext).value = $id(IDS.itext).value.toUpperCase();
}

/** Capitalize each word (simple title-case) */
export function namesUp() {
  const s = $id(IDS.itext).value.toLowerCase().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
  $id(IDS.otext).value = s;
}

/** Remove empty lines */
export function cleanLines() {
  const lines = getLinesFromValue($id(IDS.itext).value);
  $id(IDS.otext).value = lines.join("\n");
}

/** Add 1-based numbering */
export function numberElements() {
  const lines = getLinesFromValue($id(IDS.itext).value);
  $id(IDS.otext).value = lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
}

/** Remove common numbering prefixes like "1. ", "1) ", "1 - ", "1: " */
export function removeNumbering() {
  const src = $id(IDS.itext).value.split("\n");
  const cleaned = src
    .map((l) => l.replace(/^\s*\d+\s*[\.\)\:\-]?\s*/, "").trim())
    .filter((l) => l.length > 0);
  $id(IDS.otext).value = cleaned.join("\n");
}

/** Join right + left, keeping existing right content first */
export function joinLists() {
  const left = $id(IDS.itext).value.trim();
  const right = $id(IDS.otext).value.trim();
  $id(IDS.otext).value = right && left ? right + "\n" + left : (right || left);
}

export function sortByTag() {
  const input = document.getElementById("itext").value;

  // --- Separar líneas no vacías
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // --- Agrupar por etiquetas
  const groups = {};
  lines.forEach((line) => {
    const parts = line.split("/");
    const tag = parts.length > 1 ? parts[parts.length - 1].trim() : "";
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(line);
  });

  // --- Ordenar etiquetas
  const sortedTags = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  // --- Ordenar dentro de cada bloque
  const result = [];
  sortedTags.forEach((tag) => {
    const sortedLines = groups[tag].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
    result.push(...sortedLines);
  });

  // --- Escribir en el textarea de salida
  document.getElementById("otext").value = result.join("\n");
}


/** Remove "/ TAG" tokens that appear right after a slash, keeping the rest.
 *  Examples:
 *   "Lovelace, Ada / A (Grupo 1)"  -> "Lovelace, Ada (Grupo 1)"
 *   "Nombre / etiqueta-2 — nota"   -> "Nombre — nota"
 *  It won't remove text in parentheses or anything not immediately the tag.
 */
export function removeTags() {
  const src = $id(IDS.itext).value.split("\n");

  const cleaned = src
    .map((l) =>
      l
        // Quita cualquier ocurrencia " / etiqueta" (etiqueta = secuencia sin espacios ni ()[]{} )
        .replace(/\s*\/\s*[^\s()[\]{}]+/g, "")
        // Normaliza espacios sobrantes (por si la barra tenía un espacio antes)
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter((l) => l.length > 0);

  $id(IDS.otext).value = cleaned.join("\n");
}

/** Convert list into checklist with big ballot box, ignoring empty lines */
export function toCheckList() {
  const lines = getLinesFromValue($id(IDS.itext).value)
    .filter(line => line.trim() !== ""); // ignora vacías
  const checked = lines.map(line => `☐ ${line}`);
  $id(IDS.otext).value = checked.join("\n");
}

