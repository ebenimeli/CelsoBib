// assets/js/submenus.js
(() => {
  if (window.__SUBMENUS_INIT__) return;
  window.__SUBMENUS_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const stage       = document.querySelector('.menu-stage'); // wrapper de todos los navmenu (no .sub)
    const placeholder = document.getElementById('submenu');    // donde se inyecta el submenú
    const iconLabelEl = document.getElementById('iconlabel');
    const defaultLabel = iconLabelEl ? iconLabelEl.textContent : '';
    const TRANS_MS    = 600;
    const STORE_KEY   = 'activeMenuIndex';

    if (!stage) { console.warn('[submenus] Falta .menu-stage'); return; }

    // --- Recoge TODOS los navmenu hijos directos (excluye .sub) ---
    let navs = Array.from(stage.querySelectorAll(':scope > .navmenu:not(.sub)'));
    if (!navs.length) {
      // Fallback si :scope no está soportado
      navs = Array.from(stage.children).filter(el => el.classList?.contains('navmenu') && !el.classList.contains('sub'));
    }
    if (!navs.length) { console.warn('[submenus] No hay navmenu dentro de .menu-stage'); return; }

    // --- Utils ---
    const clampIndex   = (i) => (isFinite(i) && i >= 0 && i < navs.length) ? i : 0;
    const getStoredIdx = () => clampIndex(parseInt(localStorage.getItem(STORE_KEY) || '0', 10));
    const setStoredIdx = (i) => localStorage.setItem(STORE_KEY, String(clampIndex(i)));

    const animateMaxHeight = (el, px) => { el.style.maxHeight = `${px}px`; };
    const onTransitionEndOnce = (el, cb) => {
      const h = (ev) => { if (ev.propertyName === 'max-height') { el.removeEventListener('transitionend', h); cb && cb(); } };
      el.addEventListener('transitionend', h);
    };
    const settleHeight = (el) => {
      const h1 = el.scrollHeight;
      requestAnimationFrame(() => {
        const h2 = el.scrollHeight;
        if (h2 !== h1) animateMaxHeight(el, h2);
      });
    };

    // --- Estado inicial: uno activo, resto a la derecha ---
    let activeIndex = getStoredIdx();
    function normalizeMenus() {
      activeIndex = clampIndex(activeIndex);
      navs.forEach((nav, i) => {
        nav.classList.remove('active', 'exit-left', 'enter-right');
        if (i === activeIndex) nav.classList.add('active');
        else nav.classList.add('enter-right');
      });
    }
    normalizeMenus();

    // --- Submenús ---
    function showSubmenu(id) {
      if (!placeholder) return;
      const src = document.getElementById(id);
      if (!src) return;

      placeholder.innerHTML       = src.innerHTML; // clona contenido
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

      // aria-expanded en todos los menús
      navs.forEach(m => {
        m.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false'));
        const t = m.querySelector(`a[data-submenu="${id}"]`);
        if (t) t.setAttribute('aria-expanded', 'true');
      });
    }

    function hideSubmenu() {
      if (!placeholder || !placeholder.classList.contains('show')) return;
      const current = placeholder.scrollHeight;
      placeholder.style.maxHeight = `${current}px`;
      void placeholder.offsetHeight; // reflow
      animateMaxHeight(placeholder, 0);
      onTransitionEndOnce(placeholder, () => {
        placeholder.classList.remove('show');
        placeholder.innerHTML = '';
        delete placeholder.dataset.current;
        animateMaxHeight(placeholder, 0);
        navs.forEach(m => m.querySelectorAll('a[data-submenu]').forEach(a => a.setAttribute('aria-expanded', 'false')));
      });
    }

    // --- Abrir por URL (opcional) ---
    (function openByPath() {
      const file = window.location.pathname.split('/').pop();   // "cv_work.html"
      const base = file?.replace(/\.html$/i, '').split('_')[0]; // "cv"
      if (!base) return;
      const exists = navs.some(m => m.querySelector(`a[data-submenu="${base}"]`));
      if (exists) showSubmenu(base);
    })();

    // --- Alternar menús (cíclico) ---
    function toggleToIndex(nextIndex) {
      nextIndex = clampIndex(nextIndex);
      if (nextIndex === activeIndex || navs.length < 2) return;

      const from = navs[activeIndex];
      const to   = navs[nextIndex];

      hideSubmenu();

      // Estado inicial del que entra
      to.classList.remove('active', 'exit-left');
      to.classList.add('enter-right');
      void to.offsetWidth; // reflow

      // Saca el actual
      from.classList.remove('active');
      from.classList.add('exit-left');

      // Trae el nuevo
      requestAnimationFrame(() => {
        to.classList.remove('enter-right');
        to.classList.add('active');
      });

      // Limpieza y persistencia
      setTimeout(() => {
        from.classList.remove('exit-left');
        from.classList.add('enter-right');
      }, TRANS_MS);

      activeIndex = nextIndex;
      setStoredIdx(activeIndex);
    }

    // --- Iconlabel: delegación para *todos* los menús y el submenú ---
    function labelFor(a) {
      return (a.getAttribute('data-label') || a.title || a.textContent || '').trim();
    }
    function setIconLabel(text) {
      if (iconLabelEl && text) iconLabelEl.textContent = text;
    }
    function resetIconLabel() {
      if (iconLabelEl) iconLabelEl.textContent = defaultLabel;
    }

    // Cambia el label al pasar por encima o al enfocar
    function handleHoverOrFocus(e) {
      const a = e.target.closest('a');
      if (!a) return;
      const lbl = labelFor(a);
      if (lbl) setIconLabel(lbl);
    }
    // Restablece cuando el puntero sale del área
    function handleLeaveArea() { resetIconLabel(); }
    // Restablece cuando el foco sale de ambas áreas
    function handleFocusOut() {
      setTimeout(() => {
        const active = document.activeElement;
        if (!stage.contains(active) && !(placeholder && placeholder.contains(active))) {
          resetIconLabel();
        }
      }, 0);
    }

    stage.addEventListener('mouseover', handleHoverOrFocus);
    stage.addEventListener('focusin',  handleHoverOrFocus);
    stage.addEventListener('mouseleave', handleLeaveArea);
    stage.addEventListener('focusout', handleFocusOut);

    if (placeholder) {
      // 🔴 Aquí es donde se arregla tu detalle: también escuchamos el submenú inyectado
      placeholder.addEventListener('mouseover', handleHoverOrFocus);
      placeholder.addEventListener('focusin',  handleHoverOrFocus);
      placeholder.addEventListener('mouseleave', handleLeaveArea);
      placeholder.addEventListener('focusout', handleFocusOut);
    }

    // --- Clicks en TODOS los navs ---
    navs.forEach((menu, i) => {
      menu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Botón "➡️": avanzar al siguiente menú (cíclico)
        if (link.classList.contains('toggle-menu')) {
          e.preventDefault();
          toggleToIndex((activeIndex + 1) % navs.length);
          return;
        }

        const submenuId = link.dataset.submenu;

        if (submenuId) {
          // Abrir/cerrar submenú y persistir menú origen
          e.preventDefault();
          activeIndex = i; setStoredIdx(activeIndex);
          if (placeholder?.dataset.current === submenuId && placeholder.classList.contains('show')) {
            hideSubmenu();
          } else {
            showSubmenu(submenuId);
          }
          return;
        }

        // Enlace normal: persistir menú y navegar
        activeIndex = i; setStoredIdx(activeIndex);
        hideSubmenu();
      });
    });

    // --- Clicks dentro del submenú: persistir menú activo y navegar ---
    if (placeholder) {
      placeholder.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        setStoredIdx(activeIndex); // mantiene el menú actual tras cambiar de página
        // sin preventDefault -> permite navegar
      });
    }

    // --- Cierre por click fuera / ESC / mantener altura ---
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu-stage') && !e.target.closest('#submenu')) hideSubmenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSubmenu(); });

    ['resize','orientationchange'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (placeholder?.classList.contains('show')) {
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
