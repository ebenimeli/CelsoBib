document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.post-list.status, .post-list.urgent');
  const marquee   = container.querySelector('.marquee');
  const speed     = 80; // px/s

  // --- estilos necesarios desde JS ---
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  marquee.style.position    = 'absolute';
  marquee.style.whiteSpace  = 'nowrap';
  marquee.style.display     = 'inline-block';   // shrink-to-fit + padding
  marquee.style.padding     = '5px';             // 5px alrededor
  marquee.style.boxSizing   = 'content-box';     // padding suma al ancho/alto
  // ------------------------------------------

  let contW, textW, x, lastTime;

  function init() {
    // recalcula anchos teniendo en cuenta el padding
    contW = container.clientWidth;
    textW = marquee.scrollWidth;                 // ancho real del contenido + padding
    x     = contW;                               // arrancamos desde la derecha

    // ajusta la altura del contenedor para mostrar el padding vertical
    container.style.height = marquee.clientHeight + 'px';

    marquee.style.transform = `translateX(${x}px)`;
    lastTime = null;
    requestAnimationFrame(step);
  }

  function step(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime    = ts;

    x -= speed * (delta / 1000);
    if (x < -textW) x = contW;                   // cuando sale, vuelve a la derecha

    marquee.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(step);
  }

  init();
  window.addEventListener('resize', init);
});
