document.addEventListener('DOMContentLoaded', () => {
  const labelBox = document.getElementById('iconlabel');
  if (!labelBox) return;

  // valor por defecto
  const DEFAULT_LABEL = "Hola, mundo";
  labelBox.textContent = DEFAULT_LABEL;

  const SELECTOR = '#main-menu a, #submenu a';

  function setLabelFrom(el) {
    const label = el.dataset.label || el.title || el.getAttribute('aria-label') || '';
    labelBox.textContent = label || DEFAULT_LABEL;
  }

  // Hover: cambia solo cuando se entra en un elemento válido
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });

  // Eliminamos el "reset" de mouseout → se mantiene último valor

  // Accesibilidad: foco con teclado
  document.addEventListener('focusin', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });

  // También quitamos el "reset" de focusout
});
