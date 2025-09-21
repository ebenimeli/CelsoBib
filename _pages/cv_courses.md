---
layout: page
title: "Formación, cursos, charlas"
description: "Cursos de grado, máster, doctorado y otros"
---

<h2 id="courses-title">Cursos de formación</h2>

<!-- ====== FILTRO SUPERIOR ====== -->
<div id="course-filter" role="toolbar" aria-label="Filtrar cursos por tipo">
  <!-- Puedes renombrar las etiquetas visibles sin tocar data-filter -->
  <button type="button" class="filter-btn" data-filter="highlight" aria-pressed="false" title="Solo destacados">
    <i class="fa-regular fa-star"></i>º
  </button>
  <button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true" title="Todos los cursos">
    Todos
  </button>
  <button type="button" class="filter-btn" data-filter="master" aria-pressed="false">
    Máster
  </button>
  <button type="button" class="filter-btn" data-filter="degree" aria-pressed="false">
    Grado
  </button>
  <button type="button" class="filter-btn" data-filter="phd" aria-pressed="false">
    Doctorado
  </button>
  <button type="button" class="filter-btn" data-filter="talk" aria-pressed="false">
    Charlas
  </button>
  <button type="button" class="filter-btn" data-filter="course" aria-pressed="false">
    Cursos
  </button>

<span id="course-count" aria-live="polite" class="count-badge" title="Resultados visibles"></span>

</div>

<!-- ====== LISTA DE CURSOS ====== -->
<div id="course-list">
{% assign cursos = site.data.courses %}
{% for curso in cursos %}
  {% if curso.visibility == nil or curso.visibility != 'private' %}
    {% assign type_slug = curso.type | downcase | strip | replace: ' ', '-' %}
    <div
      class="course-item {{ type_slug }}"
      data-type="{{ type_slug }}"
      {% if curso.highlight %}data-highlight="true"{% else %}data-highlight="false"{% endif %}
    >
      <details class="course{% if curso.highlight %} highlight{% endif %}">
        <summary>
          {% if curso.highlight %}<i class="fa-regular fa-star"></i>&nbsp;{% endif %}<span class="course-title">{{ curso.name }}</span>.
          <span class="organizer">{{ curso.organizer }}</span>.
          <span class="more">[+ info]</span>
        </summary>
        <ul class="details">
          {% if curso.program %}
          <li><strong>Programa:</strong> {{ curso.program }}</li>
          {% endif %}

          {% if curso.organizer %}<li>{{ curso.organizer }} </li>{% endif %}
          {% if curso.faculty %}<li>{{ curso.faculty }} </li>{% endif %}
          {% if curso.department %}<li>{{ curso.department }} </li>{% endif %}

          <li><strong>Resumen:</strong> <span class="course-description">{{ curso.description }}</span>.</li>

          {% assign modality = curso.modality | downcase | strip %}
          {% if curso.location %}
          <li>
            <strong>Lugar:</strong> {{ curso.location }}
            {% if modality == 'online' %}
              <i class="fa-solid fa-hand-pointer" aria-hidden="true"></i><span class="sr-only"> (Online)</span>
            {% endif %}
          </li>
          {% endif %}

          {% if curso.credits or curso.hours %}
            <li><strong>Créditos:</strong>
            {% if curso.credits %} {{ curso.credits }} ECTS{% endif %}
            {% if curso.credits and curso.hours %} / {% endif %}
            {% if curso.hours %} {{ curso.hours }} horas{% endif %}
            </li>
          {% endif %}
          {% assign y_start = curso.start | date: "%Y" %}
          {% assign y_end   = curso.end   | date: "%Y" %}

          {% assign months_es = "enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre" | split: "," %}

          {% assign sd = curso.start | date: "%-d" %}
          {% assign sm = curso.start | date: "%-m" | minus: 1 %}
          {% assign sy = curso.start | date: "%Y" %}

          {% assign ed = curso.end | date: "%-d" %}
          {% assign em = curso.end | date: "%-m" | minus: 1 %}
          {% assign ey = curso.end | date: "%Y" %}

          <li><strong>Fechas:</strong>
            {% if curso.start == curso.end %}
              {{ sd }} {{ months_es[sm] }} {{ sy }}
            {% else %}
              {% if sy == ey %}
                {{ sd }} {{ months_es[sm] }} – {{ ed }} {{ months_es[em] }} {{ ey }}
              {% else %}
                {{ sd }} {{ months_es[sm] }} {{ sy }} – {{ ed }} {{ months_es[em] }} {{ ey }}
              {% endif %}
            {% endif %}
          </li>



          <li><strong>Idiomas:</strong> {{ curso.language | upcase }}</li>
          <li><strong>Contenidos:</strong> {{ curso.contents }}</li>

          {% if curso.certification %}
          <li>
            <i class="fa-solid fa-award"></i> {{ curso.certification}}
          </li>
          {% endif %}
          {% if curso.url %}
          <li><strong>+ info: </strong>
            <a href="{{ curso.url }}" target="_blank" rel="noopener">{{ curso.url | truncate: 50 }}</a>
          </li>
          {% endif %}

          {% if curso.observations %}
          <li><strong>Observaciones:</strong> {{ curso.observations }}</li>
          {% endif %}
        </ul>
      </details>
    </div>

