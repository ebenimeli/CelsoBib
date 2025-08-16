---
layout: page
title: "🐍 Snake"
permalink: /snake/
description: "El clásico juego de la serpiente"
---

<!-- === SNAKE GAME — ENRIQUE (v1.5.1, botón dinámico Empezar/Continuar) === -->
<div id="snake-game" class="snake" tabindex="0" aria-label="Juego Snake">
  <div class="snake-bar">
    <strong>🐍 Snake</strong>
    <div class="snake-scorebox">
      Puntos: <span id="snake-score">0</span>
      · Mejor: <span id="snake-best">0</span>
    </div>
    <div class="snake-controls">
      <button id="snake-start" class="snk-btn" type="button" aria-label="Iniciar / Pausar">▶︎/⏸</button>
      <button id="snake-restart" class="snk-btn" type="button" aria-label="Reiniciar">⟲</button>
      <label class="snk-speed">
        Velocidad
        <select id="snake-speed" aria-label="Velocidad">
          <option value="8">Tranquila</option>
          <option value="12" selected>Normal</option>
          <option value="18">Rápida</option>
          <option value="24">Pro</option>
        </select>
      </label>
    </div>
  </div>

  <div class="snake-canvas-wrap">
    <canvas id="snake-canvas"></canvas>

    <!-- Overlay (inicio/pausa/game over) -->
    <div class="snake-overlay" id="snake-overlay" aria-hidden="true">
      <div class="snake-overlay-card">
        <div id="snake-status-text">Listo</div>
        <button id="snake-overlay-btn" type="button" class="snk-btn snk-btn-primary" aria-label="Empezar">Empezar</button>
      </div>
    </div>

    <!-- D-pad para móviles -->
    <div class="snake-dpad" aria-label="Controles táctiles" role="group">
      <button class="snk-d" data-dir="up" aria-label="Arriba">▲</button>
      <div class="snake-dpad-row">
        <button class="snk-d" data-dir="left" aria-label="Izquierda">◀</button>
        <button class="snk-d" data-dir="right" aria-label="Derecha">▶</button>
      </div>
      <button class="snk-d" data-dir="down" aria-label="Abajo">▼</button>
    </div>
  </div>

  <p class="snake-help">← ↑ → ↓ / WASD. <kbd>P</kbd> o <kbd>Espacio</kbd> pausa. <kbd>R</kbd> reinicia.</p>
</div>

