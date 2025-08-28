// Grouping, shuffling and selection logic
import { $id, IDS } from "../core/dom.js";
import { getLinesFromValue, shuffle } from "./textUtils.js";

/** Get names from #itext as array of trimmed non-empty lines */
function getNames() { return getLinesFromValue($id(IDS.itext).value); }

/** Create random groups of size `size` and dump into #otext */
export function makeGroups(size) {
  const names = shuffle(getNames());
  const out = [];
  if (names.length === 0) { $id(IDS.otext).value = ""; return; }

  const full = Math.floor(names.length / size);
  const rem = names.length % size;
  let groupIndex = 1;

  for (let g = 0; g < full; g++) {
    const chunk = names.slice(g * size, g * size + size).sort((a, b) => a.localeCompare(b));
    chunk.forEach((member) => out.push(`${member} (Grupo ${groupIndex})`));
    groupIndex++;
  }

  if (rem > 0) {
    const leftover = names.slice(full * size).sort((a, b) => a.localeCompare(b));
    leftover.forEach((m) => out.push(`${m} (Grupo de menor tamaño)`));
  }

  $id(IDS.otext).value = out.join("\n");
}

/** Public helpers to create groups of fixed sizes */
export const group2 = () => makeGroups(2);
export const group3 = () => makeGroups(3);
export const group4 = () => makeGroups(4);

/** Read group size from #inputtext and make groups */
export function groupX() {
  const size = parseInt($id(IDS.inputtext).value, 10);
  if (isNaN(size) || size <= 0) {
    $id(IDS.otext).value = "Introduce un número válido para el tamaño de grupo.";
    return;
  }
  makeGroups(size);
}

/** Shuffle list and dump to #otext */
export function shuffleList() {
  const mixed = shuffle(getNames());
  $id(IDS.otext).value = mixed.join("\n");
}

/** Select N random elements from #itext */
export function randomElements() {
  const lines = getNames();
  const n = parseInt($id(IDS.inputtext).value, 10);

  if (isNaN(n) || n <= 0) return $id(IDS.otext).value = "Introduce un número válido.";
  if (n > lines.length) return $id(IDS.otext).value = `No hay suficientes elementos. (Hay ${lines.length}, pediste ${n})`;

  $id(IDS.otext).value = shuffle(lines).slice(0, n).join("\n");
}

/** Build 1A + 2B + 1C groups, report leftovers; 
 * input format: "Surname, Name / X" */
export function abbc() {
  const lines = getNames();
  const A = [], B = [], C = [];
  const re = /^(.*?)(?:\s*\/\s*)([ABCabc])$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const name = m[1].trim();
    const tag = m[2].toUpperCase();
    (tag === "A" ? A : tag === "B" ? B : C).push({ name, tag });
  }

  const As = shuffle(A), Bs = shuffle(B), Cs = shuffle(C);
  const maxGroups = Math.min(As.length, Math.floor(Bs.length / 2), Cs.length);

  const out = [];
  if (maxGroups === 0) {
    out.push("No se pueden formar grupos de 4 con la composición 1A + 2B + 1C.");
    out.push(`Disponibles: A=${As.length}, B=${Bs.length}, C=${Cs.length}`);
    $id(IDS.otext).value = out.join("\n");
    return;
  }

  for (let g = 1; g <= maxGroups; g++) {
    const a = As.pop();
    const b1 = Bs.pop(), b2 = Bs.pop();
    const c = Cs.pop();
    const BsSorted = [b1, b2].sort((u, v) => u.name.localeCompare(v.name));

    // --- Formato nuevo: "Nombre /X (Grupo n)"
    out.push(`${a.name} /${a.tag} (Grupo ${g})`);
    BsSorted.forEach((b) => out.push(`${b.name} /${b.tag} (Grupo ${g})`));
    out.push(`${c.name} /${c.tag} (Grupo ${g})`);
  }

  const leftovers = [...As, ...Bs, ...Cs].sort((u, v) => u.name.localeCompare(v.name));
  leftovers.forEach((m) => out.push(`${m.name} /${m.tag}`));

  $id(IDS.otext).value = out.join("\n");
}


/** Build 1A + 1B + 1C groups, report leftovers; 
 * input format: "Surname, Name / X" */
export function abc() {
  const lines = getNames();
  const A = [], B = [], C = [];
  const re = /^(.*?)(?:\s*\/\s*)([ABCabc])$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const name = m[1].trim();
    const tag = m[2].toUpperCase();
    (tag === "A" ? A : tag === "B" ? B : C).push({ name, tag });
  }

  const As = shuffle(A), Bs = shuffle(B), Cs = shuffle(C);
  const maxGroups = Math.min(As.length, Bs.length, Cs.length);

  const out = [];
  if (maxGroups === 0) {
    out.push("No se pueden formar grupos de 3 con la composición 1A + 1B + 1C.");
    out.push(`Disponibles: A=${As.length}, B=${Bs.length}, C=${Cs.length}`);
    $id(IDS.otext).value = out.join("\n");
    return;
  }

  for (let g = 1; g <= maxGroups; g++) {
    const a = As.pop();
    const b = Bs.pop();
    const c = Cs.pop();

    // Formato: "Nombre /X (Grupo n)"
    out.push(`${a.name} /${a.tag} (Grupo ${g})`);
    out.push(`${b.name} /${b.tag} (Grupo ${g})`);
    out.push(`${c.name} /${c.tag} (Grupo ${g})`);
  }

  const leftovers = [...As, ...Bs, ...Cs].sort((u, v) => u.name.localeCompare(v.name));
  leftovers.forEach((m) => out.push(`${m.name} /${m.tag}`));

  $id(IDS.otext).value = out.join("\n");
}



