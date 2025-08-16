---
layout: page
title: "🌀 Laberinto"
description: "Un generador de laberintos"
---

<!-- === MAZE — ENRIQUE (v1.2 · solo imprime el laberinto) === -->
<div id="maze-game" class="maze" tabindex="0" aria-label="Juego Laberinto">
  <div class="mz-bar">
    <strong>🧩 Laberinto</strong>
    <div class="mz-stats">
      Tiempo: <span id="mz-time">00:00.00</span> · Mejor: <span id="mz-best">—</span>
    </div>
    <div class="mz-controls">
      <button id="mz-start" class="mz-btn" type="button" aria-label="Iniciar / Pausar">▶︎/⏸</button>
      <button id="mz-restart" class="mz-btn" type="button" aria-label="Reiniciar">⟲</button>
      <button id="mz-new" class="mz-btn" type="button" aria-label="Nuevo laberinto">🧪 Nuevo</button>
      <button id="mz-print" class="mz-btn" type="button" aria-label="Imprimir en B/N">🖨️ Imprimir</button>
      <label class="mz-opt">
        Dificultad
        <select id="mz-diff" aria-label="Dificultad">
          <option value="easy">Fácil</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Difícil</option>
          <option value="expert">Experto</option>
          <option value="insane">Extremo</option>
        </select>
      </label>
    </div>
  </div>

  <div class="mz-canvas-wrap">
    <canvas id="mz-canvas"></canvas>

    <!-- Overlay (inicio/pausa/fin) -->
    <div class="mz-overlay" id="mz-overlay" aria-hidden="true">
      <div class="mz-overlay-card">
        <div id="mz-status-text">Listo</div>
        <button id="mz-overlay-btn" type="button" class="mz-btn mz-btn-primary" aria-label="Empezar">Empezar</button>
      </div>
    </div>

    <!-- D-pad móvil -->
    <div class="mz-dpad" aria-label="Controles táctiles" role="group">
      <button class="mz-d" data-dir="up" aria-label="Arriba">▲</button>
      <div class="mz-d-row">
        <button class="mz-d" data-dir="left" aria-label="Izquierda">◀</button>
        <button class="mz-d" data-dir="toggle" aria-label="Pausar/Continuar">⏯</button>
        <button class="mz-d" data-dir="right" aria-label="Derecha">▶</button>
      </div>
      <button class="mz-d" data-dir="down" aria-label="Abajo">▼</button>
    </div>
  </div>

  <p class="mz-help">← ↑ → ↓ / WASD moverte · <kbd>Espacio</kbd>/<kbd>P</kbd> pausa · <kbd>R</kbd> reinicia · <kbd>N</kbd> nuevo · <kbd>Ctrl/Cmd+P</kbd> imprime</p>
</div>

