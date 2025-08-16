---
layout: page
title: "👾 Space Invaders"
permalink: /space/
description: "El clásico juego de los marcianitos"
---

<!-- === SPACE INVADERS — ENRIQUE (v1.0.1 · controles blancos / juego negro) === -->
<div id="invaders-game" class="invaders" tabindex="0" aria-label="Juego Space Invaders">
  <div class="inv-bar">
    <strong>👾 Space Invaders</strong>
    <div class="inv-stats">
      Puntos: <span id="inv-score">0</span> · Vidas: <span id="inv-lives">3</span> · Mejor: <span id="inv-best">0</span>
    </div>
    <div class="inv-controls">
      <button id="inv-start" class="inv-btn" type="button" aria-label="Iniciar / Pausar">▶︎/⏸</button>
      <button id="inv-restart" class="inv-btn" type="button" aria-label="Reiniciar">⟲</button>
      <label class="inv-speed">
        Dificultad
        <select id="inv-diff" aria-label="Dificultad">
          <option value="easy">Fácil</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Difícil</option>
        </select>
      </label>
    </div>
  </div>

  <div class="inv-canvas-wrap">
    <canvas id="inv-canvas"></canvas>

    <!-- Overlay (inicio/pausa/game over) -->
    <div class="inv-overlay" id="inv-overlay" aria-hidden="true">
      <div class="inv-overlay-card">
        <div id="inv-status-text"></div>
        <button id="inv-overlay-btn" type="button" class="inv-btn inv-btn-primary" aria-label="Empezar">Empezar</button>
      </div>
    </div>

    <!-- Controles táctiles -->
    <div class="inv-dpad" aria-label="Controles táctiles" role="group">
      <button class="inv-d" data-act="left"  aria-label="Izquierda">◀</button>
      <button class="inv-d" data-act="fire"  aria-label="Disparar">⦿</button>
      <button class="inv-d" data-act="right" aria-label="Derecha">▶</button>
    </div>
  </div>

  <p class="inv-help">← → para moverte · <kbd>Espacio</kbd> dispara · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia</p>
</div>

<style>
  /* ===== Estilos (aislados bajo #invaders-game) ===== */
  #invaders-game{
    --grid-stroke:rgba(255,255,255,.08);
    --player:#22c55e; /* verde */
    --alien:#38bdf8;  /* cian */
    --ufo:#f59e0b;    /* ámbar */
    --shot:#f43f5e;   /* rojo */

    max-width:min(92vw,540px);
    margin:1rem auto;
    border-radius:12px;
    padding:.75rem;
    outline:none;

    /* CONTROLES SIEMPRE BLANCOS */
    background:#fff; 
    border:1px solid #e5e7eb;
    color:#111;
    box-shadow:0 8px 24px rgba(0,0,0,.06);
  }
  /* Fuerza blanco también con tema oscuro del sitio */
  [data-theme="dark"] #invaders-game{
    background:#fff !important;
    border-color:#e5e7eb !important;
    color:#111 !important;
  }

  #invaders-game .inv-bar{
    display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap;
    margin-bottom:.5rem; font-size:.95rem; position:relative; z-index:2;
    background:#fff; /* barra blanca siempre */
  }
  #invaders-game .inv-stats{ font-variant-numeric:tabular-nums; }
  #invaders-game .inv-controls{ display:flex; align-items:center; gap:.5rem; }
  #invaders-game .inv-btn{
    border:1px solid currentColor; background:transparent; padding:.25rem .5rem; border-radius:8px; cursor:pointer;
    line-height:1; font-size:.95rem; user-select:none; touch-action:manipulation;
  }
  #invaders-game .inv-btn-primary{
    border-color:transparent; background:var(--player); color:#06220f;
  }
  #invaders-game .inv-speed select{
    margin-left:.25rem; padding:.15rem .35rem; border-radius:6px; border:1px solid currentColor; background:#fff; /* select sobre blanco */
    color:#111;
  }

  #invaders-game .inv-canvas-wrap{ position:relative; user-select:none; }

  /* ZONA DE JUEGO SIEMPRE NEGRA */
  #invaders-game canvas{
    width:100%;
    aspect-ratio:4/3; /* formato clásico */
    display:block;
    border-radius:10px;
    background:#000 !important;  /* negro constante */
  }
  [data-theme="dark"] #invaders-game canvas{ background:#000 !important; }

  /* Overlay (sobre el canvas) */
  #invaders-game .inv-overlay{
    position:absolute; inset:0; display:none; place-items:center; backdrop-filter:blur(2px); z-index:999;
  }
  #invaders-game .inv-overlay-card{
    padding:.9rem 1rem; border-radius:10px; min-width:12rem; text-align:center;
    background:rgba(0,0,0,.75); color:#fff; display:flex; flex-direction:column; gap:.5rem;
  }

  /* D-pad táctil */
  #invaders-game .inv-dpad{
    display:none; position:absolute; inset:auto .25rem .25rem .25rem; z-index:5; gap:.4rem; justify-content:center;
  }
  #invaders-game .inv-d{ padding:.4rem .6rem; border-radius:8px; border:1px solid rgba(255,255,255,.35);
    background:rgba(255,255,255,.15); color:#fff; font-size:1rem; touch-action:manipulation; }
  @media (hover:none) and (pointer:coarse){
    #invaders-game .inv-dpad{ display:flex; }
  }

  #invaders-game .inv-help{ margin:.5rem 0 0; font-size:.9rem; color:#4b5563; background:#fff; } /* texto de ayuda sobre blanco */
