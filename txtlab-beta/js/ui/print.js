// js/ui/print.js
import { $id } from "../core/dom.js";

/** Escapa HTML para imprimir el contenido tal cual texto plano */
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

/**
 * Imprime el contenido del textarea (por defecto #otext) en una ventana limpia
 * y abre automáticamente el diálogo de impresión del sistema.
 *
 * @param {string} textareaId  - id del textarea origen (p.ej., "otext")
 * @param {string} docTitle    - título de la ventana de impresión
 * @param {{ autoClose?: boolean }} opts - opciones (autoClose=true cierra tras imprimir)
 */
export function printO(textareaId = "otext", docTitle = "Imprimir · txtlab", opts = { autoClose: true }) {
  const text = $id(textareaId)?.value || "";
  const w = window.open("", "_blank");
  if (!w) {
    alert("No se pudo abrir la vista de impresión (¿bloqueador de ventanas?)");
    return;
  }

  // Documento de impresión (sin <script> incrustado)
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(docTitle)}</title>
  <meta name="color-scheme" content="light dark">
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 20mm;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.45;
      font-size: 14px;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      margin: 0;
    }
    @page { margin: 12mm; }
  </style>
</head>
<body>
  <pre>${escapeHtml(text)}</pre>
</body>
</html>`;

  // Carga el HTML y, cuando termine, dispara la impresión desde el padre
  w.document.open();
  w.document.write(""); // opcional, asegura documento vacío
  w.document.close();
  w.document.documentElement.innerHTML = html;

  // Cuando la ventana termine de cargar, lanza la impresión
  const triggerPrint = () => {
    try { w.focus(); } catch {}
    try { w.print(); } catch {}
    if (opts?.autoClose) {
      // Cierra tras imprimir si el navegador soporta afterprint; añade un fallback
      w.addEventListener("afterprint", () => { try { w.close(); } catch {} }, { once: true });
      // Fallback por si afterprint no dispara (algunos Safari/Firefox)
      setTimeout(() => { try { w.close(); } catch {} }, 1500);
    }
  };

  // Si ya está cargado, imprime; si no, espera al load
  if (w.document.readyState === "complete") {
    // Da un microtiempo para que el motor pinte
    setTimeout(triggerPrint, 0);
  } else {
    w.addEventListener("load", triggerPrint, { once: true });
  }
}
