// assets/js/submenus.js
document.addEventListener('DOMContentLoaded', () => {
  const mainMenu    = document.getElementById('main-menu');
  const placeholder = document.getElementById('submenu');

  // Escribe max-height en px
  function animateMaxHeight(el, px) {
    el.style.maxHeight = `${px}px`;
  }

  // Espera a que termine la transición de max-height
  function onTransitionEndOnce(el, cb) {
    const handler = (ev) => {
      if (ev.propertyName === 'max-height') {
        el.removeEventListener('transitionend', handler);
        cb && cb();
      }
    };
    el.addEventListener('transitionend', handler);
  }

  // Segunda medición por si cambian wrapping/fuentes/emoji
  function settleHeight(el) {
    const h1 = el.scrollHeight;
    requestAnimationFrame(() => {
      const h2 = el.scrollHeight;
      if (h2 !== h1) animateMaxHeight(el, h2);
    });
  }

  function showSubmenu(id) {
    const src = document.getElementById(id);
    if (!src) return;

    // Inyecta contenido y marca cuál está activo
    placeholder.innerHTML       = src.innerHTML;
    placeholder.dataset.current = id;

    // Estado visible y colapsado para animar
    placeholder.classList.add('show');
    animateMaxHeight(placeholder, 0);

    // Siguiente frame: mide y anima
    requestAnimationFrame(() => {
      const target = placeholder.scrollHeight;
      if (target === 0) return;

      animateMaxHeight(placeholder, target);
      settleHeight(placeholder);

      // Cuando termine la transición, “libera” limitación:
      onTransitionEndOnce(placeholder, () => {
        // Deja crecer libremente, sin recortes
        placeholder.style.maxHeight = 'none';
      });
    });

    // Accesibilidad
    const t = mainMenu.querySelector(`a[data-submenu="${id}"]`);
    mainMenu.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
    if (t) t.setAttribute('aria-expanded', 'true');
  }

  function hideSubmenu() {
    if (!placeholder.classList.contains('show')) return;

    // Volver a bloquear a la altura actual para poder animar a 0
    const current = placeholder.scrollHeight;
    placeholder.style.maxHeight = `${current}px`;

    // Fuerza reflow
    void placeholder.offsetHeight;

    // Animar hacia 0
    animateMaxHeight(placeholder, 0);

    onTransitionEndOnce(placeholder, () => {
      placeholder.classList.remove('show');
      placeholder.innerHTML = '';
      delete placeholder.dataset.current;
      // Estado limpio
      animateMaxHeight(placeholder, 0);
      // Accesibilidad
      mainMenu.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
    });
  }

  // 1) Abrir por URL (p.ej. write_*)
  (function openByPath() {
    const file = window.location.pathname.split('/').pop();
    const base = file.replace(/\.html$/i, '').split('_')[0];
    if (!base) return;
    const link = mainMenu.querySelector(`a[data-submenu="${base}"]`);
    if (link) showSubmenu(base);
  })();

  // 2) Toggle con click en el menú principal
  mainMenu.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    const submenuId = link.dataset.submenu;
    if (!submenuId) return; // enlace normal: navegar
    e.preventDefault();

    if (placeholder.dataset.current === submenuId && placeholder.classList.contains('show')) {
      hideSubmenu();
    } else {
      showSubmenu(submenuId);
    }
  });

  // 3) Cerrar al clicar fuera
  document.addEventListener('click', e => {
    if (!e.target.closest('#main-menu a[data-submenu]') &&
        !e.target.closest('#submenu')) {
      hideSubmenu();
    }
  });

  // 4) Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSubmenu();
  });

  // 5) Reajustar altura al cambiar viewport
  ['resize','orientationchange'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (placeholder.classList.contains('show')) {
        // Si está en 'none' (liberado), vuelve a medir y fijar 'none' después
        const isNone = placeholder.style.maxHeight === 'none';
        if (isNone) placeholder.style.maxHeight = `${placeholder.scrollHeight}px`;
        animateMaxHeight(placeholder, placeholder.scrollHeight);
        settleHeight(placeholder);
        if (isNone) {
          onTransitionEndOnce(placeholder, () => {
            placeholder.style.maxHeight = 'none';
          });
        }
      }
    });
  });

  // 6) Cambios dinámicos internos (por ejemplo fuentes cargando)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (placeholder.classList.contains('show')) {
        if (placeholder.style.maxHeight !== 'none') {
          animateMaxHeight(placeholder, placeholder.scrollHeight);
        }
      }
    });
    ro.observe(placeholder);
  }
});
