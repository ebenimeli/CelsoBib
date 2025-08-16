---
layout: page
title: "🟡 Pac-Man"
description: "Pac-Man clásico (versión ligera, estable)"
---

<!-- === PAC-MAN — ENRIQUE (v1.2 · mapa fijo + túneles + estable) === -->
<div id="pacman-game" class="pacman" tabindex="0" aria-label="Juego Pac-Man">
  <div class="pm-bar">
    <strong>🟡 Pac-Man</strong>
    <div class="pm-stats">
      Puntos: <span id="pm-score">0</span> · Vidas: <span id="pm-lives">3</span> · Mejor: <span id="pm-best">0</span>
    </div>
    <div class="pm-controls">
      <button id="pm-start" class="pm-btn" type="button" aria-label="Iniciar / Pausar">▶︎/⏸</button>
      <button id="pm-restart" class="pm-btn" type="button" aria-label="Reiniciar">⟲</button>
      <label class="pm-diff">
        Dificultad
        <select id="pm-diff" aria-label="Dificultad">
          <option value="easy">Fácil</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Difícil</option>
        </select>
      </label>
    </div>
  </div>

  <div class="pm-canvas-wrap">
    <canvas id="pm-canvas"></canvas>

    <!-- Overlay (inicio/pausa/game over) -->
    <div class="pm-overlay" id="pm-overlay" aria-hidden="true">
      <div class="pm-overlay-card">
        <div id="pm-status-text">Listo</div>
        <button id="pm-overlay-btn" type="button" class="pm-btn pm-btn-primary" aria-label="Empezar">Empezar</button>
      </div>
    </div>

    <!-- D-pad -->
    <div class="pm-dpad" aria-label="Controles táctiles" role="group">
      <button class="pm-d" data-dir="up" aria-label="Arriba">▲</button>
      <div class="pm-dpad-row">
        <button class="pm-d" data-dir="left" aria-label="Izquierda">◀</button>
        <button class="pm-d" data-dir="toggle" aria-label="Pausar/Continuar">⏯</button>
        <button class="pm-d" data-dir="right" aria-label="Derecha">▶</button>
      </div>
      <button class="pm-d" data-dir="down" aria-label="Abajo">▼</button>
    </div>
  </div>

  <p class="pm-help">← ↑ → ↓ / WASD moverte · <kbd>Espacio</kbd>/<kbd>P</kbd> pausa · <kbd>R</kbd> reinicia</p>
</div>

<style>
  /* ===== Estilos (aislados bajo #pacman-game) ===== */
  #pacman-game{
    --grid-stroke:rgba(255,255,255,.08);
    --wall:#38bdf8;
    --pac:#fde047;
    --ghost-red:#ef4444;
    --ghost-pink:#f472b6;
    --ghost-cyan:#22d3ee;
    --ghost-orange:#fb923c;
    --fright:#3b82f6;
    --pellet:#f8fafc;

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
  [data-theme="dark"] #pacman-game{
    background:#fff !important; border-color:#e5e7eb !important; color:#111 !important;
  }

  #pacman-game .pm-bar{
    display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap;
    margin-bottom:.5rem; font-size:.95rem; position:relative; z-index:2; background:#fff;
  }
  #pacman-game .pm-stats{ font-variant-numeric:tabular-nums; }
  #pacman-game .pm-controls{ display:flex; align-items:center; gap:.5rem; }
  #pacman-game .pm-btn{
    border:1px solid currentColor; background:transparent; padding:.25rem .5rem; border-radius:8px; cursor:pointer;
    line-height:1; font-size:.95rem; user-select:none; touch-action:manipulation;
  }
  #pacman-game .pm-btn-primary{ border-color:transparent; background:#22c55e; color:#05220e; }
  #pacman-game .pm-diff select{
    margin-left:.25rem; padding:.15rem .35rem; border-radius:6px; border:1px solid currentColor; background:#fff; color:#111;
  }

  /* Zona de juego cuadrada y negra */
  #pacman-game .pm-canvas-wrap{ position:relative; user-select:none; width:100%; aspect-ratio:1/1; }
  @supports not (aspect-ratio:1/1){ #pacman-game .pm-canvas-wrap{ height:0; padding-top:100%; } }
  #pacman-game canvas{
    position:absolute; inset:0; width:100%; height:100%;
    display:block; border-radius:10px; background:#000 !important;
  }
  [data-theme="dark"] #pacman-game canvas{ background:#000 !important; }

  #pacman-game .pm-overlay{ position:absolute; inset:0; display:none; place-items:center; backdrop-filter:blur(2px); z-index:999; }
  #pacman-game .pm-overlay-card{
    padding:.9rem 1rem; border-radius:10px; min-width:12rem; text-align:center;
    background:rgba(0,0,0,.75); color:#fff; display:flex; flex-direction:column; gap:.5rem;
  }

  /* D-pad móvil */
  #pacman-game .pm-dpad{ display:none; position:absolute; inset:auto .25rem .25rem auto; z-index:5; }
  #pacman-game .pm-dpad-row{ display:flex; gap:.25rem; justify-content:center; margin:.25rem 0; }
  #pacman-game .pm-d{
    padding:.38rem .58rem; border-radius:8px; border:1px solid rgba(255,255,255,.35);
    background:rgba(255,255,255,.15); color:#fff; font-size:1rem; touch-action:manipulation;
  }
  @media (hover:none) and (pointer:coarse){
    #pacman-game .pm-dpad{ display:flex; flex-direction:column; align-items:center; }
  }

  #pacman-game .pm-help{ margin:.5rem 0 0; font-size:.9rem; color:#4b5563; background:#fff; }
