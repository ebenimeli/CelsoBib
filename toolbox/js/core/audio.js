// Click sound pool (lazy) with optional pre-init

let pool = null;
let idx = 0;

/** Build a new audio instance with consistent settings */
function makeAudio(url) {
  const a = new Audio(url);
  a.preload = "auto";
  a.volume = 0.6; // 0–1
  return a;
}

/** Initialize audio pool if not present (no playback) */
export function initClick(url = "assets/media/click.mp3", size = 4) {
  if (pool) return;
  pool = Array.from({ length: size }, () => makeAudio(url));
  idx = 0;
}

/** Play a click sound from the pool, safe against policy errors */
export function playClick(url = "assets/media/click.mp3") {
  if (!pool) initClick(url);
  const i = idx++ % pool.length;
  try {
    pool[i].currentTime = 0;
    pool[i].play();
  } catch {
    // Ignore playback errors (autoplay policies, etc.)
  }
}
