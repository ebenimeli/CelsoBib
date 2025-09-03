// js/text/write-suggest.js
const WORDS_BASE       = "assets/data/words/";
const WORDS_BASE_PATH  = "assets/data/words/";

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getEditorTextarea() {
  return document.querySelector("#text") || document.querySelector("#itext");
}

export function suggestWord() {
  const ta = getEditorTextarea();
  if (!ta) {
    console.warn("No se encontró textarea con id='text' ni 'itext'.");
    return Promise.resolve();
  }
  const idx = 1 + Math.floor(Math.random() * 3);
  const url = `${WORDS_BASE}dic.txt_part${idx}.txt`;
  return fetch(url, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.text();
    })
    .then((text) => {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return;
      const word = pickRandom(lines);
      const needsSpace = ta.value.length > 0 && !/\s$/.test(ta.value);
      ta.value += `${needsSpace ? " " : ""}${word}`;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      return word;
    })
    .catch((err) => console.error("[suggestWord] Error:", err));
}

function pickRandomLine(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function addToItext(snippet) {
  const ta = document.getElementById("itext");
  if (!ta || !snippet) return;
  const needsSpace = ta.value.length > 0 && !/\s$/.test(ta.value);
  ta.value += (needsSpace ? " " : "") + snippet;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}
function readRandomLine(fileName) {
  const url = WORDS_BASE_PATH + fileName;
  return fetch(url, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`[readRandomLine] No se pudo cargar: ${url}`);
      return res.text();
    })
    .then((text) => {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return null;
      return pickRandomLine(lines);
    });
}
function suggestFromFile(btn) {
  const file = btn?.dataset?.file;
  if (!file) {
    console.warn("[suggestFromFile] Falta data-file en el botón.");
    return Promise.resolve();
  }
  return readRandomLine(file)
    .then((line) => addToItext(line))
    .catch((err) => console.error("[suggestFromFile]", err));
}
function suggestFromFileName(tag, file) {
  if (!file) {
    console.warn("[suggestFromFile] Falta data-file en el botón.");
    return Promise.resolve();
  }
  return readRandomLine(file)
    .then((line) => addToItext(tag + ": " + line))
    .catch((err) => console.error("[suggestFromFile]", err));
}

export function suggestCharacter(btn) { return suggestFromFile(btn); }
export function suggestPlace(btn)     { return suggestFromFile(btn); }
export function suggestTime(btn)      { return suggestFromFile(btn); }
export function suggestFeeling(btn)   { return suggestFromFile(btn); }
export function suggestConflict(btn)  { return suggestFromFile(btn); }
export function suggestAll() {
  suggestFromFileName("Personaje", "characters.txt");
  suggestFromFileName("Lugar", "places.txt");
  suggestFromFileName("Momento/tiempo", "times.txt");
  suggestFromFileName("Sentimiento/Emoción", "feelings.txt");
  suggestFromFileName("Conflicto", "conflicts.txt");
}
