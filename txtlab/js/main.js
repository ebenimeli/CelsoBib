import { loadLocale, getCurrentLang, applyLocaleTo, initI18n } from "./i18n.js";

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

import * as T from "./text/transforms.js";
import * as G from "./text/groups.js";
import * as S from "./text/stats.js";
import * as W from "./text/write.js";

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

/** Action registry */
const actionMap = {
  soundOn: W.soundOn,
  soundOff: W.soundOff,
  typewriterToggle: W.typewriterToggle,

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
    if (tplDefault.id === "about") loadLog();
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
const root = document.documentElement;
const btn = document.getElementById("theme-toggle");
const ico = btn?.querySelector("i");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (ico) {
    if (theme === "dark") {
      ico.className = "fa-solid fa-sun";
      btn.title = "Cambiar a tema claro";
      btn.setAttribute("aria-label", "Cambiar a tema claro");
    } else {
      ico.className = "fa-solid fa-moon";
      btn.title = "Cambiar a tema oscuro";
      btn.setAttribute("aria-label", "Cambiar a tema oscuro");
    }
  }
}

const saved = localStorage.getItem("theme");
applyTheme(saved === "dark" || saved === "light" ? saved : "light");

btn?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});
