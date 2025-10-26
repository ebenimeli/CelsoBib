---
layout: page
title: "✉️ Contacto"
permalink: /contact/
description: "Formas de contacto"
---

<p>Si quieres ponerte en contacto conmigo, rellena el siguiente formulario y responderé lo antes posible</p>

<!-- Precalienta la cookie CSRF desde PHP (no bloquea nada) -->
<img src="/contact.php?token=1" alt="" width="1" height="1" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true" />

<form id="contact-form" action="/contact.php" method="post" accept-charset="UTF-8" enctype="application/x-www-form-urlencoded" novalidate>
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
      <label for="consent">He leído y acepto la <a href="/privacy/">política de privacidad</a>.</label>
    </div>

    <!-- Honeypot anti-spam (oculto con CSS, no type="hidden") -->
    <div class="form-field hp" aria-hidden="true">
      <label for="website">No rellenes este campo</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <!-- Señuelo JS y trampas -->
    <input type="hidden" id="jsok" name="jsok" value="0" />
    <input type="hidden" id="started" name="started" value="" />
    <input type="hidden" id="csrf" name="csrf" value="" />

    <!-- Mensajes de estado -->
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

<script src="/assets/js/contact.js" defer></script>
