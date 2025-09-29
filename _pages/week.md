---
layout: page
title: ""
permalink: /week/
description: "Lo más reciente"
---

<div class="w-100">
  <div class="logs">

    {%- comment -%} 1) Límites de la ÚLTIMA semana completa (lun 00:00 → dom 23:59:59) {%- endcomment -%}
    {% assign now_date          = 'now' | date: '%Y-%m-%d' %}
    {% assign today_midnight_ts = now_date | append: ' 00:00:00' | date: '%s' | plus: 0 %}
    {% assign weekday_num       = 'now' | date: '%u' | plus: 0 %}  {%- comment -%} 1..7 (lunes..domingo) {%- endcomment -%}

    {% assign sec_per_day       = 86400 %}
    {% assign week_secs         = 7 | times: sec_per_day %}
    {% assign since_mon_secs    = weekday_num | minus: 1 | times: sec_per_day %}

    {% assign start_this_week_ts = today_midnight_ts | minus: since_mon_secs %}
    {% assign start_last_week_ts = start_this_week_ts | minus: week_secs %}
    {% assign end_last_week_ts   = start_this_week_ts | minus: 1 %}

    {%- comment -%} 2) Cabecera legible {%- endcomment -%}
    {% assign start_last_week_str = start_last_week_ts | date: '%-d %B %Y' %}
    {% assign end_last_week_str   = end_last_week_ts   | date: '%-d %B %Y' %}

    <h2>Semana del {{ start_last_week_str }} al {{ end_last_week_str }}</h2>

    {%- comment -%} 3) Definición de grupos (cat → título) {%- endcomment -%}
    {% capture groups_def %}

watch,video,movie::Lo que vi|
read::Lo que leí|
say::Lo que dije|
write::Lo que escribí|
learn::Lo que aprendí|
code::Lo que programé|
music,podcast::Lo que escuché|
photo::Lo que fotografié|
news::Lo que supe|
like,love::Lo que me gustó|
thought::Lo que pensé|
quote::Citas
{% endcapture %}
{% assign groups_list = groups_def | strip | split: '|' %}

    {%- comment -%}
      4) Render de cada grupo.
      Si prefieres descendente por grupo: usa "{% raw %}{% for log in site.data.log reversed %}{% endraw %}" en lugar del normal.
    {%- endcomment -%}
    {%- for g in groups_list -%}
      {% assign pair = g | strip | split: '::' %}
      {% assign cats_csv = pair[0] | strip %}
      {% assign gtitle   = pair[1] | strip %}
      {% assign cats_guard = cats_csv | prepend: ',' | append: ',' %}

      {%- capture items -%}
        <ul class="loggroup">
        {%- for log in site.data.log -%}
          {% assign ts = log.timestamp | date: '%s' | plus: 0 %}
          {% if ts >= start_last_week_ts and ts <= end_last_week_ts %}
            {%- assign needle = ',' | append: log.cat | append: ',' -%}
            {% if cats_guard contains needle %}

              {% assign item_class = 'logitem' %}
              {% if log.cat == 'gm' %}
                {% assign item_class = 'logitemgm' %}
              {% endif %}

              {% assign display_cat = log.cat %}
              {% if log.cat == 'watch' %}
                {% assign display_cat = 'video' %}
              {% endif %}

              <li class="{{ item_class }}">
                <div class="tooltip">
                  <span class="logid">•</span>
                  <span class="tooltiptext">{{ log.timestamp }}</span>
                </div>

                <span>{% include icons.html cat=display_cat %}</span>
                <span class="logtext">{{ log.text }}</span>
                {% if log.link %}
                  <span class="loglink"><a title="{{ log.timestamp }}" href="{{ log.link }}">→</a></span>
                {% endif %}
              </li>

            {% endif %}
          {% endif %}
        {%- endfor -%}
        </ul>
      {%- endcapture -%}

      {% if items contains '<li' %}
        <h3>{{ gtitle }}</h3>
        {{ items }}
      {% endif %}
    {%- endfor -%}

  </div>
</div>
