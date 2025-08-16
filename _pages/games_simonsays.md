---
layout: page
title: "🔄 Simon dice"
description: "¡Memoriza y repite!"
---

<!-- === SIMON GAME === -->
<div id="simon-game">
  <div class="game-bar">
    <strong>🟩🟥🟨🟦 Simon dice</strong>
    <div class="game-scorebox">
      Puntos: <span id="si-score">0</span>
      · Mejor: <span id="si-best">0</span>
    </div>
    <div class="game-controls">
      <label>
        Dificultad
        <select id="si-diff">
          <option value="easy">Fácil</option>
          <option value="normal" selected>Normal</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      <button id="si-start" class="btn">▶︎/⏸</button>
      <button id="si-restart" class="btn">⟲</button>
    </div>
  </div>

  <div class="game-canvas-wrap">
    <canvas id="si-canvas"></canvas>

    <!-- Overlay centrado -->
    <div class="game-overlay" id="si-overlay">
      <div class="game-overlay-card">
        <div id="si-status-text">Empezar</div>
        <button id="si-overlay-btn" class="btn btn-primary">Jugar</button>
      </div>
    </div>
  </div>

  <p class="game-help">
    Haz clic/toca en los colores. Teclado: 1–4 (o ← → ↑ ↓ / WASD). Espacio/P pausa. R reinicia.
  </p>
</div>

<style>
#simon-game {
  max-width: 540px;
  margin: 1rem auto;
  background: #fff;
  padding: .5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
