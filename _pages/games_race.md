---
layout: page
title: "🚗 Carrera infinita"
description: "¡Evita los obstáculos!"
---

<div id="race-game">
  <div class="game-bar">
    <strong>🚦 Carrera infinita</strong>
    <div class="game-scorebox">
      Pasos: <span id="race-score">0</span>
      · Récord: <span id="race-best">0</span>
    </div>
    <div class="game-controls">
      <button id="race-start" class="btn">▶︎/⏸</button>
      <button id="race-restart" class="btn">⟲</button>
    </div>
  </div>

  <div class="game-canvas-wrap">
    <canvas id="race-canvas"></canvas>
    <div class="game-overlay" id="race-overlay">
      <div class="game-overlay-card">
        <div id="race-status-text">Empezar</div>
        <button id="race-overlay-btn" class="btn btn-primary">Jugar</button>
      </div>
    </div>
  </div>

  <p class="game-help">Usa ← → o A D para cambiar de carril. Espacio/P pausa. R reinicia.</p>
</div>

<style>
#race-game {
  max-width: 540px;
  margin: 1rem auto;
  background: #fff;
  padding: .5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
#race-game canvas {
  width: 100%;
  aspect-ratio: 1/1; /* cuadrado */
  background: #111;
  display: block;
  border-radius: 8px;
}
.game-canvas-wrap { position: relative; }
.game-overlay {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,.5);
}
.game-overlay-card {
  background: rgba(0,0,0,.85); color: #fff;
  padding: 1rem; border-radius: 8px; text-align: center;
}
.btn { padding: .25rem .5rem; border: 1px solid #333; background: #eee; cursor: pointer; }
.btn-primary { background: #22c55e; color: #fff; border: none; }
</style>

<script>
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("race-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("race-score");
  const bestEl  = document.getElementById("race-best");
  const btnStart   = document.getElementById("race-start");
  const btnRestart = document.getElementById("race-restart");
  const overlay    = document.getElementById("race-overlay");
  const overlayBtn = document.getElementById("race-overlay-btn");
  const statusTxt  = document.getElementById("race-status-text");
  const HS_KEY = "race.grid.5.corridor.lowdensity";

  // Parámetros
  const LANES = 5;
  const ROWS  = 8;          // filas visibles
  const STEP_MIN = 14;      // tope de aceleración (menor = más rápido)
  const STEP_MAX = 26;      // velocidad inicial (frames por paso)
  const MARGIN  = 1;        // corredor seguro = carril ± MARGIN (≈ 3 carriles libres cuando es posible)

  // ↓↓↓ NUEVO: densidad de obstáculos mucho menor
  const MAX_BLOCKS_PER_ROW = 1;  // máx obstáculos por fila
  const OBSTACLE_RATE      = 0.6; // probabilidad de que haya obstáculo en esa fila (0..1)

  // Estado
  let W, H, cellW, cellH;
  let playerLane = 2;                   // 0..4
  let queue = [];                       // cada fila: array de carriles BLOQUEADOS (rojos)
  let safePath = [];                    // por fila: carril del corredor seguro (0..4)
  let frames = 0, stepEvery = STEP_MAX;
  let running = false, gameOver = false, score = 0;

  // Utils
  const clamp = (x,min,max)=> Math.max(min, Math.min(max, x));
  const randStep = ()=> [ -1, 0, 1 ][Math.floor(Math.random()*3)];

  function resize() {
    const w = Math.floor(canvas.parentElement.offsetWidth);
    canvas.width = w; canvas.height = w; W = w; H = w;
    cellW = W / LANES; cellH = H / ROWS;
  }

  function drawGrid() {
    ctx.fillStyle = "#111"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    for (let i=1;i<LANES;i++){ ctx.beginPath(); ctx.moveTo(i*cellW,0); ctx.lineTo(i*cellW,H); ctx.stroke(); }
    for (let r=1;r<ROWS;r++){ ctx.beginPath(); ctx.moveTo(0,r*cellH); ctx.lineTo(W,r*cellH); ctx.stroke(); }
  }

  function drawPlayer() {
    const cx = playerLane*cellW + cellW/2;
    const cy = (ROWS-1)*cellH + cellH/2;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(cellW,cellH)*0.28, 0, Math.PI*2); ctx.fill();
  }

  function drawQueue() {
    // Obstáculos (bloqueados)
    ctx.fillStyle = "#ef4444";
    for (let row=0; row<queue.length; row++) {
      for (const lane of queue[row]) {
        const x = lane*cellW + cellW*0.18;
        const y = row*cellH + cellH*0.18;
        ctx.fillRect(x, y, cellW*0.64, cellH*0.64);
      }
    }
  }

  function draw() {
    drawGrid();
    drawPlayer();
    drawQueue();
  }

  // Construye fila bloqueada (roja) a partir del carril seguro de esa fila y el margen,
  // pero ahora bloquea SOLO un subconjunto (baja densidad) y a veces ninguno.
  function blockedRowFromSafe(safe) {
    const freeMin = Math.max(0, safe - MARGIN);
    const freeMax = Math.min(LANES-1, safe + MARGIN);

    // Candidatos a bloquear = fuera del corredor
    const candidates = [];
    for (let l=0; l<LANES; l++) {
      if (l < freeMin || l > freeMax) candidates.push(l);
    }

    // Posibilidad de fila sin obstáculos
    if (candidates.length === 0 || Math.random() > OBSTACLE_RATE) {
      return []; // fila limpia
    }

    // Elegir como mucho MAX_BLOCKS_PER_ROW
    const shuffled = candidates.slice().sort(()=>Math.random()-0.5);
    const k = Math.min(MAX_BLOCKS_PER_ROW, candidates.length);
    return shuffled.slice(0, k).sort((a,b)=>a-b);
  }

  function buildInitialQueue() {
    queue = [];
    safePath = new Array(ROWS);

    // El corredor empieza alineado con el jugador en la fila inferior
    safePath[ROWS-1] = playerLane;

    // Hacia arriba (r decrece) variamos a lo sumo ±1 por fila
    for (let r = ROWS-2; r >= 0; r--) {
      const prev = safePath[r+1];
      const candidate = clamp(prev + randStep(), 0, LANES-1);
      safePath[r] = candidate;
    }

    // Construir filas bloqueadas a partir del corredor (con baja densidad)
    for (let r=0; r<ROWS; r++) {
      queue[r] = blockedRowFromSafe(safePath[r]);
    }
  }

  // Avanza una “caída” de fila:
  // 1) Comprueba colisión en la fila inferior con el estado ACTUAL.
  // 2) Desplaza la cola (elimina abajo, aparece arriba).
  // 3) Prepend nueva fila arriba siguiendo la continuidad del corredor ±1.
  function stepLogic() {
    // 1) Colisión
    const bottomBlocked = new Set(queue[ROWS-1] || []);
    if (bottomBlocked.has(playerLane)) { endGame(); return; }

    // 2) Desplazar cola y corredor
    queue.pop();
    const newTopSafe = clamp(safePath[0] + randStep(), 0, LANES-1);
    safePath.pop();
    safePath.unshift(newTopSafe);

    // 3) Nueva fila bloqueada coherente con el corredor (pero baja densidad)
    queue.unshift(blockedRowFromSafe(safePath[0]));

    // Puntuación y dificultad
    score++; scoreEl.textContent = String(score);
    const best = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    if (score > best) { localStorage.setItem(HS_KEY, String(score)); bestEl.textContent = String(score); }
    if (score % 20 === 0 && stepEvery > STEP_MIN) stepEvery--; // acelera muy poco
  }

  function loop() {
    if (running && !gameOver) {
      frames++;
      if (frames % stepEvery === 0) stepLogic();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // Control del juego
  function startRun(){ running = true; btnStart.textContent = "⏸"; overlay.style.display = "none"; }
  function pauseRun(){ running = false; btnStart.textContent = "▶︎"; showOverlay("Pausa"); }
  function toggleRun(){ running ? pauseRun() : startRun(); }
  function endGame(){ running = false; gameOver = true; btnStart.textContent = "▶︎"; showOverlay("💥 Game Over"); }
  function showOverlay(msg){ statusTxt.textContent = msg; overlay.style.display = "grid"; }

  function onRestart() {
    resize();
    frames = 0; stepEvery = STEP_MAX;
    gameOver = false; score = 0; scoreEl.textContent = "0";
    playerLane = 2;         // centro
    buildInitialQueue();    // corredor alineado y garantizado, ahora con menor densidad de obstáculos
    overlay.style.display = "grid"; statusTxt.textContent = "Empezar";
    btnStart.textContent = "▶︎";
  }

  // Controles
  document.addEventListener("keydown", e => {
    if ((e.key === "ArrowLeft" || e.key === "a") && playerLane > 0) playerLane--;
    if ((e.key === "ArrowRight"|| e.key === "d") && playerLane < LANES-1) playerLane++;
    if (e.key === " " || e.key.toLowerCase() === "p") toggleRun();
    if (e.key.toLowerCase() === "r") onRestart();
  });
  overlayBtn.addEventListener("click", ()=>{ gameOver ? onRestart() : startRun(); });
  btnStart.addEventListener("click", toggleRun);
  btnRestart.addEventListener("click", onRestart);

  bestEl.textContent = localStorage.getItem(HS_KEY) || "0";
  requestAnimationFrame(() => { onRestart(); requestAnimationFrame(loop); });
});
</script>