{% endif %}
{% endfor %}

</div>

<!-- ====== ESTILOS MÍNIMOS ====== -->
<style>
  #course-filter {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
    align-items: center;
    margin: 1rem 0 1.25rem;
  }

  .filter-btn {
    border: 1px dotted var(--c-border, #e2e2e2);
    background: var(--c-bg);
    color: var(--primary-font-color);
    padding: .45rem .75rem;
    border-radius: .6rem;
    cursor: pointer;
    font: inherit;
  }
  .filter-btn:is(:hover, :focus-visible) {
    outline: none;
    border-color: var(--c-accent, #444);
  }

  .filter-btn.is-active {
    /*background: var(--c-accent, #fff);*/
    /*border-color: var(--c-accent, #222);*/
    background: var(--primary-font-color);
    border-color: var(--primary-font-color);
    color: var(--bg-color);
  }

  .count-badge {
    margin-left: auto;
    font-size: .9rem;
    opacity: .8;
  }

  #course-list {
    display: grid;
    gap: .75rem;
  }

  .course-item.is-hidden {
    display: none !important;
  }

  /* <details> presentación */
  details.course {
    border: 1px dotted var(--primary-font-color);
    border-radius: .75rem;
    padding: .5rem .75rem;
    font-weight: normal;
  }
  
  details.course.highlight {
    border: 2px solid var(--primary-font-color);
    /*border-radius: .75rem;*/
    /*padding: .5rem .75rem;*/
    background: var(--bg-color);
    color: var(--primary-font-color);
  }

  details.course:hover {
    border: 1px solid var(--primary-font-color);
    border-radius: .75rem;
    padding: .5rem .75rem;
  }

  details.highlight:hover {
    border: 2px solid var(--primary-font-color);
    background: var(--bg-color);
    color: var(--primary-font-color);
  }

  details.course > summary {
    list-style: none;
    cursor: pointer;
    font-weight: 600;
  }
  details.course > summary::-webkit-details-marker { display: none; }

  .course-title { font-weight: 700; }
  .organizer { font-weight: normal; font-style: italic; opacity: .85; }
  .details { margin: .5rem 0 0 0; }
  .details li { margin: .25rem 0; }

  /* Accesibilidad */
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,1px,1px); white-space: nowrap; border: 0;
  }


</style>

<!-- ====== LÓGICA DE FILTRADO ====== -->
<script>
(function () {
  const list = document.getElementById('course-list');
  const buttons = Array.from(document.querySelectorAll('#course-filter .filter-btn'));
  const items = Array.from(list.querySelectorAll('.course-item'));
  const countEl = document.getElementById('course-count');

  // Lee ?type=master|degree|phd|other|highlight|all
  const params = new URLSearchParams(location.search);
  const initial = (params.get('type') || 'all').toLowerCase();

  function applyFilter(filter) {
    // Activar botón
    buttons.forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Mostrar/Ocultar
    let visible = 0;
    items.forEach(el => {
      const type = (el.dataset.type || '').toLowerCase();
      const isHighlight = el.dataset.highlight === 'true';

      let show = false;
      if (filter === 'all') show = true;
      else if (filter === 'highlight') show = isHighlight;
      else show = (type === filter);

      el.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });

    // Contador
    countEl.textContent = `${visible} curso${visible === 1 ? '' : 's'}`;

    // Sincroniza la URL sin recargar
    const url = new URL(location.href);
    if (filter === 'all') {
      url.searchParams.delete('type');
    } else {
      url.searchParams.set('type', filter);
    }
    history.replaceState({}, '', url);
  }

  // Eventos
  buttons.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // Filtro inicial (desde URL o por defecto "all")
  const known = new Set(['all','master','degree','phd','other','highlight']);
  applyFilter(known.has(initial) ? initial : 'all');
})();
</script>
