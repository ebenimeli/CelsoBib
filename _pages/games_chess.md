---
layout: page
title: "♟️ Ajedrez"
description: "Practica los movimientos"
---

<!-- === CHESS PRACTICE === -->
<div id="chess-game">
  <div class="game-bar">
    <strong>♟️ Ajedrez básico</strong>
    <div class="game-scorebox">
      Modo:
      <select id="ch-mode">
        <option value="free" selected>Libre</option>
        <option value="turns">Turnos</option>
      </select>
      <label style="margin-left:.5rem">
        <input type="checkbox" id="ch-show" checked>
        Mostrar movimientos
      </label>
      <button id="ch-flip" class="btn">↕ Invertir</button>
      <button id="ch-start" class="btn">▶︎/⏸</button>
      <button id="ch-restart" class="btn">⟲</button>
    </div>
  </div>

  <div class="game-canvas-wrap">
    <canvas id="ch-canvas"></canvas>

    <!-- Overlay centrado -->
    <div class="game-overlay" id="ch-overlay">
      <div class="game-overlay-card">
        <div id="ch-status-text">Empezar</div>
        <p style="margin:.5rem 0 1rem 0;font-size:.95rem;opacity:.9">
          Haz clic en una pieza para ver movimientos legales.<br>
          Modo <em>Libre</em>: puedes mover cualquier color.<br>
          Modo <em>Turnos</em>: blancas y negras alternan.<br>
          (Sin jaques, enroque ni en passant; promoción a dama).
        </p>
        <button id="ch-overlay-btn" class="btn btn-primary">Jugar</button>
      </div>
    </div>
  </div>

  <p class="game-help">Clic para seleccionar/mover. Teclado: F (invertir), R (reiniciar), Espacio/P (pausa).</p>
</div>

<style>
#chess-game {
  max-width: 540px;
  margin: 1rem auto;
  background: #fff;
  padding: .5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
