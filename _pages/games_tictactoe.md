---
layout: page
title: "❌⭕️ Tres en raya"
description: "El clásico tres en raya"
---

<!-- === TIC-TAC-TOE — ENRIQUE (v1.0) === -->
<div id="ttt-game" class="ttt" tabindex="0" aria-label="Juego 3 en raya">
  <div class="ttt-bar">
    <strong>❌⭕ 3 en raya</strong>
    <div class="ttt-stats">
      Racha: <span id="ttt-score">0</span> · Mejor: <span id="ttt-best">0</span>
    </div>
    <div class="ttt-controls">
      <button id="ttt-start" class="ttt-btn" type="button" aria-label="Iniciar / Pausar">▶︎/⏸</button>
      <button id="ttt-restart" class="ttt-btn" type="button" aria-label="Reiniciar">⟲</button>
      <label class="ttt-opt">
        Modo
        <select id="ttt-mode" aria-label="Modo de juego">
          <option value="pvp">2 jugadores</option>
          <option value="easy">Fácil</option>
          <option value="normal" selected>Normal</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      <label class="ttt-opt">
        Empieza
        <select id="ttt-first" aria-label="Quién empieza">
          <option value="human" selected>Tú (X)</option>
          <option value="cpu">CPU (O)</option>
        </select>
      </label>
    </div>
  </div>

  <div class="ttt-canvas-wrap">
    <canvas id="ttt-canvas"></canvas>

    <!-- Overlay (inicio/pausa/fin) -->
    <div class="ttt-overlay" id="ttt-overlay" aria-hidden="true">
      <div class="ttt-overlay-card">
        <div id="ttt-status-text">Listo</div>
        <button id="ttt-overlay-btn" type="button" class="ttt-btn ttt-btn-primary" aria-label="Empezar">Empezar</button>
      </div>
    </div>

    <!-- D-pad / colocación para móviles -->
    <div class="ttt-dpad" aria-label="Controles táctiles" role="group">
      <button class="ttt-d" data-act="up" aria-label="Arriba">▲</button>
      <div class="ttt-d-row">
        <button class="ttt-d" data-act="left" aria-label="Izquierda">◀</button>
        <button class="ttt-d" data-act="place" aria-label="Colocar">⦿</button>
        <button class="ttt-d" data-act="right" aria-label="Derecha">▶</button>
      </div>
      <button class="ttt-d" data-act="down" aria-label="Abajo">▼</button>
    </div>
  </div>

  <p class="ttt-help">← ↑ → ↓ mueve el cursor · <kbd>Enter</kbd>/<kbd>Espacio</kbd> coloca · <kbd>P</kbd> pausa · <kbd>R</kbd> reinicia</p>
</div>

<style>
  /* ===== Estilos (aislados bajo #ttt-game) ===== */
  #ttt-game{
    --line: rgba(255,255,255,.18);
    --x-color:#f43f5e;  /* rojo */
    --o-color:#22c55e;  /* verde */
    --sel: rgba(255,255,255,.18);

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
  [data-theme="dark"] #ttt-game{
    background:#fff !important; border-color:#e5e7eb !important; color:#111 !important;
  }

  #ttt-game .ttt-bar{
    display:flex; align-items:center; justify-content:space-between; gap:.5rem; flex-wrap:wrap;
    margin-bottom:.5rem; font-size:.95rem; position:relative; z-index:2; background:#fff;
  }
  #ttt-game .ttt-stats{ font-variant-numeric:tabular-nums; }
  #ttt-game .ttt-controls{ display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  #ttt-game .ttt-btn{
    border:1px solid currentColor; background:transparent; padding:.25rem .5rem; border-radius:8px; cursor:pointer;
    line-height:1; font-size:.95rem; user-select:none; touch-action:manipulation;
  }
  #ttt-game .ttt-btn-primary{ border-color:transparent; background:#22c55e; color:#05220e; }
  #ttt-game .ttt-opt select{
    margin-left:.25rem; padding:.15rem .35rem; border-radius:6px; border:1px solid currentColor; background:#fff; color:#111;
  }

  /* Zona de juego cuadrada y negra */
  #ttt-game .ttt-canvas-wrap{ position:relative; user-select:none; width:100%; aspect-ratio:1/1; }
  @supports not (aspect-ratio:1/1){ #ttt-game .ttt-canvas-wrap{ height:0; padding-top:100%; } }
  #ttt-game canvas{
    position:absolute; inset:0; width:100%; height:100%;
    display:block; border-radius:10px; background:#000 !important;
  }
  [data-theme="dark"] #ttt-game canvas{ background:#000 !important; }

  #ttt-game .ttt-overlay{ position:absolute; inset:0; display:none; place-items:center; backdrop-filter:blur(2px); z-index:999; }
  #ttt-game .ttt-overlay-card{
    padding:.9rem 1rem; border-radius:10px; min-width:12rem; text-align:center;
    background:rgba(0,0,0,.75); color:#fff; display:flex; flex-direction:column; gap:.5rem;
  }

  /* D-pad móvil */
  #ttt-game .ttt-dpad{ display:none; position:absolute; inset:auto .25rem .25rem auto; z-index:5; }
  #ttt-game .ttt-d-row{ display:flex; gap:.25rem; justify-content:center; margin:.25rem 0; }
  #ttt-game .ttt-d{
    padding:.38rem .58rem; border-radius:8px; border:1px solid rgba(255,255,255,.35);
    background:rgba(255,255,255,.15); color:#fff; font-size:1rem; touch-action:manipulation;
  }
  @media (hover:none) and (pointer:coarse){
    #ttt-game .ttt-dpad{ display:flex; flex-direction:column; align-items:center; }
  }

  #ttt-game .ttt-help{ margin:.5rem 0 0; font-size:.9rem; color:#4b5563; background:#fff; }
