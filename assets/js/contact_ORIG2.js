// === contact.js mejorado ===
// Añade protección antispam (JS señuelo + tiempo mínimo), contador y validación.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const message = document.getElementById("message");
  const counter = document.getElementById("counter");
  const jsok = document.getElementById("jsok");
  const started = document.getElementById("started");
  const csrf = document.getElementById("csrf");
  const status = document.querySelector(".form-status");

  // === 1. Contador de caracteres ===
  const updateCounter = () => {
    counter.textContent = message.value.length + " / 5000";
  };
  message.addEventListener("input", updateCounter);
  updateCounter();

  // === 2. Marcar "jsok" (para bots sin JS) ===
  if (jsok) {
    setTimeout(() => {
      jsok.value = "1";
    }, 800); // valor visible solo si el usuario espera un poco
  }

  // === 3. Guardar timestamp inicial ===
  if (started) {
    started.value = String(Date.now());
  }

  // === 4. Copiar token CSRF desde cookie (si existe) ===
  function getCookie(name) {
    return document.cookie
      .split("; ")
      .map((c) => c.split("="))
      .reduce((acc, [k, v]) => (k === name ? decodeURIComponent(v) : acc), "");
  }
  if (csrf) {
    const token = getCookie("csrf_token");
    if (token) csrf.value = token;
  }

  // === 5. Validación antes del envío ===
  form.addEventListener("submit", (e) => {
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

    // Trampa de tiempo: menos de 3 segundos = sospechoso
    if (started && Date.now() - parseInt(started.value) < 3000) {
      e.preventDefault();
      alert("Por favor, espera unos segundos antes de enviar el formulario.");
      return;
    }

    if (status) status.textContent = "Enviando…";
  });
});
