---
layout: idx
---

<div class="post-container">{% include marquee.html %}</div>

[![image](assets/images/posts/2024/01/post.jpg)](pages/write.html)

## 🙋🏻‍♂️ Hola, mundo

Esta es una web personal, un **cajón de sastre** donde conviven mis intereses [personales](/pages/me.html) y [profesionales](/pages/cv_topics.html). Soy Enrique, [ingeniero en **Informática**](pages/cv_edu.html) y [**profesor**](pages/cv_work.html) de Secundaria. En mis ratos libres, suelo [leer](pages/read_fav.html), [escribir](pages/write.html) y experimentar con proyectos digitales.

## 🌱 Proyectos

Aquí encontrarás [mi blog](/blog/) más personal, junto a enlaces a otros espacios donde [escribo](pages/write.html) con frecuencia: [boletines](https://substack.com/@ebenimeli), notas y proyectos en torno a [educación](https://www.esferatic.com/), [organización](https://www.ochoenpunto.com/), tecnología y cultura digital. Si te apetece, empieza por las [_Notas al vuelo_](pages/write_alvuelo.html) o visita mi [_/now page_](/now/) donde cuento en qué ando últimamente.

Estos son los últimos _posts_ que he publicado:

<div class="latestposts">
  <ul>
    {%- assign count = 0 -%}
    {%- for log in site.data.log -%}
      {%- if count < 3 and log.cat == "write" -%}
        <li>
          <div class="tooltip">
            <span class="tooltiptext">{{ log.timestamp }}</span>
          </div>
          {%- if log.link -%}
            <a href="{{ log.link }}"><span class="logtext">{{ log.text }}</span></a>
          {%- else -%}
            <span class="logtext">{{ log.text }}</span>
          {%- endif -%}
        </li>
        {%- assign count = count | plus: 1 -%}
      {%- endif -%}
    {%- endfor -%}
  </ul>
</div>

## ✉️ Redes y contacto

<!--
<a href="/contact/">
    <img src="assets/images/profile.jpg" class="profile-image-lp">
</a>
-->
Si quieres **escribirme**, puedes hacerlo a través del [formulario de contacto](/contact/). También puedes enviarme un [mensaje directo en X](https://x.com/enriquebenimeli) o [en LinkedIn](https://www.linkedin.com/in/ebenimeli/?locale=es_ES) para contactar conmigo. También puedes encontrarme en [Instagram](https://www.instagram.com/ebenimeli/). Me encantará leerte.
