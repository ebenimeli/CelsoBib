document.addEventListener('DOMContentLoaded', () => {
  const mainMenu    = document.getElementById('main-menu');
  const placeholder = document.getElementById('submenu');

  function showSubmenu(id) {
    const src = document.getElementById(id);
    if (!src) return;
    placeholder.innerHTML             = src.innerHTML;
    placeholder.dataset.current       = id;
    placeholder.classList.add('show');
    localStorage.setItem('submenuOpen', id);
  }

  function hideSubmenu() {
    placeholder.innerHTML             = '';
    placeholder.classList.remove('show');
    delete placeholder.dataset.current;
    localStorage.removeItem('submenuOpen');
  }

  // 1) Al iniciar, reabrir si venía guardado
  const saved = localStorage.getItem('submenuOpen');
  if (saved) showSubmenu(saved);

  // 2) Click en menú principal
  mainMenu.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const id = link.dataset.submenu;
    if (!id) return;       // sin data-submenu → navegación normal
    e.preventDefault();    // solo cancelamos en submenús

    // toggle
    if (placeholder.dataset.current === id) hideSubmenu();
    else showSubmenu(id);
  });

  // 3) Cerrar al click fuera
  document.addEventListener('click', e => {
    if (!e.target.closest('#main-menu a[data-submenu]') &&
        !e.target.closest('#submenu')) {
      hideSubmenu();
    }
  });
});
