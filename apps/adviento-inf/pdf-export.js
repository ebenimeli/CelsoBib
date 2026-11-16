/**
 * Exportación a PDF de la ventana de cada día.
 * Este módulo es independiente de app.js para mantener intacta la lógica del calendario.
 * html2canvas se descarga bajo demanda y la composición final del PDF se hace aquí.
 */
(() => {
  "use strict";

  const dayDialog = document.querySelector("#day-dialog");
  const dayImage = document.querySelector("#day-image");
  const downloadButton = document.querySelector("#download-day-pdf");
  let pdfExportInProgress = false;
  let pdfToastTimer;

  function showPdfToast(message) {
    const toast = document.querySelector("#toast");
    clearTimeout(pdfToastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    pdfToastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
  }

  /**
   * Exportación de la misma estructura HTML y estilos del modal.
   * html2canvas solo se carga al solicitar una exportación; el calendario
   * continúa funcionando sin conexión a ese servicio externo.
   */
  const PDF_WIDTH = 1200;
  const PDF_HEIGHT = 675;
  const PDF_SCALE = 2; // 2400 × 1350 píxeles
  const PDF_STYLE = `
    .pdf-export-stage { position: fixed !important; left: -15000px !important; top: 0 !important; width: 1200px !important; height: 675px !important; overflow: hidden !important; z-index: -1000 !important; pointer-events: none !important; }
    .pdf-export-stage *, .pdf-export-stage *::before, .pdf-export-stage *::after { animation: none !important; transition: none !important; }
    .day-content.pdf-export { display: grid !important; grid-template-columns: minmax(0, 1.18fr) minmax(0, 1fr) !important; width: 1200px !important; height: 675px !important; min-height: 675px !important; overflow: hidden !important; background: #fff9ee !important; }
    .pdf-export .day-art-panel { padding: 24px !important; }
    .pdf-export .art-decoration { font-size: 12px !important; padding: 4px 0 16px !important; }
    .pdf-export .day-art-panel img { display: block !important; width: 100% !important; height: auto !important; max-height: 510px !important; object-fit: contain !important; }
    .pdf-export .day-text-panel { padding: 48px 46px 40px !important; }
    .pdf-export .day-tag { font-size: 13px !important; }
    .pdf-export .day-text-panel h2 { font-size: 48px !important; margin: 13px 0 13px !important; }
    .pdf-export .day-message { font-size: 25px !important; margin: 0 0 24px !important; }
    .pdf-export .activity { padding: 15px 18px !important; margin: 0 0 13px !important; }
    .pdf-export .activity h3 { font-size: 14px !important; }
    .pdf-export .activity p { font-size: 19px !important; }
    .pdf-export .day-actions, .pdf-export button { display: none !important; }
  `;

  let html2canvasRequest = null;
  async function ensureHtml2Canvas() {
    if (typeof window.html2canvas === "function") return window.html2canvas;
    if (html2canvasRequest) return html2canvasRequest;
    html2canvasRequest = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("No se pudo cargar la biblioteca de exportación. Comprueba la conexión a Internet."));
      }, 15000);
      script.onload = () => {
        clearTimeout(timer);
        if (typeof window.html2canvas === "function") resolve(window.html2canvas);
        else reject(new Error("La biblioteca de exportación no está disponible."));
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("No se pudo cargar la biblioteca de exportación. Comprueba la conexión a Internet."));
      };
      document.head.append(script);
    }).catch(error => { html2canvasRequest = null; throw error; });
    return html2canvasRequest;
  }

  /**
   * Espera a la imagen realmente visible en el modal y verifica que no sea
   * el recurso de emergencia. Nunca sustituimos la ilustración de un día.
   */
  async function waitForIllustration(expectedSource) {
    if (!dayImage.complete) {
      await new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timeout);
          dayImage.removeEventListener("load", onLoad);
          dayImage.removeEventListener("error", onError);
        };
        const onLoad = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error("No se pudo cargar la ilustración original.")); };
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error("Se agotó el tiempo de carga de la ilustración."));
        }, 10000);
        dayImage.addEventListener("load", onLoad);
        dayImage.addEventListener("error", onError);
      });
    }
    if (!dayImage.naturalWidth || !dayImage.naturalHeight) {
      throw new Error("La ilustración original no está disponible.");
    }
    if (typeof dayImage.decode === "function") await dayImage.decode();
    if (dayImage.currentSrc !== expectedSource) {
      throw new Error("Ha cambiado el día seleccionado. Vuelve a solicitar el PDF.");
    }
    const fallbackUrl = new URL("assets/fallback.svg", document.baseURI).href;
    if (dayImage.currentSrc === fallbackUrl) {
      throw new Error("No se puede exportar: falta la ilustración original de este día.");
    }
  }

  /**
   * html2canvas puede omitir partes de los SVG con degradados, filtros y
   * máscaras. El navegador ya renderiza correctamente el SVG del modal:
   * aprovechamos ESE MISMO <img> para dibujarlo en un PNG sin crear una
   * ilustración alternativa ni alterar ningún archivo de assets/.
   *
   * Se hace solo en memoria y solo para la copia destinada al PDF.
   */
  function rasterizeDisplayedIllustration() {
    const ratio = dayImage.naturalWidth / dayImage.naturalHeight;
    const maxSide = 1800;
    const width = Math.round(ratio >= 1 ? maxSide : maxSide * ratio);
    const height = Math.round(ratio >= 1 ? maxSide / ratio : maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no permite preparar la ilustración para el PDF.");
    try {
      ctx.drawImage(dayImage, 0, 0, width, height);
      return canvas.toDataURL("image/png");
    } catch (error) {
      throw new Error("No se pudo incorporar la ilustración original al PDF. Comprueba que se carga desde el mismo servidor.", { cause: error });
    }
  }

  async function renderDayToCanvas(expectedDayTag) {
    // Capturar la referencia antes de la carga asíncrona de la biblioteca.
    const originalSource = dayImage.src;
    const html2canvas = await ensureHtml2Canvas();
    await waitForIllustration(originalSource);
    if (dayDialog.querySelector("#day-tag").textContent !== expectedDayTag) {
      throw new Error("Ha cambiado el día seleccionado. Vuelve a solicitar el PDF.");
    }
    const originalPng = rasterizeDisplayedIllustration();

    // Copia del DOM real: mismos títulos, textos, diseño e imagen original.
    const content = dayDialog.querySelector(".day-content").cloneNode(true);
    content.classList.add("pdf-export");
    content.querySelectorAll("button, .day-actions").forEach(control => control.remove());
    // Solo la copia para el PDF usa el PNG renderizado desde el SVG original.
    const exportImage = content.querySelector(".day-art-panel img");
    if (!exportImage) throw new Error("No se encontró la ilustración del día.");
    exportImage.src = originalPng;
    content.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
    const stage = document.createElement("div");
    stage.className = "pdf-export-stage";
    stage.setAttribute("aria-hidden", "true");
    stage.append(content);
    const styles = document.createElement("style");
    styles.textContent = PDF_STYLE;
    document.head.append(styles);
    document.body.append(stage);
    try {
      // El PNG debe estar decodificado antes de clonar el documento para
      // html2canvas; de lo contrario puede aparecer un panel vacío.
      if (typeof exportImage.decode === "function") await exportImage.decode();
      return await html2canvas(content, {
        backgroundColor: "#fff9ee", width: PDF_WIDTH, height: PDF_HEIGHT,
        scale: PDF_SCALE, useCORS: true, logging: false,
        imageTimeout: 12000, scrollX: 0, scrollY: 0,
        windowWidth: PDF_WIDTH, windowHeight: 850,
        onclone(doc) {
          // Mueve únicamente la copia al origen del lienzo; la app real no cambia.
          doc.documentElement.classList.add("no-animations");
          const clonedStage = doc.querySelector(".pdf-export-stage");
          if (clonedStage) {
            clonedStage.style.setProperty("left", "0px", "important");
            clonedStage.style.setProperty("top", "0px", "important");
            clonedStage.style.setProperty("z-index", "1", "important");
          }
        }
      });
    } finally {
      stage.remove();
      styles.remove();
    }
  }

  function canvasToJpeg(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(blob => {
          if (blob && blob.size > 0) resolve(blob);
          else reject(new Error("No se pudo convertir la diapositiva en imagen."));
        }, "image/jpeg", 0.95);
      } catch (error) {
        reject(error);
      }
    });
  }

  async function makePdf(canvas) {
    // PDF de una página con imagen JPEG incrustada, sin servicios ni dependencias.
    const jpeg = new Uint8Array(await (await canvasToJpeg(canvas)).arrayBuffer());
    const parts = [];
    const offsets = [0];
    let length = 0;
    const encoder = new TextEncoder();
    const append = bytes => { parts.push(bytes); length += bytes.byteLength; };
    const write = text => append(encoder.encode(text));
    const object = (number, body) => {
      offsets[number] = length;
      write(`${number} 0 obj\n${body}\nendobj\n`);
    };
    write("%PDF-1.4\n%Advento\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    object(2, "<< /Type /Pages /Count 1 /Kids [3 0 R] >>");
    object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 960 540] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
    offsets[4] = length;
    write(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.byteLength} >>\nstream\n`);
    append(jpeg);
    write("\nendstream\nendobj\n");
    const draw = "q\n960 0 0 540 0 0 cm\n/Im0 Do\nQ\n";
    object(5, `<< /Length ${encoder.encode(draw).byteLength} >>\nstream\n${draw}endstream`);
    const xref = length;
    write("xref\n0 6\n0000000000 65535 f \n");
    for (let i = 1; i <= 5; i++) write(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    write(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: "application/pdf" });
  }

  async function exportCurrentDayPdf() {
    if (pdfExportInProgress || !dayDialog.open) return;
    const button = document.querySelector("#download-day-pdf");
    const label = button.querySelector("span");
    const match = dayDialog.querySelector("#day-tag").textContent.match(/DÍA\s+(\d+)/);
    if (!match) return;
    const day = Number(match[1]);
    pdfExportInProgress = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    label.textContent = "Preparando PDF…";
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const canvas = await renderDayToCanvas(dayDialog.querySelector("#day-tag").textContent);
      const pdf = await makePdf(canvas);
      const link = document.createElement("a");
      const url = URL.createObjectURL(pdf);
      link.href = url;
      link.download = `Adviento_Dia_${String(day).padStart(2, "0")}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showPdfToast(`PDF del día ${day} preparado para descargar ✦`);
    } catch (error) {
      console.error("No se pudo exportar el día a PDF:", error);
      showPdfToast(error.message || "No se ha podido generar el PDF.");
    } finally {
      pdfExportInProgress = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      label.textContent = "Descargar PDF";
    }
  }

  downloadButton.addEventListener("click", exportCurrentDayPdf);
})();