<style>
  /* PÁGINA DE IMPRESIÓN: márgenes mínimos (ajústalo si quieres) */
  @page { margin: 8mm; }

  /* ===== Estilos (aislados bajo #maze-game) ===== */
  #maze-game{
    --wall:#000;   /* paredes negras */
    --player:#222; /* jugador gris oscuro (no se imprime) */
    --start:#666;  /* marcadores (no se imprimen) */
    --exit:#666;

    max-width:min(92vw,540px);
    margin:1rem auto;
    border-radius:12px;
    padding:.75rem;
    outline:none;

    /* panel SIEMPRE blanco */
    background:#fff;
    border:1px solid #e5e7eb;
    color:#111;
    box-shadow:0 8px 24px rgba(0,0,0,.06);
  }
  [data-theme="dark"] #maze-game{
    background:#fff !important; border-color:#e5e7eb !important; color:#111 !important;
  }

  #maze-game .mz-bar{
    display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap;
    margin-bottom:.5rem; font-size:.95rem; position:relative; z-index:2; background:#fff;
  }
  #maze-game .mz-stats{ font-variant-numeric:tabular-nums; }
  #maze-game .mz-controls{ display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  #maze-game .mz-btn{
    border:1px solid currentColor; background:transparent; padding:.25rem .5rem; border-radius:8px; cursor:pointer;
    line-height:1; font-size:.95rem; user-select:none; touch-action:manipulation;
  }
  #maze-game .mz-btn-primary{ border-color:transparent; background:#22c55e; color:#05220e; }
  #maze-game .mz-opt select{
    margin-left:.25rem; padding:.15rem .35rem; border-radius:6px; border:1px solid currentColor; background:#fff; color:#111;
  }

  /* Zona de juego cuadrada y BLANCA (para imprimir) */
  #maze-game .mz-canvas-wrap{ position:relative; user-select:none; width:100%; aspect-ratio:1/1; }
  @supports not (aspect-ratio:1/1){ #maze-game .mz-canvas-wrap{ height:0; padding-top:100%; } }
  #maze-game canvas{
    position:absolute; inset:0; width:100%; height:100%;
    display:block; border-radius:10px; background:#fff !important;
  }
  [data-theme="dark"] #maze-game canvas{ background:#fff !important; }

  /* Overlay */
  #maze-game .mz-overlay{ position:absolute; inset:0; display:none; place-items:center; backdrop-filter:blur(2px); z-index:999; }
  #maze-game .mz-overlay-card{
    padding:.9rem 1rem; border-radius:10px; min-width:12rem; text-align:center;
    background:rgba(0,0,0,.75); color:#fff; display:flex; flex-direction:column; gap:.5rem;
  }

  /* D-pad móvil */
  #maze-game .mz-dpad{ display:none; position:absolute; inset:auto .25rem .25rem auto; z-index:5; }
  #maze-game .mz-d-row{ display:flex; gap:.25rem; justify-content:center; margin:.25rem 0; }
  #maze-game .mz-d{
    padding:.38rem .58rem; border-radius:8px; border:1px solid rgba(0,0,0,.35);
    background:rgba(0,0,0,.08); color:#000; font-size:1rem; touch-action:manipulation;
  }
  @media (hover:none) and (pointer:coarse){
    #maze-game .mz-dpad{ display:flex; flex-direction:column; align-items:center; }
  }

  #maze-game .mz-help{ margin:.5rem 0 0; font-size:.9rem; color:#4b5563; background:#fff; }

  /* ===== SOLO IMPRIMIR EL LABERINTO =====
     - Oculta TODO en la página
     - Muestra únicamente el canvas del laberinto
     - Acomoda el canvas a página entera con bordes rectos
  */
  @media print{
    /* Esconde todo */
    body * { visibility:hidden !important; }

    /* Muestra solo el canvas del laberinto (y sus ancestros directos) */
    #maze-game, #maze-game * { visibility:visible !important; }
    #maze-game .mz-bar,
    #maze-game .mz-help,
    #maze-game .mz-overlay,
    #maze-game .mz-dpad { display:none !important; }

    /* Evita márgenes/estética de panel, ocupa la página */
    #maze-game{
      position:fixed !important; left:0; top:0; right:0; bottom:0;
      margin:0 !important; padding:0 !important; border:none !important; box-shadow:none !important;
      max-width:none !important;
      background:#fff !important;
    }
    #maze-game .mz-canvas-wrap{
      position:fixed !important; left:0; top:0; right:0; bottom:0;
      aspect-ratio:auto;
    }
    #maze-game canvas{
      position:absolute !important; left:0; top:0;
      width:100vw !important; height:100vh !important;
      border-radius:0 !important; background:#fff !important;
    }
  }
</style>

