// js/text/write-audio.js
const MEDIA_BASE = "assets/media/";
let bgAudio = null;
let currentBgKey = null;

function getSavedVolume() {
  const v = parseFloat(localStorage.getItem("write.bgVolume") || "0.5");
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
}
export function setSavedVolume(v) {
  const vol = Math.min(1, Math.max(0, Number(v)));
  localStorage.setItem("write.bgVolume", String(vol));
  if (bgAudio) bgAudio.volume = vol;
  return vol;
}
function ensureBgAudio(fileKey = "rainthunder") {
  const key = String(fileKey).trim() || "rainthunder";
  if (!bgAudio || currentBgKey !== key) {
    try {
      bgAudio?.pause();
    } catch {}
    bgAudio = new Audio(`${MEDIA_BASE}${key}.mp3`);
    bgAudio.loop = true;
    bgAudio.preload = "auto";
    bgAudio.volume = getSavedVolume();
    currentBgKey = key;
    localStorage.setItem("write.bgKey", currentBgKey);
    bgAudio.addEventListener("ended", () => syncSoundButtons(document));
    bgAudio.addEventListener("pause", () => syncSoundButtons(document));
    bgAudio.addEventListener("play", () => syncSoundButtons(document));
  }
  return bgAudio;
}

export function syncSoundButtons(root = document) {
  const offBtn = root.querySelector('button[data-action="soundOff"]');
  const isPlaying = !!(bgAudio && !bgAudio.paused && !bgAudio.ended);
  if (offBtn) offBtn.style.display = isPlaying ? "inline-block" : "none";
  root.querySelectorAll('button[data-action="soundOn"]').forEach((b) => {
    const key = (b.dataset.file || "rainthunder").trim();
    b.classList.toggle("is-active", isPlaying && key === currentBgKey);
  });
}

export async function soundOn(btn) {
  const key = (btn?.dataset?.file || "rainthunder").trim();
  const bg = ensureBgAudio(key);
  try {
    await bg.play();
  } catch (e) {
    console.warn("[sound] play()", e);
  }
  syncSoundButtons(document);
}

export function soundOff() {
  if (!bgAudio) return;
  try {
    bgAudio.pause();
  } catch {}
  syncSoundButtons(document);
}

export function setBgVolumeFromInput(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener("input", () => setSavedVolume(inputEl.value));
}

// Restaurar última pista al cargar este módulo
(() => {
  const lastKey = localStorage.getItem("write.bgKey");
  if (lastKey) ensureBgAudio(lastKey);
  syncSoundButtons(document);
})();
