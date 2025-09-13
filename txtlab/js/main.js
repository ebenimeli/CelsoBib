// js/main.js
import { loadLocale, getCurrentLang, applyLocaleTo, initI18n } from "./i18n.js";
import { gameActions } from "./games/games.js";

// Entry point: boot the app, wire events (via delegation), and initial UI state
import { $$, $, $id } from "./core/dom.js";
import { initClick, playClick } from "./core/audio.js";
import { closeAllToolsets, wireToolsetTrigger } from "./core/a11y.js";

import { initInfoHover } from "./ui/infoHover.js";
import { initWelcomeDialog } from "./ui/dialog.js";
import {
  mountToolbox,
  initToolboxDelegation,
  initToolsetsWithin,
} from "./ui/toolbox.js";
import { wireCounters } from "./ui/counters.js";

// Auto-init delegations (efectos secundarios)
import "./docs/docs.js";
import "./edu/edu.js";

import * as T from "./text/transforms.js";
import * as G from "./text/groups.js";
import * as S from "./text/stats.js";
import * as W from "./text/write.js";
import * as GAMES from "./games/games.js";

import { wireLiveSearch } from "./text/search.js";
import {
  copyInput,
  copyOutput,
  pasteInput,
  pasteOutput,
} from "./clipboard/clipboard.js";
import * as X from "./text/example.js";
import { printO } from "./ui/print.js";

/* ============================
   Cargar log.txt en itext
============================ */
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
    } catch (_) {}
  }
  console.warn("[loadLog] No se pudo cargar log.txt en ninguna ruta");
  return false;
}

function installAboutLoader() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button.tool[data-target="#about"]');
    if (!btn) return;
    setTimeout(() => {
      loadLog();
    }, 0);
  });
}

/* === i18n helper: aplica el idioma activo al contenedor recién montado === */
function applyCurrentLocaleNow(root = document) {
  if (typeof applyLocaleTo === "function") {
    applyLocaleTo(root);
  } else {
    const lang =
      (typeof getCurrentLang === "function" && getCurrentLang()) ||
      localStorage.getItem("txtlab.lang") ||
      "es";
    loadLocale(lang);
  }
}

/* === Reaplica i18n cada vez que se monta un template vía botón .tool === */
function installI18nAutoApplyOnTemplateMount() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button.tool[data-target]");
    if (!btn) return;
    const sel = btn.dataset.target;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const container = sel ? document.querySelector(sel) : null;
        applyCurrentLocaleNow(container || document);
      })
    );
  });
}

/* === CUANDO #main SE ACTUALIZA (docs o edu) ===
   Re-cablea a11y + i18n y monta el lector accesible si procede */
document.addEventListener("app:main-updated", async (e) => {
  const main = $id("main");
  if (!main) return;

  // Re-cablea toolsets e i18n del contenido recién inyectado
  initToolsetsWithin(main);
  applyCurrentLocaleNow(main);

  // ¿Se ha cargado accessibility.html?
  const isAccessibility = e?.detail?.id === "accessibility";
  const raSection = main.querySelector("#read-accessible");
  if (!(isAccessibility || raSection)) return;

  try {
    // Importa el módulo SOLO cuando está el lector en el DOM
    const { mountReaderAccessible, wireReaderAccessibleShortcuts } =
      await import("./modules/readerAccessible.js");

    // Llama SIEMPRE; el propio módulo es idempotente (usa data-ra-mounted)
    mountReaderAccessible({
      getEditorText: () => document.querySelector("#itext")?.value || "",
    });
    wireReaderAccessibleShortcuts?.();
    console.debug("[readerAccessible] init OK");
  } catch (err) {
    console.error("[readerAccessible] no se pudo cargar/montar:", err);
  }
});

