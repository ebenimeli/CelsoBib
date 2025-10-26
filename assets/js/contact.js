// contact.js (robusto, con fallback CSRF + depuración ligera)
(function () {
  "use strict";

  function getCookie(name) {
    return document.cookie.split("; ").reduce((acc, cur) => {
      const [k, ...v] = cur.split("=");
      if (k === name) return decodeURIComponent(v.join("=") || "");
      return acc;
    }, "");
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

    if (!form || !message || !counter || !jsok || !started || !csrfField) {
      console.warn(
        "contact.js: faltan elementos del formulario (comprueba ids)"
      );
      return;
    }

    // Contador de caracteres
    const updateCounter = () => {
      counter.textContent = `${message.value.length} / ${message.maxLength}`;
    };
    message.addEventListener("input", updateCounter);
    updateCounter();

    // Rellenar started
    started.value = String(Date.now());
    console.log("contact.js: started set to", started.value);

    // Señuelo JS
    setTimeout(() => {
      jsok.value = "1";
      console.log("contact.js: jsok set to 1");
    }, 800);

    // Copiar CSRF desde cookie si existe
    const applyCsrfFromCookie = () => {
      const t = getCookie("csrf_token");
      if (t) {
        csrfField.value = t;
        console.log("contact.js: csrf token applied from cookie");
        return true;
      }
      return false;
    };

    // Intento inmediato
    if (!applyCsrfFromCookie()) {
      // Si no hay cookie, hacemos fetch al endpoint para forzar creación (fallback)
      setTimeout(() => {
        if (applyCsrfFromCookie()) return;
        console.log(
          "contact.js: cookie csrf_token ausente; intentando fetch /contact.php?token=1"
        );
        fetch("/contact.php?token=1", {
          method: "GET",
          credentials: "same-origin",
        })
          .then(() => {
            // small delay para que la cookie sea escrita por el servidor
            setTimeout(() => {
              if (applyCsrfFromCookie()) {
                // ok
              } else {
                console.warn(
                  "contact.js: No se obtuvo csrf_token tras fetch. Revisa bloqueo por extensions/CSP."
                );
              }
            }, 200);
          })
          .catch((err) => {
            console.warn("contact.js: fetch token falló", err);
          });
      }, 600);
    }

    // Evitar doble envío y validar antes de enviar
    let sending = false;
    form.addEventListener(
      "submit",
      (e) => {
        if (sending) {
          e.preventDefault();
          return;
        }

        // Validación mínima cliente
        const msg = message.value.trim();
        if (msg.length < 10) {
          e.preventDefault();
          alert("El mensaje debe tener al menos 10 caracteres.");
          message.focus();
          return;
        }

        const consent = document.getElementById("consent");
        if (consent && !consent.checked) {
          e.preventDefault();
          alert("Debes aceptar la política de privacidad antes de enviar.");
          return;
        }

        // Asegurar jsok
        if (jsok.value !== "1") {
          e.preventDefault();
          alert(
            "Es necesario que tu navegador ejecute Javascript para enviar el formulario. Por favor, habilita Javascript y vuelve a intentarlo."
          );
          return;
        }

        // Asegurar started > 3s
        const startedVal = parseInt(started.value || "0", 10);
        if (isNaN(startedVal) || Date.now() - startedVal < 3000) {
          e.preventDefault();
          alert(
            "Por favor espera unos segundos antes de enviar el formulario."
          );
          return;
        }

        // Asegurar CSRF presente
        if (!csrfField.value) {
          e.preventDefault();
          alert(
            "Token CSRF ausente — recargando token y reintenta. Si el problema persiste, desactiva bloqueadores y comprueba la consola."
          );
          // Intento rápido de recuperar token antes de abandonar
          fetch("/contact.php?token=1", {
            method: "GET",
            credentials: "same-origin",
          })
            .then(() =>
              setTimeout(() => {
                const t = getCookie("csrf_token");
                if (t) {
                  csrfField.value = t;
                  form.submit(); // reintentar envío inmediato si conseguimos token
                } else {
                  console.warn("contact.js: reintento CSRF no funcionó");
                }
              }, 250)
            )
            .catch(() => {});
          return;
        }

        // todo ok: marcar envío
        sending = true;
        if (status) status.textContent = "Enviando…";
      },
      { capture: true }
    );
  });
})();
