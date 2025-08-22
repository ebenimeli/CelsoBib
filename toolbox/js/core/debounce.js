// Tiny debounce utility

/** Debounce: ensure fn runs after "delay" ms without new calls */
export function debounce(fn, delay = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
