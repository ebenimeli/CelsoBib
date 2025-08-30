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
import * as S from "./text/stats.js";
import { wireLiveSearch } from "./text/search.js";
import { copyInput, copyOutput, pasteInput, pasteOutput } from "./clipboard/clipboard.js";

// import genérico de listas
import * as X from "./text/example.js";

import { printO } from "./ui/print.js";

/* ============================
   NUEVO: cargar log.txt en itext
   ============================ */

/** Intenta cargar log.txt en #itext.
 *  Prueba primero './log.txt' y, si falla, 'assets/data/log.txt'.
 */
async function loadLog(targetId = "itext") {
  const ta = $id(targetId);
  if (!ta) {
    console.warn("[loadLog] No existe textarea #" + targetId);
    return false;
  }

  const paths = ["assets/data/log.txt"];
  for (const path of paths) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      ta.value = text;
      return true;
    } catch (_) {
      // probar siguiente ruta
    }
  }

  console.warn("[loadLog] No se pudo cargar log.txt en ninguna ruta");
  return false;
}

/** Cuando se abre el template #about mediante su botón de cabecera, recarga el log. */
function installAboutLoader() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button.tool[data-target="#about"]');
    if (!btn) return;
    // Dejamos que el sistema monte el template y, acto seguido, cargamos el log.
    // setTimeout 0 garantiza que la delegación de mount ya se haya ejecutado.
    setTimeout(() => { loadLog(); }, 0);
  });
}

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
  toCheckList: T.toCheckList,

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

  calcWordFreq: S.calcWordFreq,
  calcCharFreq: S.calcCharFreq,

  // clipboard
  copyi: copyInput,
  copyo: copyOutput,
  pastei: pasteInput,
  pasteo: pasteOutput,

  // importar lista desde assets/data/*.txt
  importList: X.importList,
  importText: X.importText,

  // PRINT
  printo: () => printO("otext", "Imprimir · txtlab", { autoClose: false }),
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

    // --- NUEVO: si el default es #about, cargamos el log al iniciar
    if (tplDefault.id === "about") {
      loadLog();
    }
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

  const [{ initWriteMode }] = await Promise.all([
    import("./text/write.js"),
  ]);

  initWriteMode?.(container);
}

function installWriteModeLazyLoader() {
  document.addEventListener("click", async (e) => {
    const toolBtn = e.target.closest('button.tool[data-target]');
    if (!toolBtn) return;

    const sel = toolBtn.dataset.target;
    if (sel === "#write-mode") {
      mountToolbox(sel);

const { initFormatControls } = await import("./text/format.js");
initFormatControls();

      const container = document.querySelector(sel);
      if (container) {
        initToolsetsWithin(container);
        await ensureWriteModeLoaded(container);
      }
    }
  });

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

  // Lazy-load del write-mode
  installWriteModeLazyLoader();

  // NUEVO: volver a cargar log cuando se abra #about desde el header
  installAboutLoader();
});

// Optional named exports (tests / external access)
export { closeAllToolsets, G as Groups, T as Transforms };

/* Tema dark/light con icono */
const root = document.documentElement;
const btn  = document.getElementById('theme-toggle');
const ico  = btn?.querySelector('i');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (ico) {
    if (theme === 'dark') {
      ico.className = 'fa-solid fa-sun';
      btn.title = 'Cambiar a tema claro';
      btn.setAttribute('aria-label', 'Cambiar a tema claro');
    } else {
      ico.className = 'fa-solid fa-moon';
      btn.title = 'Cambiar a tema oscuro';
      btn.setAttribute('aria-label', 'Cambiar a tema oscuro');
    }
  }
}

const saved = localStorage.getItem('theme');
applyTheme((saved === 'dark' || saved === 'light') ? saved : 'light');

btn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// main.js
/*
function focusItxt(moveToEnd = true) {
  const ta = document.getElementById("itext");
  if (!ta) return;
  ta.focus({ preventScroll: true });
  if (moveToEnd) {
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ...tu código existente...
  setTimeout(() => focusItxt(), 0);
});
*/