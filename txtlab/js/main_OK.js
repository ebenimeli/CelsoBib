// Entry point: boot the app, wire events, and initial UI state
import { $$, $id } from "./core/dom.js";
import { initClick, playClick } from "./core/audio.js";
import { closeAllToolsets, wireToolsetTrigger } from "./core/a11y.js";

import { initInfoHover } from "./ui/infoHover.js";
import { initWelcomeDialog } from "./ui/dialog.js";
import { mountToolbox, initToolboxDelegation, initToolsetsWithin } from "./ui/toolbox.js";
import { wireCounters } from "./ui/counters.js";

import {
  doAZ, doZA, leftToRight, rightToLeft, cleanLeft, cleanRight,
  lowerCase, upperCase, namesUp, cleanLines, numberElements,
  removeNumbering, joinLists
} from "./text/transforms.js";

import {
  makeGroups, group2, group3, group4, groupX,
  shuffleList, randomElements, abbc, splitList
} from "./text/groups.js";

import { wireLiveSearch } from "./text/search.js";
import { copyInput, copyOutput, pasteInput, pasteOutput } from "./clipboard/clipboard.js";

function wireButton(id, fn, withClick = true) {
  const el = $id(id);
  if (!el) return;
  el.addEventListener("click", () => {
    fn();
    if (withClick) playClick();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 1) Audio pool ready (no playback yet)
  initClick("assets/media/click.mp3");

  // 2) Global button click sound (optional; comment out if redundant)
  $$("button").forEach((b) => b.addEventListener("click", () => playClick()));

  // 3) Toolsets a11y (single-open behavior on initial DOM toolsets)
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

  // 4) UI helpers
  initInfoHover();
  initWelcomeDialog();
  initToolboxDelegation();
  wireLiveSearch();
  wireCounters();

  // 5) Default toolbox at boot
  mountToolbox("#tblists"); // load “Listas” initially
  // Re-init toolsets inside the newly mounted sidebar
  const freshSidebar = $id("sidebar");
  if (freshSidebar) initToolsetsWithin(freshSidebar);

  // 6) Wire actions (buttons -> functions)
  wireButton("doAZ", doAZ);
  wireButton("doZA", doZA);
  wireButton("lefttoright", leftToRight);
  wireButton("righttoleft", rightToLeft);
  wireButton("cleanleft", cleanLeft);
  wireButton("cleanright", cleanRight);
  wireButton("group2", group2);
  wireButton("group3", group3);
  wireButton("group4", group4);
  wireButton("lowercase", lowerCase);
  wireButton("uppercase", upperCase);
  wireButton("namesup", namesUp);
  wireButton("abbc", abbc);
  wireButton("shuffle", shuffleList);
  wireButton("cleanlines", cleanLines);
  wireButton("randomelements", randomElements, /*click sound already*/ true);
  wireButton("splitlist", splitList);
  wireButton("groupx", groupX);
  wireButton("join", joinLists);
  wireButton("number", numberElements);
  wireButton("nonumber", removeNumbering);

  // 7) Clipboard buttons (if present)
  wireButton("copyi", copyInput);
  wireButton("copyo", copyOutput);
  wireButton("pastei", pasteInput);
  wireButton("pasteo", pasteOutput);
});

// Export for potential future tests or programmatic access
export {
  closeAllToolsets, makeGroups, doAZ, doZA,
};
