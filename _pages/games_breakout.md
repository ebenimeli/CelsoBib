---
layout: page
title: "Breakout"
description: "¡A romper ladrillos!"
---

<!-- === BREAKOUT GAME === -->
<div id="breakout-game" class="bo">
  <div class="game-bar">
    <strong>🧱 Breakout</strong>
    <div class="game-scorebox">
      Puntos: <span id="bo-score">0</span>
      · Mejor: <span id="bo-best">0</span>
    </div>
    <div class="game-controls">
      <button id="bo-start" class="btn">▶︎/⏸</button>
      <button id="bo-restart" class="btn">⟲</button>
      <label>
        Velocidad
        <select id="bo-speed">
          <option value="4">Tranquila</option>
          <option value="6" selected>Normal</option>
          <option value="8">Rápida</option>
          <option value="10">Pro</option>
        </select>
      </label>
    </div>
  </div>

  <div class="game-canvas-wrap">
    <canvas id="bo-canvas"></canvas>
    <div class="game-overlay" id="bo-overlay">
      <div class="game-overlay-card">
        <div id="bo-status-text">Empezar</div>
        <button id="bo-overlay-btn" class="btn btn-primary">Jugar</button>
      </div>
    </div>
  </div>

  <p class="game-help">Usa ← → o A D. Espacio/P pausa. R reinicia.</p>
</div>

<style>
#breakout-game {
  max-width: 540px;
  margin: 1rem auto;
  background: #fff;
  padding: .5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
#breakout-game canvas {
  width: 100%;
  aspect-ratio: 1/1;
  background: #000;
  border-radius: 8px;
  display: block;
}
.game-canvas-wrap {
  position: relative;
}
.game-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
}
.game-overlay-card {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}
.btn {
  padding: .25rem .5rem;
  border: 1px solid #333;
  background: #eee;
  cursor: pointer;
}
.btn-primary {
  background: #22c55e;
  color: #fff;
  border: none;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bo-canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("bo-score");
  const bestEl = document.getElementById("bo-best");
  const btnStart = document.getElementById("bo-start");
  const btnRestart = document.getElementById("bo-restart");
  const speedSel = document.getElementById("bo-speed");
  const overlay = document.getElementById("bo-overlay");
  const overlayBtn = document.getElementById("bo-overlay-btn");
  const statusTxt = document.getElementById("bo-status-text");
  const HS_KEY = "breakout.best";

  let W, H;
  let paddle, ball, bricks, score, running, gameOver;
  const rows = 5, cols = 7;

  function resize() {
    const w = Math.floor(canvas.parentElement.offsetWidth);
    canvas.width = w;
    canvas.height = w;
    W = canvas.width;
    H = canvas.height;
  }

  function resetGame() {
    resize();
    score = 0;
    scoreEl.textContent = "0";
    gameOver = false;
    paddle = { x: W / 2 - 40, y: H - 20, w: 80, h: 10, speed: 30 };
    const s = parseInt(speedSel.value, 10) || 6;
    ball = { x: W / 2, y: H - 40, r: 6, dx: s, dy: -s };
    bricks = [];
    const bw = W / cols - 6,
      bh = 18;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({ x: c * (bw + 6) + 3, y: r * (bh + 6) + 30, w: bw, h: bh });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#3b82f6";
    bricks.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.beginPath();
    ctx.fillStyle = "#f43f5e";
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function update() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x < ball.r || ball.x > W - ball.r) ball.dx *= -1;
    if (ball.y < ball.r) ball.dy *= -1;
    if (ball.y > H - ball.r) {
      endGame();
      return;
    }

    if (
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.r > paddle.y &&
      ball.y - ball.r < paddle.y + paddle.h
    ) {
      ball.dy *= -1;
      ball.y = paddle.y - ball.r;
    }

    for (let i = bricks.length - 1; i >= 0; i--) {
      const b = bricks[i];
      if (
        ball.x > b.x &&
        ball.x < b.x + b.w &&
        ball.y > b.y &&
        ball.y < b.y + b.h
      ) {
        bricks.splice(i, 1);
        ball.dy *= -1;
        score++;
        scoreEl.textContent = score;
        const best = parseInt(localStorage.getItem(HS_KEY) || "0");
        if (score > best) {
          localStorage.setItem(HS_KEY, score);
          bestEl.textContent = score;
        }
        break;
      }
    }

    if (bricks.length === 0) endGame(true);
  }

  function loop() {
    if (running && !gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  function startRun() {
    running = true;
    btnStart.textContent = "⏸";
    overlay.style.display = "none";
  }

  function pauseRun() {
    running = false;
    btnStart.textContent = "▶︎";
    showOverlay("Pausa");
  }

  function toggleRun() {
    running ? pauseRun() : startRun();
  }

  function endGame(win) {
    running = false;
    gameOver = true;
    btnStart.textContent = "▶︎";
    showOverlay(win ? "¡Ganaste!" : "Game Over");
  }

  function showOverlay(msg) {
    statusTxt.textContent = msg;
    overlay.style.display = "grid";
  }

  function onRestart() {
    resetGame();
    overlay.style.display = "grid";
    statusTxt.textContent = "Empezar";
    btnStart.textContent = "▶︎";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a")
      paddle.x = Math.max(0, paddle.x - paddle.speed);
    if (e.key === "ArrowRight" || e.key === "d")
      paddle.x = Math.min(W - paddle.w, paddle.x + paddle.speed);
    if (e.key === " " || e.key === "p") toggleRun();
    if (e.key === "r") onRestart();
  });

  overlayBtn.addEventListener("click", () => {
    gameOver ? onRestart() : startRun();
  });

  btnStart.addEventListener("click", toggleRun);
  btnRestart.addEventListener("click", onRestart);

  bestEl.textContent = localStorage.getItem(HS_KEY) || "0";

  // Esperamos al siguiente "tick" para iniciar todo
  requestAnimationFrame(() => {
    onRestart();
    requestAnimationFrame(loop);
  });
});
</script>
<!-- === /BREAKOUT GAME === -->
