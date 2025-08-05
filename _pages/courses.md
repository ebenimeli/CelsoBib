---
layout: page
title: ""
description: "Curriculum Vitae"
---

## Cursos de formación

  {% for curso in site.data.courses %}
<details class="course">
  <summary>
  <span class="course-title">{{ curso.name }}</span>. <span class="organizer">{{ curso.organizer }}</span>. {% if curso.credits %} {{ curso.credits }} ECTS {% endif %} / {% if curso.hours %} {{ curso.hours }} horas {% endif %} [+ info]
  </summary>
    <ul class="details">
     <li><strong>Resumen: </strong><span class="course-description">{{ curso.description }}</span>.</li>
     <li><strong>Modalidad:</strong> {{ curso.modality }}</li>
     {% if curso.location %}<li><strong>Lugar:</strong> {{ curso.location }} </li>{% endif %}
     <li><strong>Fechas:</strong> {{ curso.start }} - {{ curso.end }}</li>
     <li>Idiomas: {{ curso.language | upcase }}</li>
     <li><strong>Contenidos:</strong> {{ curso.contents }}</li>
     <li><strong>+ info: </strong> <a href="{{ curso.url }}" target="_blank">{{ curso.url | truncate: 50}} </a></li>
      {% if curso.observations %}
        <li><strong>Observaciones:</strong> {{ curso.observations }}</li>
      {% endif %}
      </ul>
      </details>
  {% endfor %}
