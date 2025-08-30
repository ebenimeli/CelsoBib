/**
 * Calcula la frecuencia de palabras (incluye números) en #itext
 * SIN distinguir mayúsculas/minúsculas y vuelca el resultado en #otext.
 * Orden: frecuencia desc; empate: alfabético (sensitivity 'accent', numeric).
 *
 * Formato:
 *   nwords
 *   palabra;n;f
 *   palabra;n;f
 *   ...
 */
export function calcWordFreq() {
  const inEl = document.getElementById("itext");
  const outEl = document.getElementById("otext");
  if (!inEl || !outEl) {
    console.warn("[stats] No se encuentran #itext o #otext");
    return;
  }

  const text = String(inEl.value || "");
  // Letras y dígitos Unicode → normalizamos a minúsculas (locale 'es')
  const words = (text.match(/[\p{L}\p{N}]+/gu) || []).map((w) =>
    w.toLocaleLowerCase("es")
  );
  const total = words.length;

  if (total === 0) {
    outEl.value = "0";
    return;
  }

  // Conteo case-insensitive (claves en minúsculas)
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);

  // Orden: frecuencia desc; empate: alfabético (ignora caso, respeta acentos)
  const sorted = [...counts.entries()].sort((a, b) => {
    const diff = b[1] - a[1];
    if (diff !== 0) return diff;
    return a[0].localeCompare(b[0], "es", {
      sensitivity: "accent",
      numeric: true,
    });
  });

  const lines = [String(total)];
  for (const [w, n] of sorted) {
    const f = n / total;
    lines.push(`${w};${n};${f.toFixed(6)}`);
  }

  outEl.value = lines.join("\n");
}

// js/text/stats.js

/**
 * Analiza la frecuencia de caracteres alfanuméricos en #itext
 * (respeta mayúsculas/minúsculas) y escribe el resultado en #otext.
 *
 * Formato de salida:
 *   nchars
 *   Car;n;f
 *   Car;n;f
 *   ...
 *
 * - nchars: número total de caracteres alfanuméricos
 * - Car: carácter (letra o dígito, Unicode)
 * - n: número de apariciones
 * - f: frecuencia relativa (n / nchars), entre 0 y 1
 */
export function calcCharFreq() {
  const inEl = document.getElementById("itext");
  const outEl = document.getElementById("otext");
  if (!inEl || !outEl) {
    console.warn("[stats] No se encuentran #itext o #otext");
    return;
  }

  // Normalizamos a NFC para unificar formas compuestas/diacríticas,
  // pero sin cambiar mayúsculas/minúsculas.
  const text = String(inEl.value || "").normalize("NFC");

  // Filtra SOLO caracteres alfanuméricos Unicode (letras y dígitos)
  const isAlnum = (ch) => /^[\p{L}\p{N}]$/u.test(ch);

  const chars = [];
  for (const ch of text) {
    if (isAlnum(ch)) chars.push(ch);
  }

  const total = chars.length;

  if (total === 0) {
    outEl.value = "0";
    return;
  }

  // Conteo sensible a mayúsculas/minúsculas
  const counts = new Map();
  for (const ch of chars) counts.set(ch, (counts.get(ch) || 0) + 1);

  // Orden: frecuencia desc; empate: orden alfabético con sensibilidad 'variant'
  const sorted = [...counts.entries()].sort((a, b) => {
    const diff = b[1] - a[1];
    if (diff !== 0) return diff;
    // 'variant' distingue mayúsculas/minúsculas; 'numeric' ordena 2 < 10.
    return a[0].localeCompare(b[0], "es", {
      sensitivity: "variant",
      numeric: true,
    });
  });

  const lines = [String(total)];
  for (const [car, n] of sorted) {
    const f = n / total;
    lines.push(`${car};${n};${f.toFixed(6)}`);
  }

  outEl.value = lines.join("\n");
}
