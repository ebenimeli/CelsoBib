// Entry point: boot the app, wire events (via delegation), and initial UI state
import { $$, $, $id } from "./core/dom.js";
import { initClick, playClick } from "./core/audio.js";
import { closeAllToolsets, wireToolsetTrigger } from "./core/a11y.js";

import { initInfoHover } from "./ui/infoHover.js";
import { initWelcomeDialog } from "./ui/dialog.js";
import { mountToolbox, initToolboxDelegation, initToolsetsWithin } from "./ui/toolbox.js";
import { wireCounters } from "./ui/counters.js";

import * as T from "./text/transforms.js";
import * as G from "./text/groups.js";
import { wireLiveSearch } from "./text/search.js";
import { copyInput, copyOutput, pasteInput, pasteOutput } from "./clipboard/clipboard.js";

// === CHG === quita el import estático de write.js para evitar que se ejecute en otros templates
// import { initWriteMode } from "./text/write.js";

// import genérico de listas
import * as X from "./text/example.js";

/** Action registry: map action names to functions (used by the click dispatcher) */
const actionMap = {
  // transforms
  doAZ: T.doAZ,
  doZA: T.doZA,
  lefttoright: T.leftToRight,
  righttoleft: T.rightToLeft,
  cleanleft: T.cleanLeft,
  cleanright: T.cleanRight,
  lowerCase: T.lowerCase,
  upperCase: T.upperCase,
  namesUp: T.namesUp,
  cleanLines: T.cleanLines,
  numberElements: T.numberElements,
  removeNumbering: T.removeNumbering,
  joinLists: T.joinLists,
  sortByTag: T.sortByTag,
  removeTags: T.removeTags,

  // groups
  group2: G.group2,
  group3: G.group3,
  group4: G.group4,
  groupX: G.groupX,
  shuffleList: G.shuffleList,
  randomElements: G.randomElements,
  abbc: G.abbc,
  abc: G.abc,
  groupByPattern: G.groupByPattern,
  sortABC: G.sortABC,
  splitList: G.splitList,

  // clipboard
  copyi: copyInput,
  copyo: copyOutput,
  pastei: pasteInput,
  pasteo: pasteOutput,

  // importar lista desde assets/data/*.txt
  importList: X.importList,
};

/** Global click dispatcher: handles current and future .action buttons via data-action */
function installActionDispatcher() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const fn = actionMap[action];
    if (typeof fn === "function") {
      fn(btn);            // pasamos el botón (para leer data-file, etc.)
      playClick?.();
    }
  });
}

/** Initial a11y wiring for .toolset panels present at boot */
function initToolsetsA11y() {
  const SINGLE_OPEN = true;
  $$(".toolset").forEach((panel, idx) => {
    panel.hidden = true;
    if (!panel.id) panel.id = `toolset-${idx + 1}`;

    const prev = panel.previousElementSibling;
    const triggers = new Set();
    if (prev?.tagName === "BUTTON") {
      prev.dataset.target = `#${panel.id}`;
      triggers.add(prev);
    }
    document.querySelectorAll(`button[data-target="#${panel.id}"]`).forEach((btn) => triggers.add(btn));
    triggers.forEach((btn) => wireToolsetTrigger(btn, panel, SINGLE_OPEN));
  });
}

/** Mount a default toolbox so .action buttons exist before any user click */
function mountDefaultToolbox() {
  // 1) Prefer an explicit default template
  const tplDefault = $('template[data-default]');
  if (tplDefault?.id) {
    mountToolbox(`#${tplDefault.id}`);
    return true;
  }

  // 2) Otherwise, use the first tool button's target
  const firstTool = $('button.tool[data-target]');
  if (firstTool) {
    const sel = firstTool.dataset.target;
    if (sel) {
      mountToolbox(sel);
      return true;
    }
  }

  // 3) Lastly, mount the first <template> in the document (if any)
  const firstTpl = $('template');
  if (firstTpl?.id) {
    mountToolbox(`#${firstTpl.id}`);
    return true;
  }

  console.warn("[boot] No default toolbox could be mounted (no <template> found).");
  return false;
}