</style>

<script>
(() => {
  const root = document.getElementById('ttt-game');
  if (!root || root.dataset.tttInit === "1") return;
  root.dataset.tttInit = "1";

  const $ = (s,p=root)=>p.querySelector(s);
  const wrap = $('.ttt-canvas-wrap');
  const canvas = $('#ttt-canvas');
  const ctx = canvas.getContext('2d',{alpha:false});
  const scoreEl = $('#ttt-score'), bestEl = $('#ttt-best');
  const btnStart = $('#ttt-start'), btnRestart = $('#ttt-restart');
  const modeSel = $('#ttt-mode'), firstSel = $('#ttt-first');
  const overlay = $('#ttt-overlay'), overlayBtn = $('#ttt-overlay-btn'), statusTxt = $('#ttt-status-text');

  // Estado
  const HS_KEY = 'ttt.beststreak.v1';
  let DPR=1, ts=40;             // tamaño de celda (se calcula)
  let running=false, paused=false, gameOver=false;
  let board = Array(9).fill(0); // 0 vacío, 1 humano/X, -1 CPU/O (o jugador O en PVP)
  let turn = 1;                 // 1 o -1
  let selection = 4;            // cursor seleccionado (0..8)
  let score=0, best=0;
  let winLine = null;           // [a,b,c] si hay victoria

  // Utilidades
  function getBest(){ return parseInt(localStorage.getItem(HS_KEY)||'0',10) }
  function setBest(v){ localStorage.setItem(HS_KEY,String(v)); bestEl.textContent=String(v); }
  function setOverlayButton(label){ overlayBtn.textContent=label; overlayBtn.setAttribute('aria-label',label); }
  function showOverlay(show,text){ statusTxt.textContent=text||''; overlay.style.display=show?'grid':'none'; overlay.setAttribute('aria-hidden', show?'false':'true'); }
  function hideOverlay(){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  function empties(b=board){ return b.map((v,i)=>v===0?i:null).filter(i=>i!==null); }
  function clone(b){ return b.slice(); }
  function winner(b){
    const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,c,d] of L){ if (b[a]!==0 && b[a]===b[c] && b[c]===b[d]) return {w:b[a], line:[a,c,d]}; }
    return {w:0,line:null};
  }
  function isDraw(b){ return empties(b).length===0 && winner(b).w===0; }

  // Canvas / escala
  function resizeCanvas(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const rect = wrap.getBoundingClientRect();
    const cssSize = Math.floor(Math.max(260, rect.width||260));
    canvas.style.width = cssSize+'px';
    canvas.style.height= cssSize+'px';
    canvas.width  = Math.floor(cssSize * DPR);
    canvas.height = Math.floor(cssSize * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ts = Math.floor((canvas.width/DPR)/3);
    draw();
  }
  window.addEventListener('resize', resizeCanvas, {passive:true});
  if (window.ResizeObserver){ new ResizeObserver(resizeCanvas).observe(wrap); }

  // Juego
  function resetBoard(){
    board.fill(0); winLine=null; selection=4; gameOver=false; paused=false;
    turn = (firstSel.value==='cpu' && modeSel.value!=='pvp') ? -1 : 1;
  }
  function resetGame(){
    score = 0; best = getBest(); scoreEl.textContent='0'; bestEl.textContent=String(best);
    resetBoard(); draw();
    running=false; paused=false; gameOver=false;
  }

  function startRun(){ if (gameOver) return; running=true; paused=false; btnStart.textContent='⏸'; hideOverlay(); maybeCpuMove(); draw(); }
  function pauseRun(){ running=false; paused=true; btnStart.textContent='▶︎'; setOverlayButton('Continuar'); showOverlay(true,'Pausa'); }
  function toggleRun(e){ if(e){e.preventDefault();e.stopPropagation();} if (gameOver) return; (running && !paused)? pauseRun() : startRun(); }
  function endRound(msg){
    running=false; paused=false; gameOver=true; btnStart.textContent='▶︎';
    setOverlayButton('Empezar'); showOverlay(true, msg||'Fin');
  }
  function onRestart(e){ if(e){e.preventDefault();e.stopPropagation();} resetBoard(); draw(); setOverlayButton('Empezar'); showOverlay(true,'Listo'); }

  // IA (minimax con cortes simples)
  function scoreBoard(b){
    const r = winner(b).w;
    if (r===-1) return 10;      // bueno para CPU
    if (r=== 1) return -10;     // malo para CPU
    return 0;
  }
  function minimax(b, player, depth){
    const w = winner(b).w;
    if (w!==0 || isDraw(b)) return {score: scoreBoard(b), move:null};
    let bestMove=null;
    if (player===-1){ // CPU maximiza
      let bestScore=-Infinity;
      for (const i of empties(b)){
        const nb=clone(b); nb[i]=player;
        const {score} = minimax(nb, 1, depth+1);
        const s = score - depth; // preferir mates rápidos
        if (s>bestScore){ bestScore=s; bestMove=i; }
      }
      return {score:bestScore, move:bestMove};
    } else { // humano minimiza
      let bestScore=Infinity;
      for (const i of empties(b)){
        const nb=clone(b); nb[i]=player;
        const {score} = minimax(nb, -1, depth+1);
        const s = score + depth;
        if (s<bestScore){ bestScore=s; bestMove=i; }
      }
      return {score:bestScore, move:bestMove};
    }
  }
  function cpuMove(){
    if (modeSel.value==='pvp') return;
    if (gameOver) return;
    // Easy: aleatorio
    const E = empties();
    if (!E.length) return;
    let move;
    if (modeSel.value==='easy'){
      move = E[Math.floor(Math.random()*E.length)];
    } else if (modeSel.value==='normal'){
      // primero: ganar si puede / bloquear, si no mezcla con aleatorio
      move = findWinningMove(board,-1) ?? findWinningMove(board,1);
      if (move==null){
        if (Math.random()<0.6) move = minimax(board,-1,0).move;
        else move = E[Math.floor(Math.random()*E.length)];
      }
    } else { // pro
      move = minimax(board,-1,0).move;
    }
    place(move, -1);
  }
  function findWinningMove(b, ply){
    for (const i of empties(b)){
      const nb=clone(b); nb[i]=ply;
      if (winner(nb).w===ply) return i;
    }
    return null;
  }

  // Reglas
  function place(idx, ply){
    if (gameOver || !running || paused) return;
    if (idx<0 || idx>8 || board[idx]!==0) return;
    board[idx]=ply;
    const res = winner(board);
    if (res.w!==0){
      winLine = res.line;
      if (modeSel.value!=='pvp'){
        if (res.w===1){ score++; if (score>getBest()) setBest(score); scoreEl.textContent=String(score); }
        else if (res.w===-1){ score=0; scoreEl.textContent='0'; }
      }
      endRound(res.w===1 ? '¡Victoria!' : res.w===-1 ? 'Derrota' : 'Fin');
      draw(); return;
    }
    if (isDraw(board)){ endRound('Empate'); draw(); return; }
    turn = -turn;
    draw();
    maybeCpuMove();
  }
  function maybeCpuMove(){
    if (!running || paused || gameOver) return;
    if (modeSel.value==='pvp') return;
    if (turn===-1) cpuMove();
  }

  // Entrada
  canvas.addEventListener('click', (e)=>{
    if (!running || paused || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX-rect.left) * (canvas.width/rect.width) / DPR;
    const y = (e.clientY-rect.top)  * (canvas.height/rect.height) / DPR;
    const cell = pickCell(x,y);
    if (cell!=null) place(cell, turn);
  });

  function pickCell(px,py){
    const size = Math.min(canvas.width/DPR, canvas.height/DPR);
    const offX = Math.floor((canvas.width/DPR - size)/2);
    const offY = Math.floor((canvas.height/DPR - size)/2);
    const cx = Math.floor((px - offX) / (size/3));
    const cy = Math.floor((py - offY) / (size/3));
    if (cx>=0 && cx<3 && cy>=0 && cy<3) return cy*3 + cx;
    return null;
    }

  document.addEventListener('keydown',(e)=>{
    const k=e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Spacebar','Enter','r','R','p','P'].includes(k)) e.preventDefault();
    const row = Math.floor(selection/3), col = selection%3;
    if (k==='ArrowUp')    selection = ((row+2)%3)*3 + col;
    if (k==='ArrowDown')  selection = ((row+1)%3)*3 + col;
    if (k==='ArrowLeft')  selection = row*3 + ((col+2)%3);
    if (k==='ArrowRight') selection = row*3 + ((col+1)%3);
    if (k==='Enter' || k===' ' || k==='Spacebar'){ if (running && !paused && !gameOver) place(selection, turn); }
    if (k==='r' || k==='R') onRestart(e);
    if (k==='p' || k==='P') toggleRun(e);
    draw();
  });

  // D-pad móvil
  root.querySelectorAll('.ttt-d').forEach(b=>{
    const act = b.dataset.act;
    b.addEventListener('click', ev=>{
      ev.preventDefault(); ev.stopPropagation();
      const row = Math.floor(selection/3), col = selection%3;
      if (act==='up')    selection = ((row+2)%3)*3 + col;
      if (act==='down')  selection = ((row+1)%3)*3 + col;
      if (act==='left')  selection = row*3 + ((col+2)%3);
      if (act==='right') selection = row*3 + ((col+1)%3);
      if (act==='place'){ if (!running) startRun(); if (running && !paused && !gameOver) place(selection, turn); }
      draw();
    });
  });

  // Botones
  function bind(el, handler){
    el.addEventListener('pointerdown', ev=>{ ev.preventDefault(); ev.stopPropagation(); });
    el.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); handler(ev); });
  }
  bind(btnStart, toggleRun);
  bind(btnRestart, onRestart);
  bind(overlayBtn, ()=>{ if (gameOver) { onRestart(); startRun(); } else startRun(); });
  overlay.addEventListener('click', (e)=>{ if (e.target===overlay){ if (gameOver){ onRestart(e); startRun(); } else startRun(); } });

  // Cambios de opciones → se aplican a la siguiente partida
  modeSel.addEventListener('change', ()=>{ /* next round */ });
  firstSel.addEventListener('change', ()=>{ /* next round */ });

  // Pausa por visibilidad
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden && running) pauseRun(); });

  // Render
  function draw(){
    const Wp = canvas.width/DPR, Hp = canvas.height/DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    // Fondo negro
    ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#000';
    ctx.fillRect(0,0,Wp,Hp);

    const size = Math.min(Wp,Hp);
    const offX = Math.floor((Wp - size)/2);
    const offY = Math.floor((Hp - size)/2);
    const cell = size/3;

    // Rejilla
    ctx.strokeStyle='rgba(255,255,255,.25)';
    ctx.lineWidth = Math.max(2, Math.floor(cell*0.04));
    for (let i=1;i<3;i++){
      // verticales
      ctx.beginPath(); ctx.moveTo(offX + i*cell, offY + 0); ctx.lineTo(offX + i*cell, offY + size); ctx.stroke();
      // horizontales
      ctx.beginPath(); ctx.moveTo(offX + 0, offY + i*cell); ctx.lineTo(offX + size, offY + i*cell); ctx.stroke();
    }

    // Selección (si turno humano o PVP)
    if (!gameOver && running && !paused && (modeSel.value==='pvp' || turn===1)){
      const sx = offX + (selection%3)*cell, sy = offY + Math.floor(selection/3)*cell;
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.fillRect(sx, sy, cell, cell);
    }

    // Fichas
    for (let i=0;i<9;i++){
      const v = board[i]; if (v===0) continue;
      const cx = offX + (i%3)*cell + cell/2;
      const cy = offY + Math.floor(i/3)*cell + cell/2;
      const r  = cell*0.28;
      if (v===1){ // X
        ctx.strokeStyle = getCss('--x-color'); ctx.lineWidth=Math.max(3, cell*0.08);
        ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(cx-r,cy-r); ctx.lineTo(cx+r,cy+r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+r,cy-r); ctx.lineTo(cx-r,cy+r); ctx.stroke();
      } else {   // O
        ctx.strokeStyle = getCss('--o-color'); ctx.lineWidth=Math.max(3, cell*0.08);
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      }
    }

    // Línea ganadora
    if (winLine){
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = Math.max(5, cell*0.1);
      const [a,b,c] = winLine;
      const p = idxToCenter(a, offX, offY, cell);
      const q = idxToCenter(c, offX, offY, cell);
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
      ctx.restore();
    }
  }
  function getCss(name){
    return getComputedStyle(root).getPropertyValue(name).trim() ||
           getComputedStyle(canvas).getPropertyValue(name).trim() || '#fff';
  }
  function idxToCenter(i, offX, offY, cell){
    const x = offX + (i%3)*cell + cell/2;
    const y = offY + Math.floor(i/3)*cell + cell/2;
    return {x,y};
  }

  // Boot
  bestEl.textContent = String(getBest());
  resetGame(); resizeCanvas(); draw();
  setOverlayButton('Empezar'); showOverlay(true,'Listo');

})();
</script>
<!-- === /TIC-TAC-TOE === -->
