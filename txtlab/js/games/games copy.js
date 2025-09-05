// js/games/games.js

// Función general para cargar juegos
export async function loadGame(gameNumber) {
  const main = document.getElementById("main");
  if (!main) return;

  try {
    const res = await fetch(`assets/games/game${gameNumber}.html`, { cache: "no-store" });
    if (!res.ok) throw new Error("Error al cargar el juego");

    const html = await res.text();
    main.innerHTML = html;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p>Error al cargar el juego ${gameNumber}.</p>`;
  }
}

// Mapa de acciones dinámicas
export const gameActions = {};

for (let i = 1; i <= 10; i++) {   // admite game1 hasta game10 (puedes ampliar)
  gameActions[`loadGame${i}`] = () => loadGame(i);
}
