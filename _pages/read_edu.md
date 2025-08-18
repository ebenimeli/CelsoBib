---
layout: page
title: "📖 Lecturas sobre educación"
description: "Educación"
---

Lecturas recientes sobre educación.

<div class="w-100">

<ol>
{% for item in site.data.log %}
  {% if item.cat == 'read' and item.text contains '#edu' %}
      <li>
        <a class="read" alt="" href="{{ item.link }}">{{ item.text }} &#9654;
</a>
      </li>
  {% endif %}
{% endfor %}
</ol>
</div>