/** Action registry */
const actionMap = {
  ...gameActions,

  // audio/escritura
  soundOn: W.soundOn,
  soundOff: W.soundOff,
  typewriterToggle: W.typewriterToggle,

  // sugerencias
  suggestWord: W.suggestWord,
  suggestCharacter: W.suggestCharacter,
  suggestPlace: W.suggestPlace,
  suggestTime: W.suggestTime,
  suggestFeeling: W.suggestFeeling,
  suggestConflict: W.suggestConflict,
  suggestAll: W.suggestAll,

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

  // stats
  calcWordFreq: S.calcWordFreq,
  calcCharFreq: S.calcCharFreq,

  // clipboard
  copyi: copyInput,
  copyo: copyOutput,
  pastei: pasteInput,
  pasteo: pasteOutput,

  // importar lista/texto desde assets/data/*.txt
  importList: X.importList,
  importText: X.importText,

  // print
  printo: () => printO("otext", "Imprimir · txtlab", { autoClose: false }),

  // games
  crosswords: GAMES.loadCrossWords,
  game2: GAMES.loadGame2,
  game1: GAMES.loadGame1,
  snakepong: GAMES.loadGame3,
  guesswords: GAMES.loadGame4,
};

/** Global click dispatcher */
function installActionDispatcher() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const fn = actionMap[action];
    if (typeof fn === "function") {
      try {
        const ret = fn(btn);
        if (ret && typeof ret.then === "function") {
          ret
            .then(() => playClick?.())
            .catch((err) => console.error(`[action:${action}]`, err));
        } else {
          playClick?.();
        }
      } catch (err) {
        console.error(`[action:${action}]`, err);
      }
    }
  });
}

/** A11y wiring para .toolset presentes al arrancar */
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
    document
      .querySelectorAll(`button[data-target="#${panel.id}"]`)
      .forEach((btn) => triggers.add(btn));
    triggers.forEach((btn) => wireToolsetTrigger(btn, panel, SINGLE_OPEN));
  });
}

/** Monta un toolbox por defecto para que existan .action al instante */
function mountDefaultToolbox() {
  // 1) preferente: template con data-default
  const tplDefault = $("template[data-default]");
  if (tplDefault?.id) {
    const sel = `#${tplDefault.id}`;
    mountToolbox(sel);
    applyCurrentLocaleNow(document.querySelector(sel) || document);
    return true;
  }

  // 2) si no, primer botón .tool
  const firstTool = $("button.tool[data-target]");
  if (firstTool) {
    const sel = firstTool.dataset.target;
    if (sel) {
      mountToolbox(sel);
      applyCurrentLocaleNow(document.querySelector(sel) || document);
      return true;
    }
  }

  // 3) si no, primer <template>
  const firstTpl = $("template");
  if (firstTpl?.id) {
    const sel = `#${firstTpl.id}`;
    mountToolbox(sel);
    applyCurrentLocaleNow(document.querySelector(sel) || document);
    return true;
  }

  console.warn(
    "[boot] No default toolbox could be mounted (no <template> found)."
  );
  return false;
}

// === Lazy loader para write-mode
let writeModeLoaded = false;
async function ensureWriteModeLoaded(container) {
  if (writeModeLoaded) return;
  writeModeLoaded = true;

  const [{ initWriteMode }] = await Promise.all([import("./text/write.js")]);
  initWriteMode?.(container);
  W.syncSoundButtons?.(document);
  W.typewriterRestore?.();
}

function installWriteModeLazyLoader() {
  document.addEventListener("click", async (e) => {
    const toolBtn = e.target.closest("button.tool[data-target]");
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
        applyCurrentLocaleNow(container); // i18n tras montar write
      }
    }
  });

  const writeTpl = document.querySelector("#write-mode");
  if (writeTpl) {
    const mo = new MutationObserver(async () => {
      const visible = !writeTpl.hidden && writeTpl.childElementCount > 0;
      if (visible) {
        await ensureWriteModeLoaded(writeTpl);
        applyCurrentLocaleNow(writeTpl);
        mo.disconnect();
      }
    });
    mo.observe(writeTpl, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["hidden"],
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 0) i18n: cablea selector y aplica idioma inicial (sin doble fetch)
  initI18n?.();

  // 1) audio pool
  initClick("assets/media/click.mp3");

  // 2) dispatcher global
  installActionDispatcher();

  // 3) toolsets a11y
  initToolsetsA11y();

  // 4) UI helpers
  initInfoHover();
  initWelcomeDialog({ modal: true });
  initToolboxDelegation();
  wireLiveSearch();
  wireCounters();

  // 5) monta toolbox por defecto
  if (mountDefaultToolbox()) {
    const freshSidebar = $id("sidebar");
    if (freshSidebar) initToolsetsWithin(freshSidebar);
  }

  // 6) lazy-load write-mode
  installWriteModeLazyLoader();

  // 7) recarga log al abrir #about
  installAboutLoader();

  // 8) reaplica i18n en cada template montado desde header
  installI18nAutoApplyOnTemplateMount();
});