#simon-game canvas {
  width: 100%;
  aspect-ratio: 1/1; /* cuadrado */
  background: #000;
  display: block;
  border-radius: 12px;
}
.game-canvas-wrap { position: relative; }
.game-overlay {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.5);
}
.game-overlay-card {
  background: rgba(0,0,0,.85); color: #fff;
  padding: 1rem; border-radius: 10px; text-align: center;
}
.btn { padding: .25rem .5rem; border: 1px solid #333; background: #eee; cursor: pointer; }
.btn-primary { background: #22c55e; color: #fff; border: none; }
.game-controls { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.game-scorebox { white-space: nowrap; }
</style>

<script>
document.addEventListener("DOMContentLoaded", () => {
  // === Elements ===
  const canvas = document.getElementById("si-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("si-score");
  const bestEl  = document.getElementById("si-best");
  const btnStart   = document.getElementById("si-start");
  const btnRestart = document.getElementById("si-restart");
  const overlay    = document.getElementById("si-overlay");
  const overlayBtn = document.getElementById("si-overlay-btn");
  const statusTxt  = document.getElementById("si-status-text");
  const diffSel    = document.getElementById("si-diff");
  const HS_KEY = "simon.best";

  // === Canvas sizing ===
  let W=0,H=0, half=0, gap=6, active=-1;
  function resize() {
    const w = Math.floor(canvas.parentElement.offsetWidth);
    canvas.width = w; canvas.height = w; W = w; H = w; half = w/2;
    draw();
  }

  // === Colors and board ===
  const pads = [
    { base:"#22c55e", lite:"#86efac", freq:329.63 }, // green TL
    { base:"#ef4444", lite:"#fca5a5", freq:261.63 }, // red   TR
    { base:"#f59e0b", lite:"#fde68a", freq:220.00 }, // yellow BL
    { base:"#3b82f6", lite:"#93c5fd", freq:392.00 }  // blue   BR
  ];

  function drawQuad(idx, color) {
    const r = 12; // corner radius
    const x = (idx%2===0) ? 0 : half;
    const y = (idx<2) ? 0 : half;
    const w = half, h = half;

    ctx.beginPath();
    // Rounded rect
    const tl = (idx===0), tr=(idx===1), bl=(idx===2), br=(idx===3);
    ctx.moveTo(x + (tl? r:0), y);
    ctx.lineTo(x + w - (tr? r:0), y);
    if (tr) ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h - (br? r:0));
    if (br) ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x + (bl? r:0), y+h);
    if (bl) ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y + (tl? r:0));
    if (tl) ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = "#000";
    ctx.lineWidth = gap;
    ctx.beginPath();
    ctx.moveTo(half, 0); ctx.lineTo(half, H);
    ctx.moveTo(0, half); ctx.lineTo(W, half);
    ctx.stroke();
  }

  function draw() {
    // Background border
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,W,H);
    for (let i=0;i<4;i++) {
      const color = (i===active) ? pads[i].lite : pads[i].base;
      drawQuad(i, color);
    }
  }

  // === Audio (no mp3) ===
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function beep(freq=220, dur=300, vol=0.2) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + dur/1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur/1000 + 0.01);
  }

  // === Game state ===
  let sequence = [];
  let userIndex = 0;
  let running = false, paused = false, playingBack = false, gameOver = false;
  let level = 0, score = 0;
  let playbackToken = 0; // cancels pending playback on restart

  function difficultyParams() {
    // Returns durations (ms). They tighten with level.
    const base = { easy: {on:550, gap:140, minOn:280},
                   normal:{on:420, gap:120, minOn:220},
                   pro:   {on:320, gap:100, minOn:180} }[diffSel.value] || {on:420,gap:120,minOn:220};
    const on = Math.max(base.minOn, base.on - level*12);
    const gap = base.gap;
    return {on, gap};
  }

  function setActive(idx) { active = idx; draw(); }
  function clearActive() { active = -1; draw(); }

  function pickPadIndexFromPoint(x, y) {
    // x,y relative to canvas
    const left = (x < half);
    const top  = (y < half);
    if (top && left) return 0;
    if (top && !left) return 1;
    if (!top && left) return 2;
    return 3;
  }

  function handlePadInput(idx) {
    if (!running || paused || playingBack || gameOver) return;
    // Flash + sound
    const {on} = difficultyParams();
    setActive(idx);
    beep(pads[idx].freq, Math.min(180, on-40), 0.25);
    setTimeout(() => { if (active===idx) clearActive(); }, 150);

    // Check correctness
    if (idx === sequence[userIndex]) {
      userIndex++;
      if (userIndex >= sequence.length) {
        // Round complete
        score = sequence.length;
        scoreEl.textContent = score;
        const best = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
        if (score > best) { localStorage.setItem(HS_KEY, String(score)); bestEl.textContent = String(score); }
        nextRound();
      }
    } else {
      // Error
      errorFlash();
      endGame();
    }
  }

  function errorFlash() {
    setActive(-1);
    beep(110, 450, 0.3);
    // Quick red overlay flash
    ctx.save();
    ctx.fillStyle = "rgba(239,68,68,0.35)";
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  function addStep() {
    const next = Math.floor(Math.random()*4);
    sequence.push(next);
  }

  async function sleep(ms) {
    // Pause-aware sleep
    const step = 20;
    let t = 0;
    while (t < ms) {
      if (paused || gameOver) return;
      await new Promise(r=>setTimeout(r, Math.min(step, ms - t)));
      t += step;
    }
  }

  async function playSequence() {
    playingBack = true;
    const token = ++playbackToken;
    userIndex = 0;
    await sleep(300);
    const {on, gap} = difficultyParams();
    for (let i=0; i<sequence.length; i++) {
      if (token !== playbackToken || paused || gameOver) break;
      const idx = sequence[i];
      setActive(idx);
      beep(pads[idx].freq, on-40, 0.22);
      await sleep(on);
      if (token !== playbackToken || paused || gameOver) break;
      clearActive();
      await sleep(gap);
    }
    playingBack = false;
  }

  async function nextRound() {
    level++;
    addStep();
    await playSequence();
  }

  function startGame() {
    if (running && !paused) return pauseGame();
    if (!running || gameOver) {
      // (re)start fresh
      initAudio();
      running = true; paused = false; gameOver = false;
      btnStart.textContent = "⏸";
      overlay.style.display = "none";
      sequence = []; level = 0; score = 0; scoreEl.textContent = "0";
      nextRound();
    } else {
      // resume
      paused = false;
      btnStart.textContent = "⏸";
      overlay.style.display = "none";
      if (!playingBack) playSequence();
    }
  }

  function pauseGame() {
    paused = true;
    btnStart.textContent = "▶︎";
    showOverlay("Pausa");
  }

  function endGame() {
    running = false; gameOver = true; playingBack = false;
    btnStart.textContent = "▶︎";
    showOverlay("💥 Fallo");
  }

  function showOverlay(msg) {
    statusTxt.textContent = msg;
    overlay.style.display = "grid";
  }

  function onRestart() {
    initAudio();
    running = false; paused = false; gameOver = false; playingBack = false;
    playbackToken++;
    sequence = []; level = 0; score = 0; scoreEl.textContent = "0";
    btnStart.textContent = "▶︎";
    overlay.style.display = "grid";
    statusTxt.textContent = "Empezar";
    clearActive();
  }

  // === Input: mouse/touch/keyboard ===
  function pointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top)  * (canvas.height / rect.height);
    return {x,y};
  }
  canvas.addEventListener("mousedown", e => {
    const {x,y} = pointerPos(e);
    handlePadInput(pickPadIndexFromPoint(x,y));
  });
  canvas.addEventListener("touchstart", e => {
    const t = e.touches[0]; if (!t) return;
    const {x,y} = pointerPos(t);
    handlePadInput(pickPadIndexFromPoint(x,y));
    e.preventDefault();
  }, {passive:false});

  document.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "p") { // pause/resume
      if (!running) startGame(); else startGame(); // toggle via startGame
      e.preventDefault();
      return;
    }
    if (k === "r") { onRestart(); return; }

    // Map keys to pads
    let idx = null;
    if (k === "1" || k === "q" || k === "w") idx = 0;
    if (k === "2" || k === "e" || k === "arrowup") idx = 1; // TR as "up"
    if (k === "3" || k === "a" || k === "arrowleft") idx = 2; // BL as "left"
    if (k === "4" || k === "d" || k === "arrowright" || k === "s" || k === "arrowdown") idx = 3; // BR
    if (idx !== null) handlePadInput(idx);
  });

  // === Wire UI ===
  overlayBtn.addEventListener("click", () => {
    if (gameOver) onRestart();
    startGame();
  });
  btnStart.addEventListener("click", () => startGame());
  btnRestart.addEventListener("click", onRestart);
  diffSel.addEventListener("change", () => {
    // If playing back, restart playback at new speed
    if (running && !paused && !gameOver && playingBack) {
      playbackToken++; playSequence();
    }
  });

  // === Init ===
  bestEl.textContent = localStorage.getItem(HS_KEY) || "0";
  resize();
  window.addEventListener("resize", resize);
  // Start in overlay
  overlay.style.display = "grid";
  statusTxt.textContent = "Empezar";
});
</script>
<!-- === /SIMON GAME === -->
