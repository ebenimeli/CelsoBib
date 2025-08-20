---
layout: page
title: "✉️ Contacto"
permalink: /contact/
description: "Formas de contacto"
---

<p>Si quieres ponerte en contacto conmigo, rellena el siguiente formulario y responderé lo antes posible</p>

<form action="/contact.php" method="post" accept-charset="UTF-8" enctype="application/x-www-form-urlencoded" novalidate>
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
      <input id="subject" name="subject" type="text" required aria-required="true"
             maxlength="120" />
    </div>

    <!-- Mensaje -->
    <div class="form-field">
      <label for="message">Mensaje</label>
      <textarea id="message" name="message" rows="6" required aria-required="true"
                minlength="10" maxlength="5000"></textarea>
    </div>

    <!-- Teléfono (opcional) -->
    <div class="form-field">
      <label for="phone">Teléfono (opcional)</label>
      <input id="phone" name="phone" type="tel" autocomplete="tel"
             inputmode="tel" />
    </div>

    <!-- Consentimiento RGPD -->
<div class="form-field consent-field">
  <input id="consent" name="consent" type="checkbox" required aria-required="true" />
  <label for="consent">He leído y acepto la <a href="/privacy/">política de privacidad</a>.</label>
</div>



    <!-- Honeypot anti-spam (deja oculto con CSS) -->
    <div class="form-field hp">
      <label for="website">No rellenes este campo</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <!-- Mensajes de estado (opcional, para usar con JS) -->
    <p class="form-status" aria-live="polite"></p>

    <button type="submit">Enviar</button>
  </fieldset>
</form>
