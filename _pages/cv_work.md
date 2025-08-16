---
layout: page
title: "💼 Experiencia profesional"
description: "Curriculum Vitae"
---

<img src="assets/images/profile.jpg" class="profile image-cropper">

{% assign start_date = '2004-10-01' | date: '%s' %}
{% assign now_date   = 'now' | date: '%s' %}

{%- comment -%}
  Segundos en un año aproximado (365 días)
  (no se tienen en cuenta años bisiestos exactos)
{%- endcomment -%}
{% assign seconds_in_year = 31536000 %}

{% assign diff_seconds = now_date | minus: start_date %}
{% assign years_passed = diff_seconds | divided_by: seconds_in_year %}

Se muestran los últimos **{{ years_passed }} años** de experiencia.

* **Profesor de Informática – Educación Secundaria Obligatoria**. Colegio San Juan Bautista – HH. Maristas Denia (España)
* **Profesor de Español como Lengua Extranjera (ELE)**. Fachhochschule Salzburg (Austria)
* **Investigación: Traducción Automática**. Grupo de investigación TRANSDUCENS. Departamento de Lenguajes y Sistemas Informáticos. Universidad de Alicante
* **Investigación: Proyecto Europeo de Investigación Educativa**. Fachhochschule Salzburg

<a href="https://www.linkedin.com/in/ebenimeli/?locale=es_ES" target="_blank">Ver perfil en LinkedIn</a>
