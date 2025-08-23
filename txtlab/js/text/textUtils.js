// Shared text helpers (pure, testable)

/** Read non-empty trimmed lines from #itext (UI layer calls this) */
export function getLinesFromValue(value) {
  return (value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Fisher–Yates shuffle returning a new array */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Compute char/word/line stats */
export function textStats(s = "") {
  const norm = s.replace(/\r\n?/g, "\n");
  const chars = norm.length;
  const words = norm.trim() ? norm.trim().split(/\s+/).length : 0;
  const lines = norm.split("\n").filter((l) => l.trim().length > 0).length;
  return { chars, words, lines };
}