// === CHG === lazy loader para write-mode
let writeModeLoaded = false;
async function ensureWriteModeLoaded(container) {
  if (writeModeLoaded) return;
  writeModeLoaded = true;

  // Carga bajo demanda los módulos del modo escritura
  const [{ initWriteMode }] = await Promise.all([
    import("./text/write.js"),         // debe exportar initWriteMode(container?)
    // opcional: también words.js si existe y solo aplica a write-mode
    // import("./text/words.js").then(m => m.initWords?.(container)),
  ]);

  // Inicializa write-mode dentro de su contenedor/template
  initWriteMode?.(container);
}

// === CHG === intercepta la apertura del template write-mode para cargarlo perezosamente
function installWriteModeLazyLoader() {
  document.addEventListener("click", async (e) => {
    const toolBtn = e.target.closest('button.tool[data-target]');
    if (!toolBtn) return;

    const sel = toolBtn.dataset.target;
    if (sel === "#write-mode") {
      // montar el template (si aún no está)
      mountToolbox(sel);
      const container = document.querySelector(sel);
      if (container) {
        initToolsetsWithin(container);
        await ensureWriteModeLoaded(container);
      }
    }
  });

  // Además, por accesibilidad: si el panel aparece visible por teclado/otro trigger
  const writeTpl = document.querySelector("#write-mode");
  if (writeTpl) {
    const mo = new MutationObserver(async () => {
      const visible = !writeTpl.hidden && writeTpl.childElementCount > 0;
      if (visible) {
        await ensureWriteModeLoaded(writeTpl);
        mo.disconnect();
      }
    });
    mo.observe(writeTpl, { attributes: true, childList: true, subtree: true, attributeFilter: ["hidden"] });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1) Prepare audio pool (no playback yet)
  initClick("assets/media/click.mp3");

  // 2) Install global action dispatcher (robust to dynamic DOM)
  installActionDispatcher();

  // 3) Toolsets (present at boot) a11y wiring
  initToolsetsA11y();

  // 4) UI helpers
  initInfoHover();
  initWelcomeDialog({ modal: true });
  initToolboxDelegation();
  wireLiveSearch();
  wireCounters();

  // 5) Ensure a default toolbox is mounted so .action buttons exist immediately
  if (mountDefaultToolbox()) {
    const freshSidebar = $id("sidebar");
    if (freshSidebar) initToolsetsWithin(freshSidebar);
  }

  // === CHG === NO montar write-mode aquí (evita que se ejecute cuando estás en tblists)
  // mountToolbox("#write-mode");
  // initWriteMode();

  // === CHG === activar lazy-load del write-mode
  installWriteModeLazyLoader();
});

// Optional named exports (tests / external access)
export { closeAllToolsets, G as Groups, T as Transforms };

/* Tema dark/light con icono */
const root = document.documentElement;
const btn  = document.getElementById('theme-toggle');
const ico  = btn?.querySelector('i');

/** Aplica tema, guarda preferencia y ajusta icono/labels */
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (ico) {
    if (theme === 'dark') {
      ico.className = 'fa-solid fa-sun';   // ☀️
      btn.title = 'Cambiar a tema claro';
      btn.setAttribute('aria-label', 'Cambiar a tema claro');
    } else {
      ico.className = 'fa-solid fa-moon';  // 🌙
      btn.title = 'Cambiar a tema oscuro';
      btn.setAttribute('aria-label', 'Cambiar a tema oscuro');
    }
  }
}

// 1) Tema inicial: usa guardado o LIGHT por defecto
const saved = localStorage.getItem('theme');
applyTheme((saved === 'dark' || saved === 'light') ? saved : 'light');

// 2) Toggle al hacer clic
btn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});
