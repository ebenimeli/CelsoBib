---
layout: page
title: "✉️ Contacto"
permalink: /contact/
description: "Formas de contacto"
---

<p>Si quieres ponerte en contacto conmigo, rellena el siguiente <strong>formulario</strong> y responderé lo antes posible.</p>

<!-- Precalienta la cookie CSRF (no bloquea nada, pero puede ser bloqueado por adblockers) -->

<img src="/contact.php?token=1" alt="" width="1" height="1"
     style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true" loading="eager" />

<form id="contact-form" action="/contact.php" method="post" accept-charset="UTF-8"
      enctype="application/x-www-form-urlencoded" novalidate>
  <fieldset>
    <legend>Contacto</legend>

    <!-- Nombre -->
    <div class="form-field">
      <label for="name">Nombre</label>
      <input id="name" name="name" type="text" required aria-required="true"
             autocomplete="name" autocapitalize="words" />
    </div>

    <!-- Correo electrónico -->
    <div class="form-field">
      <label for="email">Correo electrónico</label>
      <input id="email" name="email" type="email" required aria-required="true"
             autocomplete="email" inputmode="email" />
    </div>

    <!-- Asunto -->
    <div class="form-field">
      <label for="subject">Asunto</label>
      <input id="subject" name="subject" type="text" required aria-required="true" maxlength="120" />
    </div>

    <!-- Mensaje -->
    <div class="form-field">
      <label for="message">Mensaje</label>
      <textarea id="message" name="message" rows="6" required minlength="10" maxlength="5000"></textarea>
      <small id="counter">0 / 5000</small>
    </div>

    <!-- Teléfono (opcional) -->
    <div class="form-field">
      <label for="phone">Teléfono (opcional)</label>
      <input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" />
    </div>

    <!-- Consentimiento RGPD -->
    <div class="form-field consent-field">
      <input id="consent" name="consent" type="checkbox" required aria-required="true" />
      <label for="consent">
        He leído y acepto la <a href="/privacy/" target="_blank" rel="noopener">política de privacidad</a>.
      </label>
    </div>

    <!-- Honeypot anti-spam (oculto con CSS, no type="hidden") -->
    <div class="form-field hp" aria-hidden="true">
      <label for="website">No rellenes este campo</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <!-- Señuelos JS -->
    <input type="hidden" id="jsok" name="jsok" value="0" />
    <input type="hidden" id="started" name="started" value="" />
    <input type="hidden" id="csrf" name="csrf" value="" />

    <!-- Estado accesible -->
    <p class="form-status" aria-live="polite"></p>

    <button type="submit">Enviar</button>

  </fieldset>
</form>

<style>
  /* Ocultar honeypot sin usar display:none (para que los bots lo vean) */
  .hp {
    position: absolute !important;
    left: -9999px !important;
    width: 1px; height: 1px; overflow: hidden;
  }
  .form-status { min-height: 1.2em; }
</style>

<!-- contact.js robusto (rellena trampas, CSRF y valida) -->
<script>
(function(){
  "use strict";
  function getCookie(name) {
    return document.cookie.split('; ').reduce((acc, cur) => {
      const [k, ...v] = cur.split('=');
      if (k === name) return decodeURIComponent(v.join('=') || '');
      return acc;
    }, '');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const msg = document.getElementById('message');
    const counter = document.getElementById('counter');
    const jsok = document.getElementById('jsok');
    const started = document.getElementById('started');
    const csrf = document.getElementById('csrf');
    const status = document.querySelector('.form-status');

    if (!form) return;

    // Contador
    msg.addEventListener('input', () => {
      counter.textContent = `${msg.value.length} / ${msg.maxLength}`;
    });

    // started + jsok
    started.value = String(Date.now());
    setTimeout(() => { jsok.value = '1'; }, 800);

    // Intentar obtener cookie CSRF
    const applyToken = () => {
      const t = getCookie('csrf_token');
      if (t) csrf.value = t;
      return !!t;
    };
    if (!applyToken()) {
      fetch('/contact.php?token=1', { credentials: 'same-origin' })
        .then(() => setTimeout(applyToken, 250))
        .catch(() => {});
    }

    // Validación previa al envío
    form.addEventListener('submit', e => {
      if (msg.value.trim().length < 10) {
        e.preventDefault();
        alert('El mensaje debe tener al menos 10 caracteres.');
        return;
      }
      if (!document.getElementById('consent').checked) {
        e.preventDefault();
        alert('Debes aceptar la política de privacidad.');
        return;
      }
      if (jsok.value !== '1') {
        e.preventDefault();
        alert('Debes habilitar JavaScript para enviar el formulario.');
        return;
      }
      if (!csrf.value) {
        e.preventDefault();
        alert('Token de seguridad ausente. Recarga la página y vuelve a intentarlo.');
        return;
      }
      if (Date.now() - parseInt(started.value, 10) < 3000) {
        e.preventDefault();
        alert('Por favor, espera unos segundos antes de enviar.');
        return;
      }
      if (status) status.textContent = 'Enviando…';
    });
  });
})();
</script>