</style>

<script>
(() => {
  const root = document.getElementById('pacman-game');
  if (!root || root.dataset.pmInit === "1") return;
  root.dataset.pmInit = "1";

  const $ = (s,p=root)=>p.querySelector(s);
  const wrap = $('.pm-canvas-wrap');
  const canvas = $('#pm-canvas');
  const ctx = canvas.getContext('2d',{alpha:false});
  const scoreEl = $('#pm-score'), livesEl = $('#pm-lives'), bestEl = $('#pm-best');
  const btnStart = $('#pm-start'), btnRestart = $('#pm-restart'), diffSel = $('#pm-diff');
  const overlay = $('#pm-overlay'), overlayBtn = $('#pm-overlay-btn'), statusTxt = $('#pm-status-text');
  const dpadBtns = root.querySelectorAll('.pm-d');

  // ===== Config =====
  const HS_KEY = 'pacman.highscore.v1';
  const W = 28, H = 31;                 // tamaño clásico en celdas
  const T_EMPTY=0, T_WALL=1, T_DOT=2, T_POWER=3, T_DOOR=4;

  const PRESETS = {
    easy:   { pacSpd: 6.2, ghostSpd: 5.0, frightSpd: 4.0, frightTime: 7.0 },
    normal: { pacSpd: 6.8, ghostSpd: 5.6, frightSpd: 4.6, frightTime: 6.0 },
    hard:   { pacSpd: 7.4, ghostSpd: 6.2, frightSpd: 5.2, frightTime: 5.0 }
  };

  // ===== Estado =====
  let DPR=1, ts=12;      // tamaño de celda en px (se calcula)
  let running=false, paused=false, gameOver=false, level=1;
  let last=performance.now(), acc=0;
  let score=0, lives=3, best=0, pelletsLeft=0, chainGhosts=0;

  let grid=[];           // matriz de tiles
  let pac={x:14.5,y:23.5,dir:{x:-1,y:0},next:{x:-1,y:0},mouth:0};
  const ghosts=[
    makeGhost('blinky', '#ef4444', {x:14.5,y:11.5}, {x:W-2,y:1}),
    makeGhost('pinky',  '#f472b6', {x:13.5,y:15.5}, {x:1,  y:1}),
    makeGhost('inky',   '#22d3ee', {x:14.5,y:15.5}, {x:W-2,y:H-2}),
    makeGhost('clyde',  '#fb923c', {x:15.5,y:15.5}, {x:1,  y:H-2}),
  ];
  let mode='chase', modeTimer=0, frightTimer=0;

  function makeGhost(name,color,pos,corner){
    return {name,color,x:pos.x,y:pos.y,dir:{x:1,y:0},state:'normal',corner,eyesSpd:8,speed:PRESETS[diffSel.value].ghostSpd};
  }

  // ===== Util =====
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function dist2(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return dx*dx + dy*dy; }
  function getBest(){ return parseInt(localStorage.getItem(HS_KEY)||'0',10); }
  function setBest(v){ localStorage.setItem(HS_KEY,String(v)); bestEl.textContent=String(v); }
  function getCss(name){
    return getComputedStyle(root).getPropertyValue(name).trim() ||
           getComputedStyle(canvas).getPropertyValue(name).trim() || '#fff';
  }

  // ===== Mapa fijo (conectividad garantizada) =====
  // Leyenda: # muro · . punto · o power · - puerta de la casa · espacio = pasillo
  // P (spawn Pac) sólo para cálculo: luego se convierte a pasillo.
  const MAP = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.#####.##.#####.######",
    "#####..#####.##.#####..#####",
    "#####.##............##.#####",
    "#####.##.###-##-###.##.#####",
    "..........#......#..........",
    "#####.##.#.######.#.##.#####",
    "#####.##.#.######.#.##.#####",
    "#####.##............##.#####",
    "#####.##.##########.##.#####",
    "#####.##.##########.##.#####",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#..........................#",
    "#.####.#####.##.#####.####.#",
    "#o####.......P.......####o.#",
    "#.####.##.########.##.####.#",
    "#............##............#",
    "############################"
  ];
  // (28×31) P está en (col 15, fila 28 en 1-based): en 0-based ~ x=14, y=27

  function buildGrid(){
    grid = Array.from({length:H},()=>Array(W).fill(T_WALL));
    pelletsLeft = 0;

    for (let y=0;y<H;y++){
      const row = MAP[y];
      for (let x=0;x<W;x++){
        const c = row[x] || '#';
        let t = T_WALL;
        if (c === '#') t = T_WALL;
        else if (c === '.') t = T_DOT;
        else if (c === 'o') t = T_POWER;
        else if (c === '-') t = T_DOOR;    // puerta de casa (transitable)
        else if (c === ' ' || c === 'P') t = T_EMPTY;

        grid[y][x] = t;
        if (t === T_DOT || t === T_POWER) pelletsLeft++;
        if (c === 'P'){ pac = {x:x+0.5, y:y+0.5, dir:{x:-1,y:0}, next:{x:-1,y:0}, mouth:0}; }
      }
    }
  }

  // ===== Canvas / escala =====
  function resizeCanvas(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const rect = wrap.getBoundingClientRect();
    const cssSize = Math.floor(Math.max(240, rect.width||240));
    canvas.style.width = cssSize+'px';
    canvas.style.height= cssSize+'px';
    canvas.width  = Math.floor(cssSize * DPR);
    canvas.height = Math.floor(cssSize * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ts = Math.floor(Math.min(canvas.width/DPR/W, canvas.height/DPR/H));
    if (!running) draw();
  }
  window.addEventListener('resize', resizeCanvas, {passive:true});
  if (window.ResizeObserver){ new ResizeObserver(resizeCanvas).observe(wrap); }

  // ===== Juego =====
  function resetPositions(){
    // Releer P del mapa por si cambia en el futuro
    for (let y=0;y<H;y++){
      for (let x=0;x<W;x++){
        if (MAP[y][x]==='P'){ pac = {x:x+0.5, y:y+0.5, dir:{x:-1,y:0}, next:{x:-1,y:0}, mouth:0}; }
      }
    }
    ghosts[0].x=14.5; ghosts[0].y=11.5; ghosts[0].dir={x:1,y:0}; ghosts[0].state='normal';
    ghosts[1].x=13.5; ghosts[1].y=15.5; ghosts[1].dir={x:-1,y:0}; ghosts[1].state='normal';
    ghosts[2].x=14.5; ghosts[2].y=15.5; ghosts[2].dir={x:1,y:0}; ghosts[2].state='normal';
    ghosts[3].x=15.5; ghosts[3].y=15.5; ghosts[3].dir={x:0,y:1}; ghosts[3].state='normal';
    frightTimer=0; chainGhosts=0; mode='chase'; modeTimer=0;
  }

  function resetGame(){
    ghosts.forEach(g=>g.speed=PRESETS[diffSel.value].ghostSpd);
    score=0; level=1; lives=3;
    scoreEl.textContent='0'; livesEl.textContent='3';
    best = getBest(); bestEl.textContent = String(best);
    buildGrid();
    resetPositions();
    running=false; paused=false; gameOver=false;
    resetClock();
  }

  function resetClock(){ last=performance.now(); acc=0; }
  function loop(t){
    const step = 1000/60;
    let dt = t - last; last = t; acc += dt;
    acc = Math.min(acc, step*6);
    while (acc >= step){
      if (running && !paused && !gameOver) update(step/1000);
      acc -= step;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function tileAt(x,y){
    if (x<0 || x>=W || y<0 || y>=H) return T_WALL;
    return grid[y][x];
  }
  function passableTile(t){ return (t !== T_WALL); }
  function canGo(cx,cy,dx,dy){
    const nx=cx+dx, ny=cy+dy;
    // túneles laterales (wrap)
    if (ny>=0 && ny<H && (nx<0 || nx>=W)) return true;
    return passableTile(tileAt(nx,ny));
  }

  function neighbors(cx,cy){ return [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}] }
  function bestDir(cx,cy,tx,ty,opts){
    let best=null, bestScore=1e9;
    for (const d of opts){
      const nx=cx+d.x, ny=cy+d.y, h=Math.abs(tx-nx)+Math.abs(ty-ny);
      if (h<bestScore){ bestScore=h; best=d; }
    }
    return best;
  }

  function ghostTarget(g){
    if (g.name==='blinky') return {x:pac.x, y:pac.y};
    if (g.name==='pinky')  return {x:pac.x + 4*pac.dir.x, y:pac.y + 4*pac.dir.y};
    if (g.name==='inky')   return {x:pac.x + 2*pac.dir.y, y:pac.y + 2*(-pac.dir.x)};
    if (g.name==='clyde'){ return (dist2(g.x,g.y,pac.x,pac.y)<64)? g.corner : {x:pac.x,y:pac.y}; }
    return {x:pac.x, y:pac.y};
  }

  function update(dt){
    const P = PRESETS[diffSel.value];

    // ciclo chase/scatter
    modeTimer += dt;
    mode = ((modeTimer % 27) < 7) ? 'scatter' : 'chase';

    // fright mode countdown
    if (frightTimer>0){
      frightTimer -= dt;
      if (frightTimer<=0){ ghosts.forEach(g=>{ if (g.state==='frightened') g.state='normal'; }); }
    }

    // giros de Pac al centro de celda
    const cx = Math.floor(pac.x), cy = Math.floor(pac.y);
    const nearCenter = (Math.abs(pac.x-(cx+0.5))<0.18) && (Math.abs(pac.y-(cy+0.5))<0.18);
    if (nearCenter){
      if (canGo(cx,cy,pac.next.x,pac.next.y)) pac.dir={...pac.next};
      else if (!canGo(cx,cy,pac.dir.x,pac.dir.y)) pac.dir={x:0,y:0};
      pac.x = cx+0.5; pac.y = cy+0.5;
    }

    // mover Pac
    pac.x += pac.dir.x * P.pacSpd * dt;
    pac.y += pac.dir.y * P.pacSpd * dt;
    // túneles (wrap horizontal)
    if (pac.x < -0.5) pac.x = W-0.5;
    if (pac.x > W+0.5) pac.x = 0.5;

    // comer pellet
    const tx = Math.floor(pac.x), ty = Math.floor(pac.y);
    const t = tileAt(tx,ty);
    if (t===T_DOT){
      grid[ty][tx]=T_EMPTY; pelletsLeft--; score+=10; scoreEl.textContent=String(score); if (score>best) setBest(score);
    } else if (t===T_POWER){
      grid[ty][tx]=T_EMPTY; pelletsLeft--; score+=50; scoreEl.textContent=String(score); if (score>best) setBest(score);
      chainGhosts=0; frightTimer=P.frightTime; ghosts.forEach(g=>{ if (g.state==='normal') g.state='frightened'; });
    }

    // mover fantasmas
    for (const g of ghosts){
      const speed = (g.state==='eyes')? g.eyesSpd : (g.state==='frightened'? P.frightSpd : g.speed);
      const gx=Math.floor(g.x), gy=Math.floor(g.y);
      const gc = (Math.abs(g.x-(gx+0.5))<0.18) && (Math.abs(g.y-(gy+0.5))<0.18);
      if (gc){
        const opts = neighbors(gx,gy).filter(d=>canGo(gx,gy,d.x,d.y) && (g.state==='frightened' || !(d.x===-g.dir.x && d.y===-g.dir.y)));
        let choice=null;
        if (g.state==='frightened'){
          choice = opts[Math.floor(Math.random()*opts.length)] || {x:-g.dir.x,y:-g.dir.y};
        } else if (g.state==='eyes'){
          choice = bestDir(gx,gy,14,15,opts) || opts[0] || {x:-g.dir.x,y:-g.dir.y};
          if (Math.floor(g.x)===14 && Math.floor(g.y)===15) g.state='normal';
        } else {
          const target = (mode==='scatter')? g.corner : ghostTarget(g);
          choice = bestDir(gx,gy,Math.floor(target.x),Math.floor(target.y),opts) || opts[0] || {x:-g.dir.x,y:-g.dir.y};
        }
        if (choice){ g.dir=choice; g.x=gx+0.5; g.y=gy+0.5; }
      }
      g.x += g.dir.x * speed * dt;
      g.y += g.dir.y * speed * dt;
      // wrap horizontal
      if (g.x < -0.5) g.x = W-0.5;
      if (g.x > W+0.5) g.x = 0.5;
    }

    // colisiones Pac vs fantasmas
    for (const g of ghosts){
      if (g.state==='eyes') continue;
      if (dist2(pac.x,pac.y,g.x,g.y) < 0.35*0.35){
        if (g.state==='frightened'){
          const points = 200 * (1<<Math.min(chainGhosts,3)); // 200,400,800,1600
          score+=points; scoreEl.textContent=String(score); if (score>best) setBest(score);
          chainGhosts++; g.state='eyes';
        } else {
          loseLife(); return;
        }
      }
    }

    // nivel completado
    if (pelletsLeft<=0){
      level++;
      buildGrid(); resetPositions();
      running=false; paused=true; setOverlayButton('Empezar'); showOverlay(true, `Nivel ${level-1} superado`);
    }

    // animación boca
    pac.mouth += dt*10;
  }

  function loseLife(){
    lives--; livesEl.textContent=String(lives);
    if (lives<=0){ endGame(); return; }
    resetPositions(); running=false; paused=true; setOverlayButton('Continuar'); showOverlay(true,'Vida perdida');
  }

  // ===== Render =====
  function draw(){
    const Wp = canvas.width / DPR, Hp = canvas.height / DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    // fondo negro
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#000';
    ctx.fillRect(0,0,Wp,Hp);

    const offX = Math.floor((Wp - W*ts)/2);
    const offY = Math.floor((Hp - H*ts)/2);
    ctx.save(); ctx.translate(offX,offY);

    // rejilla suave
    ctx.strokeStyle = getCss('--grid-stroke'); ctx.lineWidth=1; ctx.beginPath();
    for (let i=0;i<=W;i++){ const x=i*ts; ctx.moveTo(x,0); ctx.lineTo(x,H*ts); }
    for (let j=0;j<=H;j++){ const y=j*ts; ctx.moveTo(0,y); ctx.lineTo(W*ts,y); }
    ctx.stroke();

    // muros + puerta
    for (let y=0;y<H;y++){
      for (let x=0;x<W;x++){
        if (grid[y][x]===T_WALL){
          ctx.fillStyle = getCss('--wall');
          roundRect(ctx, x*ts+2, y*ts+2, ts-4, ts-4, Math.min(5, ts*0.25), true);
        } else if (grid[y][x]===T_DOOR){
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(x*ts+ts*0.2, y*ts+ts*0.45, ts*0.6, ts*0.1);
        }
      }
    }

    // pellets
    const t = performance.now()/1000;
    for (let y=0;y<H;y++){
      for (let x=0;x<W;x++){
        if (grid[y][x]===T_DOT){
          ctx.fillStyle = getCss('--pellet');
          const r = Math.max(1, Math.floor(ts*0.10));
          ctx.beginPath(); ctx.arc(x*ts+ts/2, y*ts+ts/2, r, 0, Math.PI*2); ctx.fill();
        } else if (grid[y][x]===T_POWER){
          const pulse = (Math.sin(t*6)+1)/2;
          const r = Math.max(2.5, ts*0.20 + pulse*ts*0.05);
          ctx.fillStyle = getCss('--pellet');
          ctx.beginPath(); ctx.arc(x*ts+ts/2, y*ts+ts/2, r, 0, Math.PI*2); ctx.fill();
        }
      }
    }

    // fantasmas
    for (const g of ghosts){
      const x = g.x*ts, y = g.y*ts, r = ts*0.38;
      if (g.state==='frightened') ctx.fillStyle=getCss('--fright');
      else if (g.state==='eyes') ctx.fillStyle='#ffffff';
      else ctx.fillStyle=g.color;
      drawGhost(ctx,x,y,r,g.state);
    }

    // pac
    drawPac(ctx, pac.x*ts, pac.y*ts, ts*0.40, pac.dir);

    ctx.restore();
  }

  function drawPac(ctx,x,y,r,dir){
    const base = (dir.x||dir.y) ? Math.atan2(dir.y,dir.x) : 0;
    const chomp = (Math.sin(pac.mouth)+1)/2 * 0.45 + 0.08;
    ctx.fillStyle = getCss('--pac');
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.arc(x,y,r, base+chomp, base-chomp, true);
    ctx.closePath(); ctx.fill();
  }

  function drawGhost(ctx,x,y,r,state){
    const left=x-r, w=r*2;
    const wave=(Math.sin(performance.now()/150)+1)/2;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.arc(x,y,r,Math.PI,0);
    for (let i=0;i<4;i++){
      const fx = left + (i+0.5)*(w/4);
      const fy = y + r - (i%2?wave:1-wave)*r*0.15;
      ctx.quadraticCurveTo(fx, fy, left + (i+1)*(w/4), y+r*0.15);
    }
    ctx.lineTo(x+r,y); ctx.closePath(); ctx.fill();

    if (state!=='frightened'){
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(x-r*0.35, y-r*0.10, r*0.22, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*0.35, y-r*0.10, r*0.22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#1f2937';
      ctx.beginPath(); ctx.arc(x-r*0.35, y-r*0.10, r*0.10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+r*0.35, y-r*0.10, r*0.10, 0, Math.PI*2); ctx.fill();
    }
  }

  function roundRect(ctx,x,y,w,h,r,fill){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    if (fill) ctx.fill(); else ctx.stroke();
  }

  // ===== Overlay / flujo =====
  function showOverlay(show,text){ statusTxt.textContent=text||''; overlay.style.display=show?'grid':'none'; overlay.setAttribute('aria-hidden', show?'false':'true'); }
  function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  function startRun(){ if (gameOver) return; running=true; paused=false; btnStart.textContent='⏸'; hideOverlay(); resetClock(); }
  function pauseRun(){ running=false; paused=true; btnStart.textContent='▶︎'; setOverlayButton('Continuar'); showOverlay(true,'Pausa'); }
  function toggleRun(e){ if(e){e.preventDefault();e.stopPropagation();} if (gameOver) return; (running && !paused)? pauseRun() : startRun(); }
  function endGame(){ running=false; paused=false; gameOver=true; btnStart.textContent='▶︎'; setOverlayButton('Empezar'); showOverlay(true,'Game Over'); }
  function onRestart(e){ if(e){e.preventDefault();e.stopPropagation();} resetGame(); resizeCanvas(); draw(); setOverlayButton('Empezar'); showOverlay(true,'Listo'); }
  function setOverlayButton(label){ overlayBtn.textContent=label; overlayBtn.setAttribute('aria-label',label); }

  // ===== Controles =====
  function setDir(x,y){ pac.next={x,y}; }
  document.addEventListener('keydown',(e)=>{
    const k=e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D',' ','Spacebar','p','P','r','R'].includes(k)) e.preventDefault();
    if (k==='ArrowUp'||k==='w'||k==='W') setDir(0,-1);
    if (k==='ArrowDown'||k==='s'||k==='S') setDir(0, 1);
    if (k==='ArrowLeft'||k==='a'||k==='A') setDir(-1,0);
    if (k==='ArrowRight'||k==='d'||k==='D') setDir(1, 0);
    if (k==='p'||k==='P'||k===' '||k==='Spacebar') toggleRun(e);
    if (k==='r'||k==='R') onRestart(e);
    if (!running && !gameOver && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'].includes(k)) startRun();
  });

  function bind(el, handler){
    el.addEventListener('pointerdown', ev=>{ ev.preventDefault(); ev.stopPropagation(); });
    el.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); handler(ev); });
  }
  bind(btnStart, toggleRun);
  bind(btnRestart, onRestart);
  bind(overlayBtn, ()=>{ if (gameOver) onRestart(); else startRun(); });
  overlay.addEventListener('click', (e)=>{ if (e.target===overlay){ if (gameOver) onRestart(e); else startRun(); } });

  // D-pad
  dpadBtns.forEach(b=>{
    const d=b.dataset.dir;
    if (d==='toggle'){ b.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); toggleRun(ev); }); return; }
    b.addEventListener('click', ev=>{
      ev.preventDefault(); ev.stopPropagation();
      if (d==='up') setDir(0,-1);
      if (d==='down') setDir(0, 1);
      if (d==='left') setDir(-1,0);
      if (d==='right') setDir(1, 0);
      if (!running && !gameOver) startRun();
    });
  });

  // Pausa al ocultar pestaña
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // ===== Boot =====
  bestEl.textContent = String(getBest());
  resetGame(); resizeCanvas(); draw();
  setOverlayButton('Empezar'); showOverlay(true,'Listo');
  requestAnimationFrame(loop);
})();
</script>
<!-- === /PAC-MAN === -->