#chess-game canvas {
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
  max-width: 28rem;
}
.btn { padding: .25rem .5rem; border: 1px solid #333; background: #eee; cursor: pointer; }
.btn-primary { background: #22c55e; color: #fff; border: none; }
.game-controls { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; }
.game-scorebox { display:flex; align-items:center; gap:.25rem; flex-wrap:wrap; }
</style>

<script>
document.addEventListener("DOMContentLoaded", () => {
  const canvas   = document.getElementById("ch-canvas");
  const ctx      = canvas.getContext("2d");
  const modeSel  = document.getElementById("ch-mode");
  const showChk  = document.getElementById("ch-show");
  const btnFlip  = document.getElementById("ch-flip");
  const btnStart = document.getElementById("ch-start");
  const btnRestart = document.getElementById("ch-restart");
  const overlay  = document.getElementById("ch-overlay");
  const overlayBtn = document.getElementById("ch-overlay-btn");
  const statusTxt = document.getElementById("ch-status-text");

  let W=0,H=0, SQ=0, running=false, paused=false, gameOver=false;
  let flipped=false; // false: blancas abajo (estándar)
  const N=8;

  // Representación: strings "wP","wN","wB","wR","wQ","wK" y "b*"; null vacío
  let board = Array.from({length:N}, ()=>Array(N).fill(null));
  let turn = 'w'; // en modo "turns"
  let sel = null; // {r,c} lógicas
  let legal = []; // [{r,c}] lógicas

  // Glifos: peón negro usa la MISMA forma que el peón blanco
  const pieceGlyph = {
    wP:"\u2659", wN:"\u2658", wB:"\u2657", wR:"\u2656", wQ:"\u2655", wK:"\u2654",
    bP:"\u2659", bN:"\u265E", bB:"\u265D", bR:"\u265C", bQ:"\u265B", bK:"\u265A"
  };

  function resize(){
    const w = Math.floor(canvas.parentElement.offsetWidth);
    canvas.width = w; canvas.height = w; W=w; H=w; SQ=w/N;
    draw();
  }

  function setupInitial(){
    board = Array.from({length:N}, ()=>Array(N).fill(null));
    const backW = ["wR","wN","wB","wQ","wK","wB","wN","wR"];
    const backB = ["bR","bN","bB","bQ","bK","bB","bN","bR"];
    board[7] = backW.slice();
    board[6] = Array(N).fill("wP");
    board[1] = Array(N).fill("bP");
    board[0] = backB.slice();
    for(let r=2;r<=5;r++){ board[r] = Array(N).fill(null); }
    turn = 'w'; sel=null; legal=[];
  }

  // --- Mapeos lógico <-> visual ---
  function mapRC(r,c){
    return flipped ? {vr: N-1-r, vc: N-1-c} : {vr:r, vc:c};
  }
  function cellRect(r,c){
    const {vr,vc} = mapRC(r,c);
    return { x: vc*SQ, y: vr*SQ, w: SQ, h: SQ };
  }

  // --- Dibujo ---
  function drawBoard(){
    // por índices visuales para mantener patrón correcto
    for(let vr=0; vr<N; vr++){
      for(let vc=0; vc<N; vc++){
        const light = ((vr+vc)%2===0);
        ctx.fillStyle = light ? "#f2d6b3" : "#b58863";
        ctx.fillRect(vc*SQ, vr*SQ, SQ, SQ);
      }
    }
  }

  function drawHighlights(){
    if(sel){
      ctx.fillStyle = "rgba(255,255,0,0.25)";
      const {x,y,w,h} = cellRect(sel.r, sel.c);
      ctx.fillRect(x,y,w,h);
    }
    if(showChk.checked){
      ctx.fillStyle = "rgba(50,205,50,0.4)";
      for(const m of legal){
        const {x,y} = cellRect(m.r,m.c);
        ctx.beginPath();
        ctx.arc(x+SQ/2, y+SQ/2, SQ*0.18, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  function drawPieces(){
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${Math.floor(SQ*0.7)}px system-ui, 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    for(let r=0;r<N;r++){
      for(let c=0;c<N;c++){
        const p = board[r][c];
        if(!p) continue;
        const glyph = pieceGlyph[p];
        const {x,y} = cellRect(r,c);
        // color de relleno
        ctx.fillStyle = (p[0]==='w') ? "#fff" : "#111";
        // contorno: oscuro para blancas, claro para negras
        ctx.strokeStyle = (p[0]==='w') ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.strokeText(glyph, x+SQ/2, y+SQ/2);
        ctx.fillText(glyph,   x+SQ/2, y+SQ/2);
      }
    }
  }

  function drawCoords(){
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.font = `${Math.floor(SQ*0.18)}px system-ui, sans-serif`;
    const files = flipped ? "hgfedcba" : "abcdefgh";
    for(let vc=0; vc<N; vc++){
      ctx.fillText(files[vc], vc*SQ+SQ-10, H-6);
    }
    for(let vr=0; vr<N; vr++){
      const rank = flipped ? (vr+1) : (N-vr);
      ctx.fillText(String(rank), 8, vr*SQ+14);
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    drawBoard();
    drawHighlights();
    drawPieces();
    drawCoords();
  }

  // --- Lógica de movimientos ---
  function inBounds(r,c){ return r>=0 && r<N && c>=0 && c<N; }
  function colorOf(p){ return p ? p[0] : null; }
  function typeOf(p){ return p ? p[1] : null; }

  function squaresRay(r,c, dr,dc, side){
    const moves=[];
    let i=1;
    while(true){
      const rr=r+dr*i, cc=c+dc*i;
      if(!inBounds(rr,cc)) break;
      const q=board[rr][cc];
      if(q){
        if(colorOf(q)!==side) moves.push({r:rr,c:cc}); // captura
        break;
      }else{
        moves.push({r:rr,c:cc});
      }
      i++;
    }
    return moves;
  }

  function legalMovesFor(r,c){
    const p = board[r][c]; if(!p) return [];
    const side = colorOf(p), t=typeOf(p);
    const moves=[];
    if(t==="P"){
      const dir = (side==='w') ? -1 : +1;
      const startRow = (side==='w') ? 6 : 1;
      // 1 paso
      const r1 = r+dir;
      if(inBounds(r1,c) && !board[r1][c]) {
        moves.push({r:r1,c});
        // 2 pasos
        const r2 = r+2*dir;
        if(r===startRow && !board[r2]?.[c]) moves.push({r:r2,c});
      }
      // capturas
      for(const dc of [-1, +1]){
        const rr=r+dir, cc=c+dc;
        if(inBounds(rr,cc) && board[rr][cc] && colorOf(board[rr][cc])!==side){
          moves.push({r:rr,c:cc});
        }
      }
      // promoción al mover
    } else if(t==="N"){ // caballo
      const K=[[+2,+1],[+2,-1],[-2,+1],[-2,-1],[+1,+2],[+1,-2],[-1,+2],[-1,-2]];
      for(const [dr,dc] of K){
        const rr=r+dr,cc=c+dc;
        if(!inBounds(rr,cc)) continue;
        const q=board[rr][cc];
        if(!q || colorOf(q)!==side) moves.push({r:rr,c:cc});
      }
    } else if(t==="B"){ // alfil
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{
        moves.push(...squaresRay(r,c,dr,dc, side));
      });
    } else if(t==="R"){ // torre
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{
        moves.push(...squaresRay(r,c,dr,dc, side));
      });
    } else if(t==="Q"){ // dama
      [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{
        moves.push(...squaresRay(r,c,dr,dc, side));
      });
    } else if(t==="K"){ // rey (sin enroque)
      for(let dr=-1;dr<=1;dr++){
        for(let dc=-1;dc<=1;dc++){
          if(dr===0 && dc===0) continue;
          const rr=r+dr, cc=c+dc;
          if(!inBounds(rr,cc)) continue;
          const q=board[rr][cc];
          if(!q || colorOf(q)!==side) moves.push({r:rr,c:cc});
        }
      }
    }
    return moves;
  }

  function applyMove(from,to){
    const p = board[from.r][from.c];
    board[to.r][to.c] = p;
    board[from.r][from.c] = null;
    // promoción simple a dama
    if(typeOf(p)==="P"){
      if(colorOf(p)==='w' && to.r===0) board[to.r][to.c] = "wQ";
      if(colorOf(p)==='b' && to.r===7) board[to.r][to.c] = "bQ";
    }
  }

  // --- Interacción ---
  function screenToSquare(x,y){
    // visual -> lógica
    const rect = canvas.getBoundingClientRect();
    const cx = (x - rect.left) * (canvas.width / rect.width);
    const cy = (y - rect.top)  * (canvas.height / rect.height);
    let r = Math.floor(cy / SQ);
    let c = Math.floor(cx / SQ);
    if(flipped){
      r = N-1-r;
      c = N-1-c;
    }
    return {r,c};
  }

  function onClickBoard(evt){
    if(!running || paused) return;
    const {r,c} = screenToSquare(evt.clientX, evt.clientY);
    if(!(r>=0 && r<N && c>=0 && c<N)) return;

    // mover si el clic es un destino legal
    if(sel && legal.some(m => m.r===r && m.c===c)){
      applyMove(sel, {r,c});
      if(modeSel.value==="turns") turn = (turn==='w'?'b':'w');
      sel=null; legal=[];
      draw(); return;
    }

    // seleccionar pieza (respetando modo)
    const p = board[r][c];
    if(!p){ sel=null; legal=[]; draw(); return; }
    if(modeSel.value==="turns" && colorOf(p)!==turn){ sel=null; legal=[]; draw(); return; }
    sel={r,c};
    legal = legalMovesFor(r,c);
    draw();
  }

  // Controles UI
  function startRun(){ running=true; paused=false; btnStart.textContent="⏸"; overlay.style.display="none"; }
  function pauseRun(){ paused=true; btnStart.textContent="▶︎"; statusTxt.textContent="Pausa"; overlay.style.display="grid"; }
  function toggleRun(){ running && !paused ? pauseRun() : startRun(); }

  function onRestart(){
    setupInitial(); draw();
    paused=false; running=false; btnStart.textContent="▶︎";
    overlay.style.display="grid"; statusTxt.textContent="Empezar";
  }

  btnStart.addEventListener("click", toggleRun);
  btnRestart.addEventListener("click", onRestart);
  btnFlip.addEventListener("click", ()=>{ flipped=!flipped; draw(); });
  overlayBtn.addEventListener("click", ()=>{ if(!running) startRun(); else toggleRun(); });
  canvas.addEventListener("click", onClickBoard);

  document.addEventListener("keydown",(e)=>{
    const k = e.key.toLowerCase();
    if(k===" " || k==="p"){ e.preventDefault(); toggleRun(); }
    if(k==="r"){ onRestart(); }
    if(k==="f"){ flipped=!flipped; draw(); }
  });

  // init
  resize(); setupInitial(); draw();
  window.addEventListener("resize", ()=>{ resize(); draw(); });
  overlay.style.display="grid"; statusTxt.textContent="Empezar";
});
</script>
<!-- === /CHESS PRACTICE === -->
