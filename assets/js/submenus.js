// assets/js/submenus.js
document.addEventListener('DOMContentLoaded', () => {
  const mainMenu    = document.getElementById('main-menu');
  const placeholder = document.getElementById('submenu');

  // Utilidad: anima altura desde valor actual hasta target (px)
  function animateHeight(el, targetPx) {
    el.style.height = `${targetPx}px`;
  }

  // Limpia la altura en línea tras terminar la transición para permitir contenido fluido
  function onTransitionEndOnce(el, cb) {
    const handler = (ev) => {
      if (ev.propertyName === 'height') {
        el.removeEventListener('transitionend', handler);
        cb && cb();
      }
    };
    el.addEventListener('transitionend', handler);
  }

  function showSubmenu(id) {
    const src = document.getElementById(id);
    if (!src) return;

    // Inserta contenido primero con altura 0 para medir después
    placeholder.innerHTML       = src.innerHTML;
    placeholder.dataset.current = id;

    // Forzar estado inicial cerrado antes de medir
    placeholder.classList.add('show');
    placeholder.style.height = '0px';

    // Siguiente frame: medir contenido y animar hasta su scrollHeight
    requestAnimationFrame(() => {
      const target = placeholder.scrollHeight; // altura real del contenido
      // Si no hay contenido, evita animación innecesaria
      if (target === 0) return;

      // Animar
      animateHeight(placeholder, target);

      // Al terminar, limpiar height para que se adapte si cambia el contenido
      onTransitionEndOnce(placeholder, () => {
        placeholder.style.height = 'auto';
      });
    });
  }

  function hideSubmenu() {
    // Si ya está cerrado, nada que hacer
    if (!placeholder.classList.contains('show')) return;

    // Fijar la altura actual (auto -> px) para poder animar a 0
    const current = placeholder.scrollHeight;
    placeholder.style.height = `${current}px`;

    // Forzar reflow para que el navegador aplique el valor actual
    // y la transición a 0 funcione correctamente
    // eslint-disable-next-line no-unused-expressions
    placeholder.offsetHeight;

    // Iniciar animación hacia arriba
    animateHeight(placeholder, 0);

    onTransitionEndOnce(placeholder, () => {
      placeholder.classList.remove('show');
      placeholder.innerHTML = '';
      delete placeholder.dataset.current;
      // Asegura estado limpio
      placeholder.style.height = '0px';
    });
  }

  // 1) Al llegar por URL, extraer antes del "_" y auto-abrir
  (function openByPath() {
    const file = window.location.pathname.split('/').pop();      // e.g. "blog_post.html"
    const base = file.replace(/\.html$/i, '')                    // "blog_post"
                     .split('_')[0];                             // "blog"
    if (!base) return;

    const link = mainMenu.querySelector(`a[data-submenu="${base}"]`);
    if (link) {
      showSubmenu(base);
    }
  })();

  // 2) Toggle al clicar en menú principal
  mainMenu.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    const submenuId = link.dataset.submenu;
    if (!submenuId) {
      // enlace normal → dejamos que navegue
      return;
    }
    e.preventDefault();

    if (placeholder.dataset.current === submenuId) {
      hideSubmenu();
    } else {
      showSubmenu(submenuId);
    }
  });

  // 3) Cerrar al clicar fuera
  document.addEventListener('click', e => {
    if (
      !e.target.closest('#main-menu a[data-submenu]') &&
      !e.target.closest('#submenu')
    ) {
      hideSubmenu();
    }
  });

  // Accesibilidad opcional: cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSubmenu();
  });
});