/** 
 * Agrupa según patrón definido en input#inputtext.
 * Ej: "ABBC" → grupos con 1 A, 2 B y 1 C. 
 */
export function groupByPattern() {
  const patternRaw = $id("inputtext").value.trim().toUpperCase();
  if (!patternRaw) {
    $id(IDS.otext).value = "⚠️ Especifica un patrón en el input.";
    return;
  }

  const lines = getNames(); // función que obtiene las líneas
  const buckets = {};       // { A: [], B: [], ... }
  const leftovers = [];

  // Expresión: "Nombre / X"
  const re = /^(.*?)(?:\s*\/\s*)([A-Z])$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) {
      leftovers.push({ name: line.trim(), tag: "?" });
      continue;
    }
    const name = m[1].trim();
    const tag = m[2].toUpperCase();
    if (!buckets[tag]) buckets[tag] = [];
    buckets[tag].push({ name, tag });
  }

  // Cuenta cuántos necesita el patrón
  const need = {};
  for (const ch of patternRaw) {
    need[ch] = (need[ch] || 0) + 1;
  }

  // máximo número de grupos posibles
  let maxGroups = Infinity;
  for (const tag in need) {
    const available = buckets[tag]?.length || 0;
    maxGroups = Math.min(maxGroups, Math.floor(available / need[tag]));
  }
  if (maxGroups === Infinity) maxGroups = 0;

  const out = [];
  if (maxGroups === 0) {
    out.push(`No se pueden formar grupos con el patrón ${patternRaw}.`);
    $id(IDS.otext).value = out.join("\n");
    return;
  }

  // formar grupos
  for (let g = 1; g <= maxGroups; g++) {
    const group = [];
    for (const ch of patternRaw) {
      const member = buckets[ch].shift(); // ← mantiene el orden original
      if (member) group.push(member);
    }
    group.forEach((m) => out.push(`${m.name} (Grupo ${g} / ${m.tag})`));
  }

  // sobras
  for (const tag in buckets) {
    leftovers.push(...buckets[tag]);
  }
  leftovers.forEach((m) => out.push(`${m.name} (${m.tag})`));

  $id(IDS.otext).value = out.join("\n");
}


/** Sort students: A (alphabetical), then B, then C
 * input format: "Surname, Name / X" */
export function sortABC() {
  const lines = getNames();
  const A = [], B = [], C = [];
  const re = /^(.*?)(?:\s*\/\s*)([ABCabc])$/;

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const name = m[1].trim();
    const tag = m[2].toUpperCase();
    (tag === "A" ? A : tag === "B" ? B : C).push({ name, tag });
  }

  // Ordenar cada bloque alfabéticamente
  const As = A.sort((u, v) => u.name.localeCompare(v.name));
  const Bs = B.sort((u, v) => u.name.localeCompare(v.name));
  const Cs = C.sort((u, v) => u.name.localeCompare(v.name));

  const out = [];
  As.forEach(m => out.push(`${m.name} (${m.tag})`));
  Bs.forEach(m => out.push(`${m.name} (${m.tag})`));
  Cs.forEach(m => out.push(`${m.name} (${m.tag})`));

  // Mostrar en el cuadro de salida
  $id(IDS.otext).value = out.join("\n");
}

/** Split list into N random groups, balanced except possibly the last */
export function splitList() {
  const numGroups = parseInt($id(IDS.inputtext).value, 10);
  const students = getNames();

  if (isNaN(numGroups) || numGroups <= 0) {
    return $id(IDS.otext).value = "Introduce un número válido de grupos.";
  }
  if (!students.length) {
    return $id(IDS.otext).value = "La lista está vacía.";
  }
  if (numGroups > students.length) {
    return $id(IDS.otext).value = `No puedes crear ${numGroups} grupos con solo ${students.length} estudiantes.`;
  }

  const pool = shuffle(students);
  const target = Math.ceil(pool.length / numGroups);
  const groups = Array.from({ length: numGroups }, () => []);

  for (let g = 0; g < numGroups - 1; g++) {
    while (groups[g].length < target && pool.length) groups[g].push(pool.pop());
  }
  while (pool.length) groups[numGroups - 1].push(pool.pop());

  const out = [];
  groups.forEach((group, i) =>
    group.forEach((s) => out.push(`${s} (Grupo ${i + 1})`))
  );

  $id(IDS.otext).value = out.join("\n");
}
