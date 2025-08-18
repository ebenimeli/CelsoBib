// assets/js/submenus.js
(() => {
  if (window.__SUBMENUS_INIT__) return;
  window.__SUBMENUS_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.querySelector('.menu-stage');
    const placeholder = document.getElementById('submenu');
    const menu1 = document.getElementById('main-menu');
    const menu2 = document.getElementById('main-menu2');
    const menus = [menu1, menu2].filter(Boolean);
    const TRANS_MS = 600;
    const STORAGE_KEY = 'activeMenu'; // '1' | '2'

    if (!stage || !menu1) { console.warn('[submenus] Falta .menu-stage o #main-menu'); return; }

    /* =============== utils =============== */
    const animateMaxHeight = (el, px) => { el.style.maxHeight = `${px}px`; };
    const onTransitionEndOnce = (el, cb) => {
      const handler = (ev) => {
        if (ev.propertyName === 'max-height') {
          el.removeEventListener('transitionend', handler);
          cb && cb();
        }
      };
      el.addEventListener('transitionend', handler);
    };
    const settleHeight = (el) => {
      const h1 = el.scrollHeight;
      requestAnimationFrame(() => {
        const h2 = el.scrollHeight;
        if (h2 !== h1) animateMaxHeight(el, h2);
      });
    };
    const setActiveMenu = (val) => localStorage.setItem(STORAGE_KEY, val);
    const getActiveMenu = () => localStorage.getItem(STORAGE_KEY) || '1';

    /* =============== estado inicial =============== */
    function normalizeMenus() {
      const desired = getActiveMenu(); // '1' o '2'
      if (desired === '2' && menu2) {
        menu2.classList.add('active');
        menu2.classList.remove('enter-right','exit-left');
        menu1.classList.remove('active','exit-left');
        menu1.classList.add('enter-right');
      } else {
        // por defecto menu1
        menu1.classList.add('active');
        menu1.classList.remove('enter-right','exit-left');
        if (menu2) { menu2.classList.remove('active','exit-left'); menu2.classList.add('enter-right'); }
        setActiveMenu('1');
      }
    }
    normalizeMenus();

    /* =============== submenús =============== */
    function showSubmenu(id) {
      if (!placeholder) return;
      const src = document.getElementById(id);
      if (!src) return;

      placeholder.innerHTML       = src.innerHTML;
      placeholder.dataset.current = id;
      placeholder.classList.add('show');

      animateMaxHeight(placeholder, 0);
      requestAnimationFrame(() => {
        const target = placeholder.scrollHeight;
        if (target > 0) {
          animateMaxHeight(placeholder, target);
          settleHeight(placeholder);
        }
      });

      menus.forEach(m => {
        m.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
        const t = m.querySelector(`a[data-submenu="${id}"]`);
        if (t) t.setAttribute('aria-expanded', 'true');
      });
    }

    function hideSubmenu() {
      if (!placeholder || !placeholder.classList.contains('show')) return;

      const current = placeholder.scrollHeight;
      placeholder.style.maxHeight = `${current}px`;
      void placeholder.offsetHeight;
      animateMaxHeight(placeholder, 0);

      onTransitionEndOnce(placeholder, () => {
        placeholder.classList.remove('show');
        placeholder.innerHTML = '';
        delete placeholder.dataset.current;
        animateMaxHeight(placeholder, 0);
        menus.forEach(m => m.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false')));
      });
    }

    /* =============== abrir por URL (opcional) =============== */
    (function openByPath() {
      const file = window.location.pathname.split('/').pop();
      const base = file.replace(/\.html$/i, '').split('_')[0];
      if (!base) return;
      for (const m of menus) {
        if (m && m.querySelector(`a[data-submenu="${base}"]`)) { showSubmenu(base); break; }
      }
    })();

    /* =============== alternar menús =============== */
    function toggleMenus(from, to) {
      if (!to || !from) return;
      hideSubmenu();

      to.classList.remove('active','exit-left');
      to.classList.add('enter-right');
      void to.offsetWidth;

      from.classList.remove('active');
      from.classList.add('exit-left');

      requestAnimationFrame(() => {
        to.classList.remove('enter-right');
        to.classList.add('active');
      });

      setTimeout(() => {
        from.classList.remove('exit-left');
        from.classList.add('enter-right');
      }, TRANS_MS);

      setActiveMenu(to === menu2 ? '2' : '1');
    }

    function toggleBetweenMenus() {
      if (menu2 && menu1.classList.contains('active')) toggleMenus(menu1, menu2);
      else if (menu2 && menu2.classList.contains('active')) toggleMenus(menu2, menu1);
      else normalizeMenus();
    }

    /* =============== eventos en los menús =============== */
    menus.forEach(menu => {
      menu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Flecha
        if (link.classList.contains('toggle-menu')) {
          e.preventDefault();
          toggleBetweenMenus();
          return;
        }

        const fromMenu2 = menu === menu2;
        const submenuId = link.dataset.submenu;

        if (submenuId) {
          // Abrir/cerrar submenú y persistir menú origen
          e.preventDefault();
          setActiveMenu(fromMenu2 ? '2' : '1');
          if (placeholder.dataset.current === submenuId && placeholder.classList.contains('show')) {
            hideSubmenu();
          } else {
            showSubmenu(submenuId);
          }
          return;
        }

        // Enlace normal: persistir menú origen y dejar navegar
        setActiveMenu(fromMenu2 ? '2' : '1');
        hideSubmenu();
      });
    });

    /* =============== clicks en el submenú =============== */
    if (placeholder) {
      placeholder.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        // Persistir el menú ACTIVO antes de navegar (clave para mantener navmenu2)
        const activeIs2 = menu2 && menu2.classList.contains('active');
        setActiveMenu(activeIs2 ? '2' : '1');
        // No hacemos preventDefault -> navega
      });
    }

    /* =============== click fuera / ESC / resize =============== */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-stage') && !e.target.closest('#submenu')) hideSubmenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSubmenu(); });

    ['resize','orientationchange'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (placeholder && placeholder.classList.contains('show')) {
          animateMaxHeight(placeholder, placeholder.scrollHeight);
          settleHeight(placeholder);
        }
      });
    });

    if ('ResizeObserver' in window && placeholder) {
      const ro = new ResizeObserver(() => {
        if (placeholder.classList.contains('show')) {
          animateMaxHeight(placeholder, placeholder.scrollHeight);
        }
      });
      ro.observe(placeholder);
    }
  });
})();
