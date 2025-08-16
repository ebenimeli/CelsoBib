document.addEventListener('DOMContentLoaded', () => {
  const labelBox = document.getElementById('iconlabel');
  if (!labelBox) return;

  const DEFAULT_LABEL = "Hola, mundo";
  labelBox.textContent = DEFAULT_LABEL;

  const SELECTOR = '#main-menu a, #submenu a';

  function setLabelFrom(el) {
    const label = el.dataset.label || el.title || el.getAttribute('aria-label') || '';
    labelBox.textContent = label || DEFAULT_LABEL;
  }

  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });

  document.addEventListener('focusin', (e) => {
    const a = e.target.closest(SELECTOR);
    if (a) setLabelFrom(a);
  });
});