<style>
  /* ===== Estilos (aislados bajo #snake-game) ===== */
  #snake-game {
    --panel-bg-light: #ffffff;
    --panel-bg-dark: #0b0d10;
    --panel-brd-light: #e5e7eb;
    --panel-brd-dark: #1f2937;

    --canvas-bg-light: #0f172a;
    --canvas-bg-dark:  #0b1020;
    --grid-stroke: rgba(255,255,255,.06);
    --snake-color: #22c55e;
    --food-color:  #f43f5e;
    --text-dim: #6b7280;

    max-width: min(92vw, 540px);
    margin: 1rem auto;
    border-radius: 12px;
    padding: .75rem;
    outline: none;
    border: 1px solid var(--panel-brd-light);
    background: var(--panel-bg-light);
    box-shadow: 0 8px 24px rgba(0,0,0,.06);
  }
  [data-theme="dark"] #snake-game {
    border-color: var(--panel-brd-dark);
    background: var(--panel-bg-dark);
    box-shadow: 0 8px 24px rgba(0,0,0,.35);
  }

  #snake-game .snake-bar{
    display:flex; align-items:center; gap:.5rem; justify-content:space-between; flex-wrap:wrap;
    margin-bottom:.5rem; font-size:.95rem; position:relative; z-index: 2000;
  }
  #snake-game .snake-scorebox{ font-variant-numeric: tabular-nums; }
  #snake-game .snake-controls{ display:flex; align-items:center; gap:.5rem; }
  #snake-game .snk-btn{
    border:1px solid currentColor; background:transparent; padding:.25rem .5rem; border-radius:8px; cursor:pointer;
    line-height:1; font-size:.95rem; pointer-events:auto; user-select:none; touch-action:manipulation;
  }
  #snake-game .snk-btn-primary{
    border-color: transparent; background: var(--snake-color); color: #04130a;
  }
  #snake-game .snk-speed select{
    margin-left:.25rem; padding:.15rem .35rem; border-radius:6px; border:1px solid currentColor; background:transparent;
  }

  #snake-game .snake-canvas-wrap{
    position: relative; user-select:none;
  }
  #snake-game canvas{
    width: 100%;
    aspect-ratio: 1 / 1;        /* cuadrado responsivo */
    display:block;
    border-radius: 10px;
    background: var(--canvas-bg-light);
  }
  [data-theme="dark"] #snake-game canvas{ background: var(--canvas-bg-dark); }

  /* Overlay SOLO sobre el canvas */
  #snake-game .snake-overlay{
    position:absolute; inset:0; display:none; place-items:center; backdrop-filter: blur(2px);
    z-index: 999;
  }
  #snake-game .snake-overlay-card{
    padding: .85rem 1rem; border-radius: 10px;
    background: rgba(0,0,0,.65); color:#fff; text-align:center; min-width: 12rem;
    display:flex; flex-direction:column; gap:.5rem;
  }

  /* D-pad: solo en pantallas táctiles */
  #snake-game .snake-dpad{ display:none; position:absolute; inset:auto .25rem .25rem auto; z-index:5; }
  #snake-game .snake-dpad-row{ display:flex; gap:.25rem; justify-content:center; }
  #snake-game .snk-d{
    padding:.35rem .55rem; border-radius:8px; border:1px solid rgba(255,255,255,.35);
    background: rgba(255,255,255,.15); color:#fff; font-size:1rem; touch-action:manipulation;
  }
  @media (hover:none) and (pointer:coarse){
    #snake-game .snake-dpad{ display:flex; flex-direction:column; gap:.25rem; }
  }

  #snake-game .snake-help{
    margin:.5rem 0 0; font-size:.9rem; color: var(--text-dim);
  }
</style>

