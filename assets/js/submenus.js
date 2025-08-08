// assets/js/submenus.js
document.addEventListener('DOMContentLoaded', () => {
  const mainMenu    = document.getElementById('main-menu');
  const placeholder = document.getElementById('submenu');

  function showSubmenu(id) {
    const src = document.getElementById(id);
    if (!src) return;
    placeholder.innerHTML       = src.innerHTML;
    placeholder.dataset.current = id;
    placeholder.classList.add('show');
  }

  function hideSubmenu() {
    placeholder.innerHTML       = '';
    placeholder.classList.remove('show');
    delete placeholder.dataset.current;
  }

  // 1) Al llegar por URL, extraer antes del "_" y auto-abrir
  (function openByPath() {
    const file = window.location.pathname.split('/').pop();      // e.g. "blog_post.html"
    const base = file.replace(/\.html$/, '')                      // "blog_post"
                     .split('_')[0];                              // "blog"
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
});
