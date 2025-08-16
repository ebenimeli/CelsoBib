// assets/js/submenus.js
document.addEventListener('DOMContentLoaded', () => {
  const mainMenu    = document.getElementById('main-menu');
  const placeholder = document.getElementById('submenu');

  function animateMaxHeight(el, px) {
    el.style.maxHeight = `${px}px`;
  }

  function onTransitionEndOnce(el, cb) {
    const handler = (ev) => {
      if (ev.propertyName === 'max-height') {
        el.removeEventListener('transitionend', handler);
        cb && cb();
      }
    };
    el.addEventListener('transitionend', handler);
  }

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

    placeholder.innerHTML       = src.innerHTML;
    placeholder.dataset.current = id;

    placeholder.classList.add('show');
    animateMaxHeight(placeholder, 0);

    requestAnimationFrame(() => {
      const target = placeholder.scrollHeight;
      if (target === 0) return;

      animateMaxHeight(placeholder, target);
      settleHeight(placeholder);

      // 🔁 IMPORTANTE EN iOS: NO pasar a 'none'. Mantener el valor en px.
      // onTransitionEndOnce(placeholder, () => { placeholder.style.maxHeight = 'none'; });
    });

    const t = mainMenu.querySelector(`a[data-submenu="${id}"]`);
    mainMenu.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
    if (t) t.setAttribute('aria-expanded', 'true');
  }

  function hideSubmenu() {
    if (!placeholder.classList.contains('show')) return;

    const current = placeholder.scrollHeight;
    placeholder.style.maxHeight = `${current}px`;
    void placeholder.offsetHeight;
    animateMaxHeight(placeholder, 0);

    onTransitionEndOnce(placeholder, () => {
      placeholder.classList.remove('show');
      placeholder.innerHTML = '';
      delete placeholder.dataset.current;
      animateMaxHeight(placeholder, 0);
      mainMenu.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
    });
  }

  (function openByPath() {
    const file = window.location.pathname.split('/').pop();
    const base = file.replace(/\.html$/i, '').split('_')[0];
    if (!base) return;
    const link = mainMenu.querySelector(`a[data-submenu="${base}"]`);
    if (link) showSubmenu(base);
  })();

  mainMenu.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const submenuId = link.dataset.submenu;
    if (!submenuId) return;
    e.preventDefault();

    if (placeholder.dataset.current === submenuId && placeholder.classList.contains('show')) {
      hideSubmenu();
    } else {
      showSubmenu(submenuId);
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#main-menu a[data-submenu]') &&
        !e.target.closest('#submenu')) {
      hideSubmenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSubmenu();
  });

  // 🔁 Reajusta altura cuando cambie el viewport
  ['resize','orientationchange'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (placeholder.classList.contains('show')) {
        animateMaxHeight(placeholder, placeholder.scrollHeight);
        settleHeight(placeholder);
      }
    });
  });

  // 🔁 Y si el contenido cambia tamaño (carga de fuentes/emojis)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (placeholder.classList.contains('show')) {
        animateMaxHeight(placeholder, placeholder.scrollHeight);
      }
    });
    ro.observe(placeholder);
  }
});