<script>
(() => {
  const root = document.getElementById('snake-game');
  if (!root || root.dataset.snakeInit === "1") return; // evita doble init
  root.dataset.snakeInit = "1";

  const $ = (sel, parent=root) => parent.querySelector(sel);
  const canvas = $('#snake-canvas');
  const ctx    = canvas.getContext('2d', { alpha: false });
  const scoreEl= $('#snake-score');
  const bestEl = $('#snake-best');
  const btnStart   = $('#snake-start');
  const btnRestart = $('#snake-restart');
  const speedSel   = $('#snake-speed');
  const overlay    = $('#snake-overlay');
  const overlayBtn = $('#snake-overlay-btn');
  const statusTxt  = $('#snake-status-text');
  const dpadBtns   = root.querySelectorAll('.snk-d');

  // ===== Parámetros / estado
  const GRID = 21;
  const HS_KEY = 'snake.highscore.v1';
  let FPS = parseInt(speedSel.value,10) || 12;

  let snake, dir, nextDir, food, score, running, gameOver;
  let last = performance.now(), acc = 0, DPR = 1;

  // ===== Utilidades
  function resetClock(){ last = performance.now(); acc = 0; }
  function getBest(){ return parseInt(localStorage.getItem(HS_KEY)||'0',10); }
  function setBest(v){ localStorage.setItem(HS_KEY, String(v)); bestEl.textContent = String(v); }
  function cssVar(name, el=root){
    return getComputedStyle(el).getPropertyValue(name).trim() ||
           getComputedStyle(canvas).getPropertyValue(name).trim() || '#fff';
  }
  function setOverlayButton(label){
    overlayBtn.textContent = label;
    overlayBtn.setAttribute('aria-label', label);
  }

  // ===== Canvas
  function resizeCanvas(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(root.getBoundingClientRect().width) || 150;
    const css = Math.max(150, w);
    canvas.width  = Math.floor(css * DPR);
    canvas.height = Math.floor(css * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    if (snake && food) draw();
  }
  window.addEventListener('resize', resizeCanvas, { passive:true });

  // ===== Juego
  function resetGame(){
    const mid = Math.floor(GRID/2);
    snake = [{x:mid, y:mid}, {x:mid-1, y:mid}, {x:mid-2, y:mid}];
    dir = {x:1,y:0}; nextDir = {...dir};
    score = 0; running = false; gameOver = false;
    scoreEl.textContent = '0';
    setFood(); resetClock();
  }
  function setFood(){
    let x,y, clash;
    do {
      x = Math.floor(Math.random()*GRID);
      y = Math.floor(Math.random()*GRID);
      clash = snake.some(s => s.x===x && s.y===y);
    } while (clash);
    food = {x,y};
  }

  function loop(t){
    const step = 1000 / FPS;
    const dt = t - last; last = t; acc += dt;
    acc = Math.min(acc, step * 4); // sin catch-up loco

    if (running && !gameOver){
      while (acc >= step){ update(); acc -= step; }
    }
    draw();
    requestAnimationFrame(loop);
  }

  function update(){
    // no reversa instantánea si longitud > 1
    if (snake.length > 1 && nextDir.x === -dir.x && nextDir.y === -dir.y){
      /* ignorar reversa */ 
    } else {
      dir = nextDir;
    }
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // colisiones
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID){ endGame(); return; }
    if (snake.some((s,i)=> i>0 && s.x===head.x && s.y===head.y)){ endGame(); return; }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y){
      score++; scoreEl.textContent = String(score);
      if (score > getBest()) setBest(score);
      setFood();
      if (score % 5 === 0) FPS = Math.min(28, FPS + 1);
    } else {
      snake.pop();
    }
  }

  function draw(){
    if (!snake || !food) return;
    const W = canvas.width / DPR, H = canvas.height / DPR;
    const cell = Math.floor(Math.min(W,H) / GRID);
    if (cell <= 0) return;
    const offX = Math.floor((W - cell*GRID)/2);
    const offY = Math.floor((H - cell*GRID)/2);

    // fondo
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#000';
    ctx.fillRect(0,0,W,H);

    // grid suave
    ctx.strokeStyle = cssVar('--grid-stroke');
    ctx.lineWidth = 1; ctx.beginPath();
    for (let i=0;i<=GRID;i++){
      const x = offX + i*cell, y = offY + i*cell;
      ctx.moveTo(offX, y); ctx.lineTo(offX + GRID*cell, y);
      ctx.moveTo(x, offY); ctx.lineTo(x, offY + GRID*cell);
    }
    ctx.stroke();

    // comida
    drawCell(food.x, food.y, offX, offY, cell, cssVar('--food-color'), true);

    // serpiente
    for (let i=snake.length-1;i>=0;i--){
      drawCell(snake[i].x, snake[i].y, offX, offY, cell, cssVar('--snake-color'), false, i===0);
    }
  }

  function drawCell(cx, cy, offX, offY, size, color, circle=false, head=false){
    const x = offX + cx*size, y = offY + cy*size, pad = Math.max(2, Math.floor(size*0.12));
    ctx.fillStyle = color;
    if (circle){
      const r = (size - pad*2)/2;
      ctx.beginPath(); ctx.arc(x+size/2, y+size/2, r, 0, Math.PI*2); ctx.fill();
    } else {
      const r = Math.max(3, Math.floor(size*0.2));
      ctx.beginPath();
      ctx.moveTo(x+pad+r, y+pad);
      ctx.arcTo(x+size-pad, y+pad, x+size-pad, y+size-pad, r);
      ctx.arcTo(x+size-pad, y+size-pad, x+pad, y+size-pad, r);
      ctx.arcTo(x+pad, y+size-pad, x+pad, y+pad, r);
      ctx.arcTo(x+pad, y+pad, x+size-pad, y+pad, r);
      ctx.fill();
      if (head && size >= 14){
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        const ex = x + size/2 + (dir.x*size*0.15), ey = y + size/2 + (dir.y*size*0.15);
        ctx.beginPath(); ctx.arc(ex-3, ey-3, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex+3, ey+3, 1.5, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // ===== Overlay
  function showOverlay(show, text){
    statusTxt.textContent = text || '';
    overlay.style.display = show ? 'grid' : 'none';
    overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
  }
  function hideOverlay(){ overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); }

  function continueGame(e){
    if (e){ e.preventDefault(); e.stopPropagation(); }
    if (gameOver){ onRestart(); return; }
    hideOverlay(); startRun();
  }

  // ===== Controles (teclado/táctil/botones)
  function setDir(x,y){ nextDir = {x,y}; }

  function onKey(e){
    const k = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Spacebar','p','P','w','W','a','A','s','S','d','D','r','R'].includes(k)) e.preventDefault();
    if (k==='p' || k==='P' || k===' ' || k==='Spacebar'){ toggleRun(); return; }
    if (k==='r' || k==='R'){ onRestart(e); return; }
    if (k==='ArrowUp' || k==='w' || k==='W')     setDir(0,-1);
    if (k==='ArrowDown' || k==='s' || k==='S')   setDir(0, 1);
    if (k==='ArrowLeft' || k==='a' || k==='A')   setDir(-1,0);
    if (k==='ArrowRight' || k==='d' || k==='D')  setDir(1, 0);
    if (!running && !gameOver) startRun();
  }
  document.addEventListener('keydown', onKey);

  // Botones: usar pointerdown + click por compatibilidad
  function bindButton(el, handler){
    el.addEventListener('pointerdown', (e)=>{ e.preventDefault(); e.stopPropagation(); }, {passive:false});
    el.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); handler(e); });
  }
  bindButton(btnStart, toggleRun);
  bindButton(btnRestart, onRestart);
  bindButton(overlayBtn, continueGame);

  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) continueGame(e); });

  // D-pad
  dpadBtns.forEach(b=>{
    b.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const d = b.dataset.dir;
      if (d==='up') setDir(0,-1);
      if (d==='down') setDir(0, 1);
      if (d==='left') setDir(-1,0);
      if (d==='right') setDir(1, 0);
      if (!running && !gameOver) startRun();
    });
  });

  // Gestos
  let t0=null;
  canvas.addEventListener('touchstart', (e)=>{ if (!e.touches[0]) return; t0={x:e.touches[0].clientX,y:e.touches[0].clientY}; }, {passive:true});
  canvas.addEventListener('touchmove',  (e)=>{
    if (!t0 || !e.touches[0]) return;
    const dx = e.touches[0].clientX - t0.x, dy = e.touches[0].clientY - t0.y;
    if (Math.max(Math.abs(dx),Math.abs(dy)) < 18) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir(Math.sign(dx), 0); else setDir(0, Math.sign(dy));
    t0 = null;
    if (!running && !gameOver) startRun();
  }, {passive:true});

  // Visibilidad
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // ===== Ciclo de vida
  function startRun(){
    if (gameOver) return;
    running = true; btnStart.textContent = '⏸'; hideOverlay(); resetClock();
  }
  function pauseRun(){
    running = false; btnStart.textContent = '▶︎';
    setOverlayButton('Continuar');          // ← aquí cambiamos el botón
    showOverlay(true, 'Pausa');
  }
  function toggleRun(e){
    if (e){ e.preventDefault(); e.stopPropagation(); }
    if (gameOver) return;
    running ? pauseRun() : startRun();
  }
  function endGame(){
    running = false; gameOver = true; btnStart.textContent = '▶︎';
    setOverlayButton('Empezar');            // tras Game Over, ofrecer empezar
    showOverlay(true, 'Game Over');
  }

  function onRestart(e){
    if (e){ e.preventDefault(); e.stopPropagation(); }
    FPS = parseInt(speedSel.value,10) || 12;
    resetGame(); resizeCanvas(); draw();
    setOverlayButton('Empezar');            // inicio → Empezar
    showOverlay(true, 'Listo');
  }

  // ===== Boot
  bestEl.textContent = String(getBest());
  resetGame(); resizeCanvas(); draw();
  setOverlayButton('Empezar');              // inicio → Empezar
  showOverlay(true, 'Listo');
  requestAnimationFrame(loop);
})();
</script>
<!-- === /SNAKE GAME === -->
