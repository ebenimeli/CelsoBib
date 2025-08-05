document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.marquee-container');
  if (!container) return;

  const marquee    = container.querySelector('.marquee');
  const textHolder = marquee.querySelector('.marquee-text');
  const items      = Array.from(
    container.querySelectorAll('.marquee-items .text-item')
  );
  if (items.length === 0) return;

  const speed = 80; // px/seg
  let current = 0, contW, textW, x, lastTime;

  function showText(idx) {
    // Limpia y clona
    textHolder.innerHTML = '';
    const clone = items[idx].cloneNode(true);
    textHolder.appendChild(clone);

    // Detecta categoría y ajústala en la clase de marquee
    marquee.classList.remove('status','urgent');
    if (clone.classList.contains('urgent')) {
      marquee.classList.add('urgent');
    } else {
      marquee.classList.add('status');
    }

    // Recalculamos dimensiones
    contW = marquee.clientWidth;
    textW = textHolder.scrollWidth;
    x     = contW;
    textHolder.style.transform = `translateX(${x}px)`;

    // Preparar animación
    lastTime = null;
  }

  function step(ts) {
    if (!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;

    x -= speed * (delta / 1000);
    if (x < -textW) {
      current = (current + 1) % items.length;
      showText(current);
    } else {
      textHolder.style.transform = `translateX(${x}px)`;
    }
    requestAnimationFrame(step);
  }

  // Arranca
  showText(current);
  requestAnimationFrame(step);

  // Reinicia al redimensionar
  window.addEventListener('resize', () => {
    showText(current);
  });
});
