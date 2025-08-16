---
layout: page
title: "🌀 Laberinto"
description: "Un generador de laberintos"
---

<!-- === MAZE — ENRIQUE (v1.9 · bifurcaciones + poda de atajos + rastro + sin 2×2 + solución BFS + imprime) === -->
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
      <button id="mz-solve" class="mz-btn" type="button" aria-label="Mostrar solución">✅ Solución</button>
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
  @page { margin: 8mm; }

  #maze-game{
    --wall:#000;
    --player:#222;
    --start:#666;
    --exit:#666;
    --solution:#16a34a; /* verde solución */
    --trail:#2563eb;    /* azul rastro */

    max-width:min(92vw,540px);
    margin:1rem auto;
    border-radius:12px;
    padding:.75rem;
    outline:none;
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

  #maze-game .mz-canvas-wrap{ position:relative; user-select:none; width:100%; aspect-ratio:1/1; }
  @supports not (aspect-ratio:1/1){ #maze-game .mz-canvas-wrap{ height:0; padding-top:100%; } }
  #maze-game canvas{
    position:absolute; inset:0; width:100%; height:100%;
    display:block; border-radius:10px; background:#fff !important;
  }
  [data-theme="dark"] #maze-game canvas{ background:#fff !important; }

  #maze-game .mz-overlay{ position:absolute; inset:0; display:none; place-items:center; backdrop-filter:blur(2px); z-index:999; }
  #maze-game .mz-overlay-card{
    padding:.9rem 1rem; border-radius:10px; min-width:12rem; text-align:center;
    background:rgba(0,0,0,.75); color:#fff; display:flex; flex-direction:column; gap:.5rem;
  }

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

  @media print{
    body * { visibility:hidden !important; }
    #maze-game, #maze-game * { visibility:visible !important; }
    #maze-game .mz-bar,
    #maze-game .mz-help,
    #maze-game .mz-overlay,
    #maze-game .mz-dpad { display:none !important; }
    #maze-game{
      position:fixed !important; left:0; top:0; right:0; bottom:0;
      margin:0 !important; padding:0 !important; border:none !important; box-shadow:none !important;
      max-width:none !important; background:#fff !important;
    }
    #maze-game .mz-canvas-wrap{ position:fixed !important; left:0; top:0; right:0; bottom:0; aspect-ratio:auto; }
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
  const btnStart = $('#mz-start'), btnRestart = $('#mz-restart'), btnNew = $('#mz-new'), btnPrint = $('#mz-print'), btnSolve = $('#mz-solve');
  const diffSel = $('#mz-diff');
  const overlay = $('#mz-overlay'), overlayBtn = $('#mz-overlay-btn'), statusTxt = $('#mz-status-text');

  // ===== Config =====
  const HS_KEY = 'maze.best.v1';
  const LEVELS = {
    easy:   { cols: 11, rows: 11 },
    normal: { cols: 17, rows: 17 },
    hard:   { cols: 25, rows: 25 },
    expert: { cols: 35, rows: 35 },
    insane: { cols: 45, rows: 45 }
  };
  // Aperturas adicionales (más bucles)
  const EXTRA = {
    easy:   { ratio: 0.14 },
    normal: { ratio: 0.20 },
    hard:   { ratio: 0.26 },
    expert: { ratio: 0.32 },
    insane: { ratio: 0.38 }
  };
  // Poda (cerrar parte de esas aperturas para crear más callejones y eliminar atajos)
  const PRUNE = {
    easy:   { ratio: 0.30 },
    normal: { ratio: 0.45 },
    hard:   { ratio: 0.55 },
    expert: { ratio: 0.62 },
    insane: { ratio: 0.70 }
  };

  const TOP=1, RIGHT=2, BOTTOM=4, LEFT=8;

  // ===== Estado =====
  let DPR=1, ts=16, offX=0, offY=0;
  let running=false, paused=false, finished=false;
  let last=performance.now(), timerStart=0, elapsed=0;
  let cols=17, rows=17, cells=[];
  let start={x:0,y:0}, exit={x:0,y:0};
  let cur={cx:0,cy:0}, from={cx:0,cy:0}, moving=false, moveT=0, tgt=null;
  const speed=10;

  // Solución
  let solutionPath = [];   // [{x,y}, ...]
  let showSolution = false;

  // Rastro
  let userTrail = [];      // [{x,y}, ...]

  // Modo impresión
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
  function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

  // --- abrir/cerrar pared entre vecinos ortogonales ---
  function carveBetween(x1,y1,x2,y2){
    if (x2===x1 && y2===y1-1){ cells[y1][x1] &= ~TOP;    cells[y2][x2] &= ~BOTTOM; }
    else if (x2===x1+1 && y2===y1){ cells[y1][x1] &= ~RIGHT;  cells[y2][x2] &= ~LEFT; }
    else if (x2===x1 && y2===y1+1){ cells[y1][x1] &= ~BOTTOM; cells[y2][x2] &= ~TOP; }
    else if (x2===x1-1 && y2===y1){ cells[y1][x1] &= ~LEFT;   cells[y2][x2] &= ~RIGHT; }
  }
  function closeBetween(x1,y1,x2,y2){
    if (x2===x1 && y2===y1-1){ cells[y1][x1] |= TOP;    cells[y2][x2] |= BOTTOM; }
    else if (x2===x1+1 && y2===y1){ cells[y1][x1] |= RIGHT;  cells[y2][x2] |= LEFT; }
    else if (x2===x1 && y2===y1+1){ cells[y1][x1] |= BOTTOM; cells[y2][x2] |= TOP; }
    else if (x2===x1-1 && y2===y1){ cells[y1][x1] |= LEFT;   cells[y2][x2] |= RIGHT; }
  }
  function isOpenBetween(x1,y1,x2,y2){
    if (x2===x1+1 && y2===y1)   return !(cells[y1][x1] & RIGHT);
    if (x2===x1-1 && y2===y1)   return !(cells[y1][x1] & LEFT);
    if (x2===x1 && y2===y1+1)   return !(cells[y1][x1] & BOTTOM);
    if (x2===x1 && y2===y1-1)   return !(cells[y1][x1] & TOP);
    return false;
  }
  function neighborList(x,y){
    const list = [];
    if (y>0) list.push({x:x, y:y-1});
    if (x<cols-1) list.push({x:x+1, y:y});
    if (y<rows-1) list.push({x:x, y:y+1});
    if (x>0) list.push({x:x-1, y:y});
    return list;
  }

  // --- Evitar crear un ciclo abierto 2×2 con la próxima apertura ---
  function wouldCreate2x2OpenSquare(x1,y1,x2,y2){
    // Horizontal
    if (y1===y2 && Math.abs(x1-x2)===1){
      const x = Math.min(x1,x2), y = y1;
      if (y-1>=0){
        const A={x:x,y:y-1}, B={x:x+1,y:y-1}, C={x:x,y:y}, D={x:x+1,y:y};
        if (isOpenBetween(A.x,A.y,B.x,B.y) && isOpenBetween(A.x,A.y,C.x,C.y) && isOpenBetween(B.x,B.y,D.x,D.y)) return true;
      }
      if (y+1<rows){
        const A={x:x,y:y}, B={x:x+1,y:y}, C={x:x,y:y+1}, D={x:x+1,y:y+1};
        if (isOpenBetween(B.x,B.y,D.x,D.y) && isOpenBetween(C.x,C.y,D.x,D.y) && isOpenBetween(A.x,A.y,C.x,C.y)) return true;
      }
    }
    // Vertical
    if (x1===x2 && Math.abs(y1-y2)===1){
      const y = Math.min(y1,y2), x = x1;
      if (x-1>=0){
        const A={x:x-1,y:y}, B={x:x,y:y}, C={x:x-1,y:y+1}, D={x:x,y:y+1};
        if (isOpenBetween(A.x,A.y,B.x,B.y) && isOpenBetween(A.x,A.y,C.x,C.y) && isOpenBetween(C.x,C.y,D.x,D.y)) return true;
      }
      if (x+1<cols){
        const A={x:x,y:y}, B={x:x+1,y:y}, C={x:x,y:y+1}, D={x:x+1,y:y+1};
        if (isOpenBetween(A.x,A.y,B.x,B.y) && isOpenBetween(B.x,B.y,D.x,D.y) && isOpenBetween(C.x,C.y,D.x,D.y)) return true;
      }
    }
    return false;
  }

  // ===== Generación: DFS que visita TODAS las celdas (árbol) =====
  function generatePerfectMaze(){
    cells = Array.from({length:rows},()=> Array.from({length:cols},()=> TOP|RIGHT|BOTTOM|LEFT ));
    const visited = Array.from({length:rows},()=> Array(cols).fill(false));

    const stack = [{x:start.x, y:start.y}];
    visited[start.y][start.x] = true;

    while (stack.length){
      const node = stack[stack.length-1];
      let neigh = neighborList(node.x, node.y).filter(n => !visited[n.y][n.x]);
      // mantener filtro anti 2×2 por estética (no es estrictamente necesario en un árbol)
      neigh = neigh.filter(n => !wouldCreate2x2OpenSquare(node.x, node.y, n.x, n.y));
      if (!neigh.length){ stack.pop(); continue; }
      shuffle(neigh);
      const nxt = neigh[0];
      carveBetween(node.x,node.y, nxt.x,nxt.y);
      visited[nxt.y][nxt.x] = true;
      stack.push({x:nxt.x, y:nxt.y});
    }
  }

  // ===== Aperturas extra: añade bifurcaciones sin crear 2×2 =====
  function addExtraOpenings(){
    const ratio = (EXTRA[diffSel.value] || EXTRA.normal).ratio;
    const extraEdges = [];

    // Candidatas = paredes internas cerradas entre celdas vecinas
    const candidates = [];
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        if (x+1<cols && !isOpenBetween(x,y,x+1,y) && !wouldCreate2x2OpenSquare(x,y,x+1,y))
          candidates.push({x1:x,y1:y,x2:x+1,y2:y});
        if (y+1<rows && !isOpenBetween(x,y,x,y+1) && !wouldCreate2x2OpenSquare(x,y,x,y+1))
          candidates.push({x1:x,y1:y,x2:x,y2:y+1});
      }
    }

    shuffle(candidates);
    const target = Math.floor(candidates.length * ratio);
    let opened = 0;

    for (let i=0;i<candidates.length && opened<target;i++){
      const w = candidates[i];
      // revalida estado actual
      if (!isOpenBetween(w.x1,w.y1,w.x2,w.y2) && !wouldCreate2x2OpenSquare(w.x1,w.y1,w.x2,w.y2)){
        carveBetween(w.x1,w.y1,w.x2,w.y2);
        extraEdges.push(w);
        opened++;
      }
    }
    return extraEdges;
  }

  // ===== BFS camino más corto (no toca estado global salvo que se solicite) =====
  function bfsShortestPath(){
    const prev = Array.from({length:rows},()=> Array(cols).fill(null));
    const seen = Array.from({length:rows},()=> Array(cols).fill(false));
    const q = [{x:start.x,y:start.y}];
    seen[start.y][start.x] = true;
    const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

    while (q.length){
      const {x,y} = q.shift();
      if (x===exit.x && y===exit.y) break;
      for (const [dx,dy] of DIRS){
        const nx=x+dx, ny=y+dy;
        if (nx<0||ny<0||nx>=cols||ny>=rows) continue;
        if (!seen[ny][nx] && isOpenBetween(x,y,nx,ny)){
          seen[ny][nx]=true;
          prev[ny][nx]={x,y};
          q.push({x:nx,y:ny});
        }
      }
    }
    const path=[];
    if (!prev[exit.y][exit.x] && !(exit.x===start.x && exit.y===start.y)){
      return {path:[], len:Infinity};
    }
    let cx=exit.x, cy=exit.y;
    path.push({x:cx,y:cy});
    while (!(cx===start.x && cy===start.y)){
      const p = prev[cy][cx];
      cx=p.x; cy=p.y;
      path.push({x:cx,y:cy});
    }
    path.reverse();
    return {path, len:path.length};
  }
  function computeShortestSolution(){
    const {path} = bfsShortestPath();
    solutionPath = path;
  }

  // ===== Poda de atajos: cerrar parte de las aperturas extra si no rompen conectividad =====
  function pruneExtraOpenings(extraEdges){
    const ratio = (PRUNE[diffSel.value] || PRUNE.normal).ratio;
    const targetClose = Math.floor(extraEdges.length * ratio);
    if (targetClose <= 0) return;

    let {len: curLen} = bfsShortestPath();
    const order = shuffle(extraEdges.slice());
    const maxAttempts = Math.min(order.length, targetClose*4 + 50);
    let closed = 0, tried = 0;

    for (let i=0; i<order.length && closed<targetClose && tried<maxAttempts; i++, tried++){
      const e = order[i];
      // si ya no está abierto (cerrado por una poda previa), salta
      if (!isOpenBetween(e.x1,e.y1,e.x2,e.y2)) continue;

      // cierre tentativo
      closeBetween(e.x1,e.y1,e.x2,e.y2);

      const res = bfsShortestPath();
      if (res.len > curLen){ // cerró un atajo (o alarga el camino)
        closed++;
        curLen = res.len;
      } else {
        // revertir: no complica lo suficiente
        carveBetween(e.x1,e.y1,e.x2,e.y2);
      }
    }
  }

  // ===== newMaze: orquesta todo =====
  function newMaze(){
    const L = LEVELS[diffSel.value] || LEVELS.normal;
    cols = (L.cols%2?L.cols:L.cols+1);
    rows = (L.rows%2?L.rows:L.rows+1);

    start={x:0,y:0};
    exit ={x:cols-1,y:rows-1};

    generatePerfectMaze();               // árbol (camino único)
    const extras = addExtraOpenings();   // bucles sin 2×2
    pruneExtraOpenings(extras);          // cerrar atajos → más callejones

    // Abrir entrada/salida al exterior
    cells[start.y][start.x] &= ~LEFT;
    cells[exit.y][exit.x]   &= ~RIGHT;

    computeShortestSolution(); // solución real del laberinto final
    showSolution = false;

    curPosReset(true);
    updateBestLabel();
    updateSolveBtn();
  }

  function curPosReset(resetTrail){
    cur = {cx:start.x, cy:start.y};
    from = {cx:cur.cx, cy:cur.cy};
    moving=false; moveT=0; tgt=null;
    finished=false; elapsed=0; timerStart=performance.now();
    btnStart.textContent='▶︎';
    if (resetTrail){
      userTrail = [{x:start.x, y:start.y}];
    }
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

        // Rastro (push/pop si retrocede)
        updateUserTrail(cur.cx, cur.cy);

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

  function updateUserTrail(nx, ny){
    const L = userTrail.length;
    if (L === 0){ userTrail.push({x:nx, y:ny}); return; }
    const top = userTrail[L-1];
    if (L >= 2 && nx === userTrail[L-2].x && ny === userTrail[L-2].y){ userTrail.pop(); return; }
    if (nx !== top.x || ny !== top.y){ userTrail.push({x:nx, y:ny}); }
  }

  // ===== Render =====
  function draw(){
    const Wp = canvas.width/DPR, Hp = canvas.height/DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);

    // Fondo
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,Wp,Hp);

    ctx.save(); ctx.translate(offX,offY);

    // Paredes
    ctx.strokeStyle = '#000';
    ctx.lineCap='butt';
    ctx.lineJoin='miter';
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

    // Solución (verde)
    if (showSolution && !printMode && solutionPath && solutionPath.length>1){
      ctx.strokeStyle = getCss('--solution');
      ctx.lineWidth = Math.max(3, Math.floor(ts*0.28));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const p0 = solutionPath[0];
      ctx.moveTo((p0.x+0.5)*ts, (p0.y+0.5)*ts);
      for (let i=1;i<solutionPath.length;i++){
        const p = solutionPath[i];
        ctx.lineTo((p.x+0.5)*ts, (p.y+0.5)*ts);
      }
      ctx.stroke();
    }

    // Rastro del usuario (azul)
    if (!printMode && userTrail && userTrail.length>1){
      ctx.strokeStyle = getCss('--trail');
      ctx.lineWidth = Math.max(2, Math.floor(ts*0.22));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const p0 = userTrail[0];
      ctx.moveTo((p0.x+0.5)*ts, (p0.y+0.5)*ts);
      for (let i=1;i<userTrail.length;i++){
        const p = userTrail[i];
        ctx.lineTo((p.x+0.5)*ts, (p.y+0.5)*ts);
      }
      ctx.stroke();
    }

    // Inicio / salida / jugador
    if (!printMode){
      const dot = (x,y,r)=>{ ctx.beginPath(); ctx.arc((x+0.5)*ts, (y+0.5)*ts, r, 0, Math.PI*2); ctx.fill(); };
      ctx.fillStyle = getCss('--start'); dot(start.x,start.y, ts*0.16);
      ctx.fillStyle = getCss('--exit');  dot(exit.x,exit.y,  ts*0.16);

      const px = moving ? (from.cx+0.5)+(cur.cx-from.cx)*moveT : cur.cx+0.5;
      const py = moving ? (from.cy+0.5)+(cur.cy-from.cy)*moveT : cur.cy+0.5;
      ctx.fillStyle = getCss('--player');
      ctx.beginPath(); ctx.arc(px*ts, py*ts, ts*0.22, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
    timeEl.textContent = fmt(Math.floor(elapsed));
  }

  // ===== Overlay / flujo =====
  function setOverlayButton(label){ overlayBtn.textContent=label; overlayBtn.setAttribute('aria-label',label); }
  function showOverlay(show,text){ statusTxt.textContent=text||''; overlay.style.display=show?'grid':'none'; overlay.setAttribute('aria-hidden', show?'false':'true'); }
  function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  function updateBestLabel(){ const v=getBest(diffSel.value); bestEl.textContent = v==null ? '—' : fmt(v); }
  function updateSolveBtn(){
    btnSolve.textContent = showSolution ? '❌ Ocultar' : '✅ Solución';
    btnSolve.setAttribute('aria-label', showSolution ? 'Ocultar solución' : 'Mostrar solución');
  }

  function startRun(){ if (finished) return; running=true; paused=false; btnStart.textContent='⏸'; hideOverlay(); resetClock(); }
  function pauseRun(){ running=false; paused=true; btnStart.textContent='▶︎'; setOverlayButton('Continuar'); showOverlay(true,'Pausa'); }
  function toggleRun(e){ if(e){e.preventDefault();e.stopPropagation();} if (finished) return; (running && !paused)? pauseRun() : startRun(); }
  function onRestart(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    curPosReset(true);
    setOverlayButton('Empezar'); showOverlay(true,'Listo'); draw();
  }
  function onNew(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    newMaze(); resizeCanvas(); curPosReset(true);
    setOverlayButton('Empezar'); showOverlay(true,'Listo'); draw();
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
  bind(btnSolve, ()=>{
    showSolution = !showSolution;
    updateSolveBtn();
    draw();
  });

  // Eventos impresión y visibilidad
  window.addEventListener('beforeprint', ()=>{ printMode=true; draw(); });
  window.addEventListener('afterprint',  ()=>{ printMode=false; draw(); });
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // Dificultad → afecta al siguiente “Nuevo”
  diffSel.addEventListener('change', ()=>{ updateBestLabel(); });

  // ===== Boot =====
  newMaze(); resizeCanvas(); draw();
  updateBestLabel();
  timeEl.textContent = fmt(0);
  updateSolveBtn();
  setOverlayButton('Empezar'); showOverlay(true,'Listo');
  requestAnimationFrame(loop);
})();
</script>
<!-- === /MAZE (v1.9) === -->
