
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.post-list.status');
  const marquee   = container.querySelector('.marquee');
  const speed     = 80;         // píxeles por segundo (ajusta velocidad)
  let contW, textW, x, lastTime;

  function init() {
    contW = container.clientWidth;
    textW = marquee.clientWidth;
    x     = contW;              // empezamos fuera a la derecha
    marquee.style.transform = `translateX(${x}px)`;
    lastTime = null;
    requestAnimationFrame(step);
  }

  function step(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    // desplazamos hacia la izquierda
    x -= speed * delta / 1000;

    // cuando termine de salir por la izquierda, reiniciamos a la derecha
    if (x < -textW) {
      x = contW;
    }
    marquee.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(step);
  }

  // arrancamos
  init();

  // si redimensionan la ventana, recalcula anchos
  window.addEventListener('resize', init);
});
