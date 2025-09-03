// js/games/games.js

// --- Reactiva <script> de fragmentos HTML insertados via innerHTML
function activateScripts(scope) {
  if (!scope) return;
  scope.querySelectorAll('script').forEach((s0) => {
    const s = document.createElement('script');
    // Copia atributos (type, src, etc.)
    [...s0.attributes].forEach((a) => s.setAttribute(a.name, a.value));
    // Copia el contenido inline (si lo hay)
    s.textContent = s0.textContent || '';
    // Sustituye el script original por uno "vivo"
    s0.replaceWith(s);
  });
}

// --- Carga genérica de juegos: game1.html, game2.html, ...
export async function loadGame(gameNumber) {
  const main = document.getElementById('main');
  if (!main) return;

  try {
    const url = `assets/main/games/game${gameNumber}/game${gameNumber}.html`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`No se pudo cargar ${url}`);

    const html = await res.text();
    main.innerHTML = html;       // 1) Insertas el fragmento
    activateScripts(main);       // 2) Reactivas sus <script>

    // (Opcional) Llevar foco arriba del main
    main.scrollIntoView({ block: 'start', behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p style="padding:8px">Error al cargar el juego ${gameNumber}.</p>`;
  }
}

// --- Mapa de acciones dinámicas (loadGame1..loadGame10)
export const gameActions = {};
for (let i = 1; i <= 10; i++) {
  gameActions[`loadGame${i}`] = () => loadGame(i);
}

export function loadCrossWords() {
  loadGame(1);
}

export function loadGame2() {
  loadGame(2);
}

export function loadGame3() {
  loadGame(3);
}