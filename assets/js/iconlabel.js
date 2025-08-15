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

  // Hover
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });

  document.addEventListener('mouseout', (e) => {
    const from = e.target.closest(SELECTOR);
    if (!from) return;
    const to = e.relatedTarget && e.relatedTarget.closest(SELECTOR);
    if (!to) labelBox.textContent = DEFAULT_LABEL;
  });

  // Accesibilidad: foco con teclado
  document.addEventListener('focusin', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });

  document.addEventListener('focusout', (e) => {
    const from = e.target.closest(SELECTOR);
    if (!from) return;
    const to = e.relatedTarget && e.relatedTarget.closest(SELECTOR);
    if (!to) labelBox.textContent = DEFAULT_LABEL;
  });
});
