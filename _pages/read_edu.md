---
layout: page
title: "🎓 Lecturas sobre educación"
description: "Educación"
---

Lecturas recientes sobre educación.

<div class="w-100">

<ol class="book-list">
{% for item in site.data.log %}
  {% if item.cat == 'read' and item.text contains '#edu' %}
      <li>
        <a alt="{{ item.description }}" class="book-title" href="{{ item.link }}"><i>{{ item.title }}</i></a>
      </li>
  {% endif %}
{% endfor %}
</ol>
</div>
