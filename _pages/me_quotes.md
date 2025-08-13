---
layout: page
title: ""
description: "Una selección de citas"
---

<h2>Citas</h2>

{%- assign fallback_link = "https://www.ebenimeli.org/pages/me_quotes.html" -%}

<ul>
  {%- for q in site.data.quotes -%}
    {%- assign link_out = q.link | default: fallback_link -%}
    <li>
      «{{ q.quote }}» ({{ q.author }}) — 
      <a href="{{ link_out }}" target="_blank" rel="noopener">&#9654;</a>
    </li>
  {%- endfor -%}
</ul>
