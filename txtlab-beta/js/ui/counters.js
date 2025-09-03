// Character/word/line counters bound to textareas
import { $id, IDS } from "../core/dom.js";
import { textStats } from "../text/textUtils.js";

/** Update status element with counts for a given textarea id */
export function updateStatusFor(textareaId, statusId) {
  const ta = $id(textareaId);
  const st = $id(statusId);
  if (!ta || !st) return;
  const { chars, words, lines } = textStats(ta.value);
  st.textContent = `${chars} caracteres · ${words} palabras · ${lines} líneas con valores`;
}

/** Patch Textarea.value setter to emit input event when programmatically changed (once) */
function patchTextareaValueOnce() {
  if (window.__taValuePatched) return;
  const proto = HTMLTextAreaElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (!desc?.set || !desc?.get) return;

  Object.defineProperty(proto, "value", {
    get: desc.get,
    set(v) {
      const old = desc.get.call(this);
      desc.set.call(this, v);
      if (old !== v) this.dispatchEvent(new Event("input", { bubbles: true }));
    },
  });
  window.__taValuePatched = true;
}

/** Bind counters to #itext/#statusi and #otext/#statuso */
export function wireCounters() {
  patchTextareaValueOnce();

  const pairs = [
    [IDS.itext, IDS.statusi],
    [IDS.otext, IDS.statuso],
  ];
  pairs.forEach(([taId, stId]) => {
    const ta = $id(taId);
    if (!ta) return;
    const handler = () => updateStatusFor(taId, stId);
    ta.addEventListener("input", handler);
    ta.addEventListener("change", handler);
    handler(); // initial state
  });
}

/** Manual refresh helper */
export function refreshCounters() {
  updateStatusFor(IDS.itext, IDS.statusi);
  updateStatusFor(IDS.otext, IDS.statuso);
}
