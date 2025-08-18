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
    {% assign clean_text = item.text | replace: '#edu', '' %}
      <li>
        <a class="read" href="{{ item.link }}">{{ clean_text | strip }} &#9654; 📖
      </li>
  {% endif %}
{% endfor %}
</ol>
</div>
