// Search-in-lines with debounce on #searchtext
import { $id, IDS } from "../core/dom.js";
import { getLinesFromValue } from "./textUtils.js";
import { debounce } from "../core/debounce.js";

/** Filter lines containing the query (case-insensitive) and dump results */
export function searchElements() {
  const query = $id(IDS.searchtext)?.value.trim().toLowerCase() || "";
  const lines = getLinesFromValue($id(IDS.itext).value);

  if (!query) return ($id(IDS.otext).value = "Introduce un texto para buscar.");

  const results = lines.filter((line) => line.toLowerCase().includes(query));
  $id(IDS.otext).value = results.length
    ? results.join("\n")
    : `No se encontraron coincidencias con "${query}".`;
}

/** Wire input event with debounce to live-search */
export function wireLiveSearch() {
  const input = $id(IDS.searchtext);
  if (!input) return;
  const onType = debounce(() => searchElements(), 150);
  input.addEventListener("input", onType);
}