<script>
(() => {
  const root = document.getElementById('maze-game');
  if (!root || root.dataset.mzInit === "1") return;
  root.dataset.mzInit = "1";

  const $ = (s,p=root)=>p.querySelector(s);
  const wrap = $('.mz-canvas-wrap');
  const canvas = $('#mz-canvas');
  const ctx = canvas.getContext('2d',{alpha:false});
  const timeEl = $('#mz-time'), bestEl = $('#mz-best');
  const btnStart = $('#mz-start'), btnRestart = $('#mz-restart'), btnNew = $('#mz-new'), btnPrint = $('#mz-print');
  const diffSel = $('#mz-diff');
  const overlay = $('#mz-overlay'), overlayBtn = $('#mz-overlay-btn'), statusTxt = $('#mz-status-text');

  // ===== Configuración =====
  const HS_KEY = 'maze.best.v1';
  const LEVELS = {
    easy:   { cols: 11, rows: 11 },
    normal: { cols: 17, rows: 17 },
    hard:   { cols: 25, rows: 25 },
    expert: { cols: 35, rows: 35 },
    insane: { cols: 45, rows: 45 }
  };
  const TOP=1, RIGHT=2, BOTTOM=4, LEFT=8;
  const DIRS = [
    {dx:0,dy:-1, wall:TOP,    opp:BOTTOM},
    {dx:1,dy:0,  wall:RIGHT,  opp:LEFT},
    {dx:0,dy:1,  wall:BOTTOM, opp:TOP},
    {dx:-1,dy:0, wall:LEFT,   opp:RIGHT},
  ];

  // ===== Estado =====
  let DPR=1, ts=16, offX=0, offY=0;
  let running=false, paused=false, finished=false;
  let last=performance.now(), timerStart=0, elapsed=0;
  let cols=17, rows=17, cells=[];
  let start={x:0,y:0}, exit={x:0,y:0};
  let cur={cx:0,cy:0}, from={cx:0,cy:0}, moving=false, moveT=0, tgt=null;
  const speed=10;

  // Modo impresión → el render solo dibuja paredes
  let printMode = false;

  // ===== Util =====
  const keyBest = (lvl)=> `${HS_KEY}:${lvl}`;
  function getBest(lvl){ const v = localStorage.getItem(keyBest(lvl)); return v? parseInt(v,10) : null; }
  function setBest(lvl,ms){ localStorage.setItem(keyBest(lvl), String(ms)); }
  function fmt(ms){
    if (ms==null) return '—';
    const s = Math.floor(ms/1000), m = Math.floor(s/60), r = s%60, cs = Math.floor((ms%1000)/10);
    return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
  }
  function getCss(name){
    return getComputedStyle(root).getPropertyValue(name).trim() ||
           getComputedStyle(canvas).getPropertyValue(name).trim() || '#000';
  }

  // ===== Generación (DFS) =====
  function newMaze(){
    const L = LEVELS[diffSel.value] || LEVELS.normal;
    cols = (L.cols%2?L.cols:L.cols+1);
    rows = (L.rows%2?L.rows:L.rows+1);

    cells = Array.from({length:rows},()=> Array.from({length:cols},()=> TOP|RIGHT|BOTTOM|LEFT ));
    const seen = Array.from({length:rows},()=> Array(cols).fill(false));
    const stack = [];
    const sx=0, sy=0;
    seen[sy][sx]=true; stack.push({x:sx,y:sy});
    while (stack.length){
      const c = stack[stack.length-1];
      const neigh=[];
      for (const d of DIRS){
        const nx=c.x+d.dx, ny=c.y+d.dy;
        if (nx>=0&&ny>=0&&nx<cols&&ny<rows && !seen[ny][nx]) neigh.push({nx,ny,d});
      }
      if (!neigh.length){ stack.pop(); continue; }
      const {nx,ny,d} = neigh[Math.floor(Math.random()*neigh.length)];
      cells[c.y][c.x] &= ~d.wall;
      cells[ny][nx]   &= ~d.opp;
      seen[ny][nx]=true; stack.push({x:nx,y:ny});
    }

    start={x:0,y:0}; exit={x:cols-1,y:rows-1};
    cells[start.y][start.x] &= ~LEFT;
    cells[exit.y][exit.x]   &= ~RIGHT;

    cur = {cx:start.x, cy:start.y};
    from = {cx:cur.cx, cy:cur.cy};
    moving=false; moveT=0; tgt=null;
    finished=false; elapsed=0; timerStart=performance.now();

    updateBestLabel();
  }

  // ===== Canvas / escala =====
  function resizeCanvas(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const rect = wrap.getBoundingClientRect();
    const cssSize = Math.floor(Math.max(260, rect.width||260));
    canvas.style.width = cssSize+'px';
    canvas.style.height= cssSize+'px';
    canvas.width  = Math.floor(cssSize * DPR);
    canvas.height = Math.floor(cssSize * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);

    const Wp = canvas.width/DPR, Hp = canvas.height/DPR;
    const size = Math.min(Wp,Hp);
    ts = Math.floor(size / Math.max(cols,rows));
    offX = Math.floor((Wp - cols*ts)/2);
    offY = Math.floor((Hp - rows*ts)/2);

    if (!running) draw();
  }
  window.addEventListener('resize', resizeCanvas, {passive:true});
  if (window.ResizeObserver){ new ResizeObserver(resizeCanvas).observe(wrap); }

  // ===== Cronómetro / loop =====
  function resetClock(){ last=performance.now(); timerStart=last - elapsed; }
  function loop(t){
    const dt = (t - last)/1000; last = t;
    if (running && !paused && !finished){
      elapsed = t - timerStart;
      step(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // ===== Movimiento =====
  let hold = {up:false,down:false,left:false,right:false};
  function canMove(cx,cy,dx,dy){
    const c = cells[cy][cx];
    if (dx===0 && dy===-1) return !(c & TOP);
    if (dx===1  && dy=== 0) return !(c & RIGHT);
    if (dx===0 && dy=== 1) return !(c & BOTTOM);
    if (dx===-1 && dy=== 0) return !(c & LEFT);
    return false;
  }
  function intendMove(dx,dy){
    if (moving || finished || !running || paused) return;
    if (canMove(cur.cx,cur.cy,dx,dy)){
      from = {cx:cur.cx, cy:cur.cy};
      cur = {cx:cur.cx+dx, cy:cur.cy+dy};
      tgt = {dx,dy}; moving=true; moveT=0;
    }
  }
  function step(dt){
    if (moving){
      moveT += (speed * dt);
      if (moveT >= 1){
        moving=false; moveT=1;
        if (cur.cx===exit.x && cur.cy===exit.y){
          finished=true; running=false; paused=false;
          const ms = Math.floor(elapsed);
          const prev = getBest(diffSel.value);
          if (prev==null || ms<prev) setBest(diffSel.value, ms);
          updateBestLabel();
          btnStart.textContent='▶︎';
          setOverlayButton('Empezar');
          showOverlay(true, '¡Salida!');
        } else {
          if      (hold.up)    intendMove(0,-1);
          else if (hold.down)  intendMove(0, 1);
          else if (hold.left)  intendMove(-1,0);
          else if (hold.right) intendMove(1, 0);
        }
      }
    }
    timeEl.textContent = fmt(Math.floor(elapsed));
  }

  // ===== Render =====
  function draw(){
    const Wp = canvas.width/DPR, Hp = canvas.height/DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);

    // Fondo blanco
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,Wp,Hp);

    ctx.save(); ctx.translate(offX,offY);

    // PAREDES (negras). Si printMode=true, solo dibujamos esto.
    ctx.strokeStyle = '#000';
    ctx.lineCap='square';
    ctx.lineWidth = Math.max(2, Math.floor(ts*0.18));
    ctx.beginPath();
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const c = cells[y][x];
        const X = x*ts, Y = y*ts;
        if (c & TOP)    { ctx.moveTo(X, Y); ctx.lineTo(X+ts, Y); }
        if (c & LEFT)   { ctx.moveTo(X, Y); ctx.lineTo(X, Y+ts); }
        if (y===rows-1 && (c & BOTTOM)){ ctx.moveTo(X, Y+ts); ctx.lineTo(X+ts, Y+ts); }
        if (x===cols-1 && (c & RIGHT)) { ctx.moveTo(X+ts, Y); ctx.lineTo(X+ts, Y+ts); }
      }
    }
    ctx.stroke();

    // En pantalla (NO impresión), dibujamos guía de inicio/salida y jugador
    if (!printMode){
      // inicio/salida (discretos)
      ctx.fillStyle = getCss('--start'); dot(start.x,start.y, ts*0.16);
      ctx.fillStyle = getCss('--exit');  dot(exit.x,exit.y,  ts*0.16);

      // jugador
      const px = moving ? lerp(from.cx+0.5, cur.cx+0.5, moveT) : cur.cx+0.5;
      const py = moving ? lerp(from.cy+0.5, cur.cy+0.5, moveT) : cur.cy+0.5;
      ctx.fillStyle = getCss('--player');
      ctx.beginPath(); ctx.arc(px*ts, py*ts, ts*0.22, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
    timeEl.textContent = fmt(Math.floor(elapsed));
  }
  function dot(x,y,r){ ctx.beginPath(); ctx.arc((x+0.5)*ts, (y+0.5)*ts, r, 0, Math.PI*2); ctx.fill(); }
  function lerp(a,b,t){ return a + (b-a)*t; }

  // ===== Overlay / flujo =====
  function setOverlayButton(label){ overlayBtn.textContent=label; overlayBtn.setAttribute('aria-label',label); }
  function showOverlay(show,text){ statusTxt.textContent=text||''; overlay.style.display=show?'grid':'none'; overlay.setAttribute('aria-hidden', show?'false':'true'); }
  function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  function updateBestLabel(){ const v=getBest(diffSel.value); bestEl.textContent = v==null ? '—' : fmt(v); }

  function startRun(){ if (finished) return; running=true; paused=false; btnStart.textContent='⏸'; hideOverlay(); resetClock(); }
  function pauseRun(){ running=false; paused=true; btnStart.textContent='▶︎'; setOverlayButton('Continuar'); showOverlay(true,'Pausa'); }
  function toggleRun(e){ if(e){e.preventDefault();e.stopPropagation();} if (finished) return; (running && !paused)? pauseRun() : startRun(); }
  function onRestart(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    cur = {cx:start.x, cy:start.y};
    from = {cx:cur.cx, cy:cur.cy};
    moving=false; moveT=0; finished=false; elapsed=0; timeEl.textContent=fmt(0);
    btnStart.textContent='▶︎'; setOverlayButton('Empezar'); showOverlay(true,'Listo'); draw();
  }
  function onNew(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    newMaze(); resizeCanvas(); elapsed=0; timeEl.textContent=fmt(0);
    btnStart.textContent='▶︎'; setOverlayButton('Empezar'); showOverlay(true,'Listo'); draw();
  }

  // ===== Entrada =====
  document.addEventListener('keydown', (e)=>{
    const k = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S',' ','Spacebar','p','P','r','R','n','N'].includes(k)) e.preventDefault();
    if (k==='p'||k==='P'||k===' '||k==='Spacebar'){ toggleRun(e); return; }
    if (k==='r'||k==='R'){ onRestart(e); return; }
    if (k==='n'||k==='N'){ onNew(e); return; }

    if (k==='ArrowUp' || k==='w' || k==='W'){ hold.up=true; intendMove(0,-1); }
    if (k==='ArrowDown' || k==='s' || k==='S'){ hold.down=true; intendMove(0, 1); }
    if (k==='ArrowLeft' || k==='a' || k==='A'){ hold.left=true; intendMove(-1,0); }
    if (k==='ArrowRight'|| k==='d' || k==='D'){ hold.right=true; intendMove(1, 0); }
    if (!running && !finished && (hold.up||hold.down||hold.left||hold.right)) startRun();
  });
  document.addEventListener('keyup', (e)=>{
    if (e.key==='ArrowUp' || e.key==='w' || e.key==='W') hold.up=false;
    if (e.key==='ArrowDown'|| e.key==='s' || e.key==='S') hold.down=false;
    if (e.key==='ArrowLeft'|| e.key==='a' || e.key==='A') hold.left=false;
    if (e.key==='ArrowRight'|| e.key==='d' || e.key==='D') hold.right=false;
  });

  // D-pad móvil
  root.querySelectorAll('.mz-d').forEach(b=>{
    const d=b.dataset.dir;
    b.addEventListener('click', ev=>{
      ev.preventDefault(); ev.stopPropagation();
      if (d==='toggle'){ toggleRun(ev); return; }
      if (d==='up') intendMove(0,-1);
      if (d==='down') intendMove(0, 1);
      if (d==='left') intendMove(-1,0);
      if (d==='right') intendMove(1, 0);
      if (!running && !finished) startRun();
    });
  });

  // Botones
  function bind(el, handler){
    el.addEventListener('pointerdown', ev=>{ ev.preventDefault(); ev.stopPropagation(); });
    el.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); handler(ev); });
  }
  bind(btnStart, toggleRun);
  bind(btnRestart, onRestart);
  bind(btnNew, onNew);
  bind(btnPrint, ()=>{
    const prev = printMode; printMode = true; draw();
    setTimeout(()=>{ window.print(); setTimeout(()=>{ printMode = prev; draw(); }, 200); }, 0);
  });
  bind(overlayBtn, ()=>{ if (finished){ onNew(); } else { startRun(); } });

  // Eventos del navegador al imprimir
  window.addEventListener('beforeprint', ()=>{ printMode=true; draw(); });
  window.addEventListener('afterprint',  ()=>{ printMode=false; draw(); });

  // Pausa por visibilidad
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // Dificultad → afecta al siguiente “Nuevo”
  diffSel.addEventListener('change', ()=>{ updateBestLabel(); });

  // ===== Boot =====
  function updateBestLabel(){ const v=getBest(diffSel.value); bestEl.textContent = v==null ? '—' : fmt(v); }
  newMaze(); resizeCanvas(); draw();
  updateBestLabel();
  timeEl.textContent = fmt(0);
  setOverlayButton('Empezar'); showOverlay(true,'Listo');
  requestAnimationFrame(loop);

})();
</script>
<!-- === /MAZE (solo imprime el laberinto) === -->
