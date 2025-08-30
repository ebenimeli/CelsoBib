// Copy/paste helpers + optional #info feedback
import { $id, IDS } from "../core/dom.js";

/** Set temporary message in #info for ms milliseconds */
export function setInfo(msg, ms = 1200) {
  const info = $id(IDS.info);
  if (!info) return;
  const prev = info.textContent;
  info.textContent = msg;
  setTimeout(() => (info.textContent = prev), ms);
}

/** Copy text to clipboard, fallback to textarea+execCommand */
export async function copyToClipboard(text) {
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setInfo("Copiado al portapapeles");
  } catch {
    alert("No se pudo copiar. Revisa los permisos del navegador.");
  }
}

/** Paste clipboard text into a textarea by id (requires gesture + HTTPS) */
export async function pasteInto(targetId) {
  try {
    if (!navigator.clipboard?.readText) {
      alert(
        "Este navegador no permite leer del portapapeles aquí. Usad Ctrl/Cmd+V."
      );
      return;
    }
    const text = await navigator.clipboard.readText();
    const area = $id(targetId);
    if (!area) return;
    area.value = (text || "").replace(/\r\n?/g, "\n");
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
    setInfo("Pegado desde portapapeles");
  } catch {
    alert(
      "No se pudo pegar. Aseguraos de usar HTTPS y un gesto de usuario (clic)."
    );
  }
}

/** Copy #itext content */
export const copyInput = () => copyToClipboard($id(IDS.itext)?.value || "");

/** Copy #otext content */
export const copyOutput = () => copyToClipboard($id(IDS.otext)?.value || "");

/** Paste into #itext */
export const pasteInput = () => pasteInto(IDS.itext);

/** Paste into #otext */
export const pasteOutput = () => pasteInto(IDS.otext);