</style>

<script>
(() => {
  const root = document.getElementById('invaders-game');
  if (!root || root.dataset.invadersInit === "1") return;
  root.dataset.invadersInit = "1";

  const $ = (s,p=root)=>p.querySelector(s);
  const canvas = $('#inv-canvas');
  const ctx = canvas.getContext('2d',{alpha:false});
  const scoreEl = $('#inv-score'), livesEl = $('#inv-lives'), bestEl = $('#inv-best');
  const btnStart = $('#inv-start'), btnRestart = $('#inv-restart'), diffSel = $('#inv-diff');
  const overlay = $('#inv-overlay'), overlayBtn = $('#inv-overlay-btn'), statusTxt = $('#inv-status-text');
  const dpad = root.querySelectorAll('.inv-d');

  // ===== Config. lógica (coordenadas "virtuales" 4:3) =====
  const WU = 200, HU = 150;   // unidades lógicas
  const HS_KEY = 'invaders.highscore.v1';

  // Dificultad base
  const PRESETS = {
    easy:   { playerSpeed: 90, alienTick: 800, enemyFireMin: 1100, enemyFireMax: 2000 },
    normal: { playerSpeed: 110, alienTick: 700, enemyFireMin: 900,  enemyFireMax: 1600 },
    hard:   { playerSpeed: 130, alienTick: 600, enemyFireMin: 700,  enemyFireMax: 1300 }
  };

  // Estado
  let DPR=1, S=1; // escala pantalla
  let running=false, gameOver=false, paused=false;
  let last=performance.now(), acc=0;
  let score=0, lives=3, level=1;
  let player, aliens=[], dir=1, stepDown=false, alienTimer=0, alienTick=PRESETS[diffSel.value].alienTick;
  let pShots=[], eShots=[], canShoot=true, shootCooldown=250, shootTimer=0;
  let enemyFireTimer=0, enemyFireNext=1200;
  let bounds={minX:0, maxX:0, minY:0, maxY:0};

  // ===== Util =====
  function resetClock(){ last=performance.now(); acc=0; }
  function getBest(){ return parseInt(localStorage.getItem(HS_KEY)||'0',10); }
  function setBest(v){ localStorage.setItem(HS_KEY,String(v)); bestEl.textContent=String(v); }
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function resizeCanvas(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const wcss = Math.floor(root.getBoundingClientRect().width) || 200;
    const hcss = Math.floor(wcss*3/4);
    canvas.width = Math.floor(wcss*DPR);
    canvas.height= Math.floor(hcss*DPR);
    // escala a unidades lógicas
    const W = canvas.width / DPR, H = canvas.height / DPR;
    S = Math.min(W/WU, H/HU);
    if (!running) draw(); // refresco
  }
  window.addEventListener('resize', resizeCanvas, {passive:true});

  // ===== Inicialización =====
  function initPlayer(){
    const w=14, h=8;
    player = { x: WU/2 - w/2, y: HU - 14, w, h, speed: PRESETS[diffSel.value].playerSpeed, left:false, right:false, inv:0 };
  }
  function initAliens(){
    aliens.length=0;
    const rows=5, cols=10;
    const aw=10, ah=8;
    const gapX=8, gapY=8;
    const totalW = cols*aw + (cols-1)*gapX;
    const offsetX = Math.floor((WU-totalW)/2);
    const offsetY = 24;
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        aliens.push({x: offsetX + c*(aw+gapX), y: offsetY + r*(ah+gapY), w:aw, h:ah, alive:true});
      }
    }
    dir = 1; stepDown=false;
    alienTimer=0; alienTick = PRESETS[diffSel.value].alienTick * Math.max(.8, 1 - (level-1)*0.08);
    updateBounds();
  }
  function updateBounds(){
    const al = aliens.filter(a=>a.alive);
    bounds.minX = Math.min(...al.map(a=>a.x));
    bounds.maxX = Math.max(...al.map(a=>a.x + a.w));
    bounds.minY = Math.min(...al.map(a=>a.y));
    bounds.maxY = Math.max(...al.map(a=>a.y + a.h));
  }

  function resetGame(){
    const preset = PRESETS[diffSel.value];
    score=0; lives=3; level=1;
    pShots.length=0; eShots.length=0; canShoot=true; shootTimer=0;
    enemyFireTimer=0; enemyFireNext = rand(preset.enemyFireMin, preset.enemyFireMax);
    initPlayer(); initAliens();
    running=false; paused=false; gameOver=false;
    scoreEl.textContent="0"; livesEl.textContent=String(lives);
    bestEl.textContent=String(getBest());
    resetClock();
  }

  // ===== Lógica principal =====
  function loop(t){
    const step = 1000/60; // 60Hz lógicos
    let dt = t - last; last = t; acc += dt;
    acc = Math.min(acc, step*6); // evita catch-up largo
    while (acc >= step){
      if (running && !paused && !gameOver) update(step);
      acc -= step;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt){
    const dts = dt/1000;

    // Player move
    const vx = (player.right?1:0) - (player.left?1:0);
    player.x += vx * player.speed * dts;
    player.x = clamp(player.x, 2, WU - player.w - 2);
    if (player.inv>0) player.inv -= dt;

    // Player shoot (cooldown)
    if (!canShoot){
      shootTimer += dt;
      if (shootTimer >= shootCooldown){ canShoot=true; shootTimer=0; }
    }

    // Shots update
    for (let s of pShots){ s.y -= s.v * dts; }
    for (let s of eShots){ s.y += s.v * dts; }
    // remove offscreen
    pShots = pShots.filter(s=> s.y + s.h > 0);
    eShots = eShots.filter(s=> s.y < HU);

    // Alien movement (tick a saltos)
    alienTimer += dt;
    const alive = aliens.filter(a=>a.alive);
    if (alive.length===0){
      // Next level
      level++; initAliens();
      // aumentar ritmo de disparo enemigo ligeramente
      const p = PRESETS[diffSel.value];
      enemyFireNext = rand(p.enemyFireMin*0.9, p.enemyFireMax*0.9);
    } else if (alienTimer >= alienTick){
      alienTimer = 0;
      // comprobar bordes
      updateBounds();
      const hitLeft = bounds.minX <= 2;
      const hitRight= bounds.maxX >= WU-2;
      if (hitLeft && dir<0 || hitRight && dir>0){ stepDown=true; dir*=-1; }
      for (let a of alive){
        if (stepDown){ a.y += 4; } else { a.x += 2*dir; }
      }
      stepDown=false;
      updateBounds();
      // si llegan al jugador -> perder vida
      if (bounds.maxY >= player.y){
        damagePlayer();
      }
    }

    // Enemy random fire (desde alienes más bajos por columna)
    enemyFireTimer += dt;
    const preset = PRESETS[diffSel.value];
    const alive2 = aliens.filter(a=>a.alive);
    if (enemyFireTimer >= enemyFireNext && alive2.length){
      enemyFireTimer = 0;
      enemyFireNext = rand(preset.enemyFireMin, preset.enemyFireMax) * clamp(alive2.length/40, .4, 1.2);
      const shooters = bottomAliensByColumn();
      if (shooters.length){
        const a = shooters[Math.floor(Math.random()*shooters.length)];
        eShots.push({x:a.x + a.w/2 - 0.8, y:a.y + a.h, w:1.6, h:4, v:90});
      }
    }

    // Collisions: player shots vs aliens
    for (let s of pShots){
      for (let a of aliens){
        if (!a.alive) continue;
        if (intersect(s,a)){
          a.alive=false; s.y = -9999; // marcar fuera
          score += 10; scoreEl.textContent=String(score);
          if (score>getBest()) setBest(score);
          break;
        }
      }
    }
    pShots = pShots.filter(s=> s.y > -900);

    // Collisions: enemy shots vs player
    if (player.inv<=0){
      for (let s of eShots){
        if (intersect(s,player)){ s.y=HU+999; damagePlayer(); break; }
      }
    }
  }

  function damagePlayer(){
    lives--; livesEl.textContent=String(lives);
    player.inv = 1500; // 1.5s invulnerable
    pShots.length=0; eShots.length=0;
    if (lives<=0){ endGame(); }
    else {
      for (let a of aliens){ a.y = Math.max(10, a.y-6); }
    }
  }

  function bottomAliensByColumn(){
    const map = new Map();
    for (let a of aliens){
      if (!a.alive) continue;
      const key = Math.round(a.x/1000)+':'+Math.round(a.x);
      if (!map.has(key) || map.get(key).y < a.y) map.set(key,a);
    }
    return Array.from(map.values());
  }

  function intersect(A,B){
    return A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y;
  }

  // ===== Disparos =====
  function playerShoot(){
    if (!canShoot) return;
    if (pShots.length >= 1) return; // 1 disparo máx simultáneo (clásico)
    const w=1.6,h=4;
    pShots.push({x: player.x + player.w/2 - w/2, y: player.y - h, w, h, v:160});
    canShoot=false; shootTimer=0;
  }

  // ===== Render =====
  function draw(){
    const W = canvas.width / DPR, H = canvas.height / DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);

    // Fondo — toma color del canvas (forzado a negro por CSS)
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#000';
    ctx.fillRect(0,0,W,H);

    // Cuadrícula suave
    ctx.strokeStyle = getCss('--grid-stroke');
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gx = Math.floor(W/20), gy = Math.floor(H/15);
    for (let i=0;i<=20;i++){ ctx.moveTo(i*gx,0); ctx.lineTo(i*gx,H); }
    for (let j=0;j<=15;j++){ ctx.moveTo(0,j*gy); ctx.lineTo(W,j*gy); }
    ctx.stroke();

    // Escala lógica
    ctx.save();
    ctx.translate( (W - WU*S)/2, (H - HU*S)/2 );
    ctx.scale(S,S);

    // Player (parpadeo si invulnerable)
    if (!(player.inv>0 && Math.floor(performance.now()/120)%2===0)){
      ctx.fillStyle = getCss('--player'); drawPlayer(ctx, player);
    }

    // Aliens
    ctx.fillStyle = getCss('--alien');
    for (let a of aliens){ if (a.alive) drawAlien(ctx,a); }

    // Disparos
    ctx.fillStyle = getCss('--shot');
    for (let s of pShots){ ctx.fillRect(s.x, s.y, s.w, s.h); }
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let s of eShots){ ctx.fillRect(s.x, s.y, s.w, s.h); }

    ctx.restore();
  }

  function drawPlayer(ctx,p){
    ctx.beginPath();
    ctx.moveTo(p.x, p.y+p.h);
    ctx.lineTo(p.x+2, p.y+2);
    ctx.lineTo(p.x+p.w-2, p.y+2);
    ctx.lineTo(p.x+p.w, p.y+p.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(p.x + p.w/2 - 1.2, p.y - 2, 2.4, 4);
  }
  function drawAlien(ctx,a){
    const px = 1.2, x=a.x, y=a.y, w=a.w, h=a.h;
    ctx.fillRect(x+px, y, w-2*px, px);
    ctx.fillRect(x, y+px, w, px);
    ctx.fillRect(x, y+2*px, w, px);
    ctx.fillRect(x+px, y+3*px, w-2*px, px);
    ctx.fillRect(x+2*px, y+4*px, w-4*px, px);
    ctx.fillRect(x+px, y+5*px, w-2*px, px);
    ctx.fillRect(x, y+6*px, w, px);
    ctx.fillRect(x+px, y+7*px, w-2*px, px);
  }

  function getCss(name){
    return getComputedStyle(root).getPropertyValue(name).trim() ||
           getComputedStyle(canvas).getPropertyValue(name).trim() || '#fff';
  }

  // ===== Overlay / flujo =====
  function showOverlay(show,text){
    statusTxt.textContent = text || '';
    overlay.style.display = show ? 'grid' : 'none';
    overlay.setAttribute('aria-hidden', show ? 'false':'true');
  }
  function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  function startRun(){
    if (gameOver) return;
    running=true; paused=false; btnStart.textContent='⏸'; hideOverlay(); resetClock();
  }
  function pauseRun(){
    running=false; paused=true; btnStart.textContent='▶︎'; showOverlay(true,'Pausa');
  }
  function toggleRun(e){ if(e){e.preventDefault();e.stopPropagation();} if (gameOver) return; (running && !paused)? pauseRun() : startRun(); }
  function endGame(){ running=false; paused=false; gameOver=true; btnStart.textContent='▶︎'; showOverlay(true,'Game Over'); }

  function onRestart(e){
    if (e){ e.preventDefault(); e.stopPropagation(); }
    resetGame(); resizeCanvas(); draw();
    showOverlay(true,''); // solo botón “Empezar”
  }

  // ===== Controles =====
  document.addEventListener('keydown', (e)=>{
    const k=e.key;
    if (['ArrowLeft','ArrowRight',' ','Spacebar','p','P','r','R'].includes(k)) e.preventDefault();
    if (k==='ArrowLeft'){ player.left=true; }
    if (k==='ArrowRight'){ player.right=true; }
    if (k===' ' || k==='Spacebar'){ playerShoot(); }
    if (k==='p' || k==='P'){ toggleRun(e); }
    if (k==='r' || k==='R'){ onRestart(e); }
  });
  document.addEventListener('keyup', (e)=>{
    if (e.key==='ArrowLeft') player.left=false;
    if (e.key==='ArrowRight') player.right=false;
  });

  function bind(el, handler){
    el.addEventListener('pointerdown', ev=>{ ev.preventDefault(); ev.stopPropagation(); });
    el.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); handler(ev); });
  }
  bind(btnStart, toggleRun);
  bind(btnRestart, onRestart);
  bind(overlayBtn, ()=>{ if (gameOver) onRestart(); else startRun(); });

  overlay.addEventListener('click', (e)=>{ if (e.target===overlay) { if (gameOver) onRestart(e); else startRun(); } });

  // D-pad táctil
  dpad.forEach(b=>{
    b.addEventListener('pointerdown', ev=>{
      ev.preventDefault(); ev.stopPropagation();
      const act = b.dataset.act;
      if (act==='left'){ player.left=true; player.right=false; if(!running) startRun(); }
      if (act==='right'){ player.right=true; player.left=false; if(!running) startRun(); }
      if (act==='fire'){ playerShoot(); if(!running) startRun(); }
    });
    b.addEventListener('pointerup', ()=>{ if (b.dataset.act==='left') player.left=false; if (b.dataset.act==='right') player.right=false; });
    b.addEventListener('pointerleave', ()=>{ if (b.dataset.act==='left') player.left=false; if (b.dataset.act==='right') player.right=false; });
  });

  diffSel.addEventListener('change', ()=>{ /* se aplicará en onRestart */ });

  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // ===== Boot =====
  bestEl.textContent=String(getBest());
  resetGame(); resizeCanvas(); draw();
  showOverlay(true,''); // inicio: solo botón Empezar
  requestAnimationFrame(loop);
})();
</script>
<!-- === /SPACE INVADERS === -->
