// js/text/write-typewriter.js
const MEDIA_BASE = "assets/media/";
let __twEnabled = false;

function updateTypewriterUI(root = document) {
  const btn = root.getElementById("typewriter-toggle");
  if (!btn) return;

  btn.classList.toggle("is-on", __twEnabled);
  btn.setAttribute("aria-pressed", String(__twEnabled));
  btn.title = __twEnabled ? "Desactivar sonido de máquina de escribir"
                          : "Activar sonido de máquina de escribir";

  const icon = btn.querySelector("i");
  const lbl  = btn.querySelector(".lbl");
  const onTxt  = btn.dataset.labelOn  || "Escuchar teclas";
  const offTxt = btn.dataset.labelOff || "Silenciar teclas";

  if (icon) icon.className = __twEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-keyboard";
  if (lbl)  lbl.textContent = __twEnabled ? onTxt : offTxt;

  if (__twEnabled && !btn.querySelector(".state-dot")) {
    const d = document.createElement("span");
    d.className = "state-dot";
    btn.appendChild(d);
  } else if (!__twEnabled) {
    btn.querySelector(".state-dot")?.remove();
  }
}

function ensureTypewriterWired(root = document) {
  if (ensureTypewriterWired._wired) return true;
  const ta = root.getElementById("itext");
  if (!ta) return false;

  const src = `${MEDIA_BASE}typing1.mp3`;
  const mk = () => { const a = new Audio(src); a.preload = "auto"; a.volume = 0.5; return a; };
  const pool = [mk(), mk(), mk(), mk()];
  let idx = 0;

  const onKey = (ev) => {
    if (!__twEnabled) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const a = pool[idx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  };

  ta.addEventListener("keydown", onKey);

  const prev = window.__wmTypeCleanup;
  window.__wmTypeCleanup = () => {
    try { ta.removeEventListener("keydown", onKey); } catch {}
    if (prev) try { prev(); } catch {}
    ensureTypewriterWired._wired = false;
  };

  ensureTypewriterWired._wired = true;
  return true;
}

export function typewriterToggle() {
  if (!ensureTypewriterWired(document)) {
    console.warn("[typewriter] Editor aún no montado.");
    return;
  }
  __twEnabled = !__twEnabled;
  localStorage.setItem("write.typewriter", __twEnabled ? "1" : "0");
  updateTypewriterUI(document);
}

export function typewriterRestore() {
  __twEnabled = localStorage.getItem("write.typewriter") === "1";
  updateTypewriterUI(document);
}