// Optional named exports
export { closeAllToolsets, G as Groups, T as Transforms };

/* Tema dark/light con icono */
const docRoot = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");
const ico = themeBtn?.querySelector("i");

function applyTheme(theme) {
  docRoot.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (ico) {
    if (theme === "dark") {
      ico.className = "fa-solid fa-sun";
      themeBtn.title = "Cambiar a tema claro";
      themeBtn.setAttribute("aria-label", "Cambiar a tema claro");
    } else {
      ico.className = "fa-solid fa-moon";
      themeBtn.title = "Cambiar a tema oscuro";
      themeBtn.setAttribute("aria-label", "Cambiar a tema oscuro");
    }
  }
}

const saved = localStorage.getItem("theme");
applyTheme(saved === "dark" || saved === "light" ? saved : "light");

themeBtn?.addEventListener("click", () => {
  const next = docRoot.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

/* Rating */
(function setupStarRating() {
  const root = document.getElementById("welcome-dialog");
  if (!root) return;
  const container = root.querySelector("#welcome-rating");
  if (!container) return;

  const stars = Array.from(container.querySelectorAll(".star"));
  const hidden = root.querySelector("#rating-value");
  let selected = 0;
  let sent = false;

  const paint = (n) => {
    stars.forEach((s, i) => {
      s.classList.toggle("is-active", i < n);
      s.setAttribute("aria-checked", String(i === n - 1));
    });
  };
  const set = (n) => {
    selected = n;
    paint(selected);
    if (hidden) hidden.value = String(n);
  };

  async function sendRating(n) {
    try {
      await fetch(
        "https://www.ebenimeli.org/txtlab-beta/api/rating-email.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            rating: String(n),
            source: "welcome-dialog",
            page: location.href,
          }),
        }
      );
    } catch (err) {
      console.warn("No se pudo enviar la valoración", err);
    }
  }

  stars.forEach((star, i) => {
    const n = i + 1;

    star.addEventListener("mouseenter", () => paint(n));
    star.addEventListener("focus", () => paint(n));
    star.addEventListener("mouseleave", () => paint(selected));
    star.addEventListener("blur", () => paint(selected));

    star.addEventListener("click", () => {
      set(n);
      if (!sent) {
        sent = true;
        sendRating(n);
      }
    });

    star.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        set(n);
        if (!sent) {
          sent = true;
          sendRating(n);
        }
      }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        set(Math.min(5, (selected || 0) + 1));
        stars[Math.min(4, selected - 1)].focus();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        set(Math.max(1, (selected || 1) - 1));
        stars[Math.max(0, selected - 2)].focus();
      }
    });
  });

  const initial = parseInt(hidden?.value || "0", 10);
  if (initial > 0) set(initial);

  root.addEventListener("close", () => {
    if (selected > 0 && !sent) {
      sent = true;
      sendRating(selected);
    }
  });
})();

// ⛔️ Importante: SIN fullscreen automático aquí

// Timers lazy-load al abrir el panel
let timersLoaded = false;
document.addEventListener("click", async (e) => {
  const openTimerPanelBtn = e.target.closest('button[data-target="#timer"]');
  if (!openTimerPanelBtn) return;

  if (!timersLoaded) {
    const mod = await import("./timers/timers.js");
    mod.initTimerDelegation?.();
    timersLoaded = true;
  }
});
