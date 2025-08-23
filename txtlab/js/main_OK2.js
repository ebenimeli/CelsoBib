// Entry point: boot the app, wire events (via delegation), and initial UI state
import { $$, $id } from "./core/dom.js";
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

/** Action registry: map action names to functions (used by the click dispatcher) */
const actionMap = {
  // transforms
  doAZ: T.doAZ,
  doZA: T.doZA,
  leftToRight: T.leftToRight,
  rightToLeft: T.rightToLeft,
  cleanLeft: T.cleanLeft,
  cleanRight: T.cleanRight,
  lowerCase: T.lowerCase,
  upperCase: T.upperCase,
  namesUp: T.namesUp,
  cleanLines: T.cleanLines,
  numberElements: T.numberElements,
  removeNumbering: T.removeNumbering,
  joinLists: T.joinLists,

  // groups
  group2: G.group2,
  group3: G.group3,
  group4: G.group4,
  groupX: G.groupX,
  shuffleList: G.shuffleList,
  randomElements: G.randomElements,
  abbc: G.abbc,
  splitList: G.splitList,

  // clipboard
  copyi: copyInput,
  copyo: copyOutput,
  pastei: pasteInput,
  pasteo: pasteOutput,
};

/** Global click dispatcher: handles current and future .action buttons via data-action */
function installActionDispatcher() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const fn = actionMap[action];
    if (typeof fn === "function") {
      fn();
      // Optional feedback sound
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

document.addEventListener("DOMContentLoaded", () => {
  // 1) Prepare audio pool (no playback yet)
  initClick("assets/media/click.mp3");

  // 2) Install global action dispatcher (robust to dynamic DOM)
  installActionDispatcher();

  // 3) Toolsets (present at boot) a11y wiring
  initToolsetsA11y();

  // 4) UI helpers
  initInfoHover();
  initWelcomeDialog();
  initToolboxDelegation();
  wireLiveSearch();
  wireCounters();

  // 5) Default toolbox at boot and re-init toolsets inside new sidebar
  mountToolbox("#tblists"); // load “Listas” initially
  const freshSidebar = $id("sidebar");
  if (freshSidebar) initToolsetsWithin(freshSidebar);
});

// Optional named exports (tests / external access)
export { closeAllToolsets, G as Groups, T as Transforms };
