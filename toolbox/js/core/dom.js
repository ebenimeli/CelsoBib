// DOM helpers & constants

/** Return element by id (typed) or null */
export const $id = (id) => document.getElementById(id);

/** Query within a scope or document */
export const $ = (sel, scope = document) => scope.querySelector(sel);

/** Query-all within a scope or document -> Array */
export const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

/** Common ids used across modules (kept centralized for maintainability) */
export const IDS = {
  itext: "itext",
  otext: "otext",
  inputtext: "inputtext",
  searchtext: "searchtext",
  info: "info",
  sidebar: "sidebar",
  welcomeDialog: "welcome-dialog",
  statusi: "statusi",
  statuso: "statuso",
};

/** Button selectors used in multiple places */
export const SELECTORS = {
  toolset: ".toolset",
  toolButtons: "button.tool",
  infoButtons: "button.action, button.tool",
};
