// assets/js/contact.js
// Contacto robusto: CSRF fallback + trampas JS + validación + anti doble envío
(function () {
  "use strict";

  // Cambia a true si quieres ver logs en consola durante pruebas
  const DEBUG = false;
  const log = (...args) => {
    if (DEBUG && window.console) console.log("[contact.js]", ...args);
  };
  const warn = (...args) => {
    if (DEBUG && window.console) console.warn("[contact.js]", ...args);
  };

  function getCookie(name) {
    return document.cookie.split("; ").reduce((acc, cur) => {
      const [k, ...v] = cur.split("=");
      if (k === name) return decodeURIComponent(v.join("=") || "");
      return acc;
    }, "");
  }

  function safeMaxLength(el, fallback = 5000) {
    const ml = parseInt(el.getAttribute("maxlength") || el.maxLength || "", 10);
    return Number.isFinite(ml) && ml > 0 ? ml : fallback;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form =
      document.getElementById("contact-form") || document.querySelector("form");
    const message = document.getElementById("message");
    const counter = document.getElementById("counter");
    const jsok = document.getElementById("jsok");
    const started = document.getElementById("started");
    const csrfField = document.getElementById("csrf");
    const status = document.querySelector(".form-status");
    const consent = document.getElementById("consent");

    if (!form || !message || !counter || !jsok || !started || !csrfField) {
      warn("Faltan elementos del formulario (comprueba IDs en el HTML).");
      return;
    }

    // === 1) Contador de caracteres ===
    const MAX = safeMaxLength(message, 5000);
    const updateCounter = () => {
      counter.textContent = `${message.value.length} / ${MAX}`;
    };
    message.addEventListener("input", updateCounter, { passive: true });
    updateCounter();

    // === 2) Trampas JS ===
    started.value = String(Date.now());
    setTimeout(() => {
      jsok.value = "1";
      log("jsok=1");
    }, 800);

    // === 3) CSRF: intentar desde cookie; si no, pedir token por fetch ===
    const applyCsrfFromCookie = () => {
      const t = getCookie("csrf_token");
      if (t) {
        csrfField.value = t;
        log("CSRF aplicado desde cookie");
        return true;
      }
      return false;
    };

    const fetchCsrfWithTimeout = (ms = 4000) => {
      const ac = new AbortController();
      const id = setTimeout(() => ac.abort(), ms);
      return fetch("/contact.php?token=1", {
        method: "GET",
        credentials: "same-origin",
        signal: ac.signal,
      })
        .catch((err) => warn("fetch token falló:", err))
        .finally(() => clearTimeout(id));
    };

    if (!applyCsrfFromCookie()) {
      // Espera breve por si la <img> ya lo puso; luego fallback por fetch
      setTimeout(() => {
        if (applyCsrfFromCookie()) return;
        log("CSRF cookie ausente; intentando fetch /contact.php?token=1");
        fetchCsrfWithTimeout(4000).then(() =>
          setTimeout(applyCsrfFromCookie, 250)
        );
      }, 600);
    }

    // === 4) Evitar doble envío + validación previa ===
    let sending = false;

    form.addEventListener(
      "submit",
      (e) => {
        if (sending) {
          e.preventDefault();
          return;
        }

        // Validación rápida en cliente (el servidor valida igualmente)
        const msg = (message.value || "").trim();
        if (msg.length < 10) {
          e.preventDefault();
          alert("El mensaje debe tener al menos 10 caracteres.");
          message.focus();
          return;
        }

        if (consent && !consent.checked) {
          e.preventDefault();
          alert("Debes aceptar la política de privacidad antes de enviar.");
          return;
        }

        if (jsok.value !== "1") {
          e.preventDefault();
          alert("Necesitas habilitar JavaScript para enviar el formulario.");
          return;
        }

        const startedVal = parseInt(started.value || "0", 10);
        if (!Number.isFinite(startedVal) || Date.now() - startedVal < 3000) {
          e.preventDefault();
          alert("Por favor, espera unos segundos antes de enviar.");
          return;
        }

        if (!csrfField.value) {
          // Intento exprés de recuperar token y reintentar
          e.preventDefault();
          alert(
            "No se ha podido obtener el token de seguridad (CSRF). Reintentando…"
          );
          fetchCsrfWithTimeout(3000).then(() => {
            setTimeout(() => {
              if (applyCsrfFromCookie()) {
                form.submit(); // reintento automático
              } else {
                alert(
                  "No se pudo obtener el token CSRF. Recarga la página y vuelve a intentarlo (desactiva bloqueadores si persiste)."
                );
              }
            }, 250);
          });
          return;
        }

        // Marca envío y muestra estado
        sending = true;
        if (status) status.textContent = "Enviando…";
      },
      { capture: true }
    );
  });
})();
