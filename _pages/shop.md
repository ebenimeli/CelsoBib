---
layout: page
title: ""
description: "Algunas recomendaciones"
---

## ❤️ Favoritos y recomendaciones
<table class="products">
  {% for product in site.data.shop %}
  <tr>
  <td class="img-product">
<a href="{{ product.link }}" target="_blank"><img class="product" src="assets/images/pages/shop/{{ product.image }}" alt="{{ product.title }}"></a>
</td>
<td>
<details class="course">
  <summary>
  <a href="{{ product.link }}" target="_blank">
  <span class="course-title">{{ product.name }}</span>.</a> <span class="organizer">{{ product.description }}</span>. [+ info]
  </summary>
    <ul class="details">
     <li><strong>Resumen: </strong><span class="course-description">{{ curso.description }}</span></li>
     <li><strong>Contenidos:</strong> {{ curso.contents }}</li>
     <li><strong>+ info: </strong> <a href="{{ curso.url }}" target="_blank">{{ curso.url | truncate: 50}} </a></li>
      {% if curso.observations %}
        <li><strong>Observaciones:</strong> {{ curso.observations }}</li>
      {% endif %}
      </ul>
      </details>
      </td>
      </tr>
  {% endfor %}
  </table>