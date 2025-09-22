---
layout: page
title: "Formación, cursos, charlas"
description: "Cursos de grado, máster, doctorado y otros"
# Mapa clave→etiqueta visible (añade las que necesites)
field_labels:
  education: "Educación"
  ict: "Informática"
  languages: "Lenguas"
  science: "Ciencia"
---

<h2 id="courses-title">Cursos de formación</h2>

<!-- ====== FILTRO SUPERIOR ====== -->
<div id="course-filter" role="toolbar" aria-label="Filtrar cursos por tipo">
  <!-- Puedes renombrar las etiquetas visibles sin tocar data-filter -->
  <button type="button" class="filter-btn" data-filter="highlight" aria-pressed="false" title="Solo destacados">
    <i class="fa-regular fa-star"></i>
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
  <br/>

  <!-- ====== CHECKBOXES (fields) ====== -->
  <fieldset id="field-filters" aria-label="Filtrar por campos (AND)">
    <legend class="sr-only">Campos del curso</legend>

    {% assign cursos = site.data.courses %}
    {% assign buf = "" %}
    {% for c in cursos %}
    {% assign vis = curso.visibility | default: '' %}
      {% if vis != 'private' %}
        {%- assign normalized = c.fields
          | downcase
          | replace: '，', ','
          | replace: '、', ','
          | replace: '；', ','
          | replace: ';', ','
          | replace: ' ', '' -%}
        {% assign parts = normalized | split: ',' %}
        {% for p in parts %}
          {% assign token = p | strip %}
          {% if token != "" %}
            {% assign buf = buf | append: token | append: '|' %}
          {% endif %}
        {% endfor %}
      {% endif %}
    {% endfor %}

    {% assign all_fields = buf | split: '|' | uniq | sort %}

    {%- comment -%}
      Mapa de etiquetas visibles: usa primero page.field_labels (front-matter),
      si no existe, intenta site.data.field_labels; y, como fallback, capitaliza la clave.
    {%- endcomment -%}
    {% assign labels_map = page.field_labels %}
    {% if labels_map == nil or labels_map == empty %}
      {% assign labels_map = site.data.field_labels %}
    {% endif %}

    {% for f in all_fields %}
      {% if f and f != "" %}
        {% assign nice = f %}
        {% if labels_map and labels_map[f] %}
          {% assign nice = labels_map[f] %}
        {% else %}
          {% assign nice = f | replace:'-', ' ' | capitalize %}
        {% endif %}
        <label class="chk">
          <input type="checkbox" name="field-filter" value="{{ f }}" data-label="{{ nice }}" />
          <span>{{ nice }}</span>
        </label>
      {% endif %}
    {% endfor %}

  </fieldset>

<span id="course-count" aria-live="polite" class="count-badge" title="Resultados visibles"></span>

</div>

<!-- ====== LISTA DE CURSOS ====== -->
<div id="course-list">
{% assign cursos = site.data.courses %}
{% for curso in cursos %}
  {% if curso.visibility == nil or curso.visibility != 'private' %}
    {% assign type_slug = curso.type | downcase | strip | replace: ' ', '-' %}

    {% assign fields_slug = "" %}
    {% if curso.fields %}
      {% assign fields_slug = curso.fields
        | downcase
        | replace: '，', ','
        | replace: '、', ','
        | replace: '；', ','
        | replace: ';', ','
        | replace: ' ', ''
        | strip %}
    {% endif %}

    <div
      class="course-item {{ type_slug }}"
      data-type="{{ type_slug }}"
      data-fields="{{ fields_slug }}"
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
            <a href="{{ curso.url }}" target="_blank" rel="noopener">{{ curso.url | truncate: 25 }}</a>
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
    background: var(--primary-font-color);
    border-color: var(--primary-font-color);
    color: var(--bg-color);
  }

  .count-badge {
    margin-left: auto;
    font-size: .9rem;
    opacity: .8;
  }

  #field-filters {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem .75rem;
    align-items: center;
  }
  #field-filters .chk {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    border: 1px dotted var(--c-border, #e2e2e2);
    padding: .25rem .5rem;
    border-radius: .5rem;
    user-select: none;
  }
  #field-filters input[type="checkbox"] {
    accent-color: currentColor;
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

  .fa-star { color: SteelBlue; }
</style>

<!-- ====== LÓGICA DE FILTRADO ====== -->
<script>
(function () {
  const list = document.getElementById('course-list');
  const buttons = Array.from(document.querySelectorAll('#course-filter .filter-btn'));
  const items = Array.from(list.querySelectorAll('.course-item'));
  const countEl = document.getElementById('course-count');
  const chkContainer = document.getElementById('field-filters');
  const chkInputs = () => Array.from(chkContainer.querySelectorAll('input[name="field-filter"]'));

  // Lee ?type=... y ?fields=a,b,c
  const params = new URLSearchParams(location.search);
  const initialType = (params.get('type') || 'all').toLowerCase();
  const initialFields = (params.get('fields') || '')
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Marcar checkboxes desde URL (usa value=clave interna)
  if (initialFields.length) {
    chkInputs().forEach(chk => {
      chk.checked = initialFields.includes(chk.value);
    });
  }

  let currentType = 'all';

  function getSelectedFields() {
    return chkInputs()
      .filter(chk => chk.checked)
      .map(chk => chk.value); // clave interna (education, ict, ...)
  }

  function applyFilters(typeFilter) {
    if (typeFilter) currentType = typeFilter;

    // Activar botón de tipo
    buttons.forEach(btn => {
      const active = btn.dataset.filter === currentType;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const selectedFields = getSelectedFields();
    let visible = 0;

    items.forEach(el => {
      const type = (el.dataset.type || '').toLowerCase();
      const isHighlight = el.dataset.highlight === 'true';

      // 1) filtro por tipo / highlight / all
      let show = false;
      if (currentType === 'all') show = true;
      else if (currentType === 'highlight') show = isHighlight;
      else show = (type === currentType);

      // 2) filtro por fields (AND)
      if (show && selectedFields.length) {
        const fieldsAttr = (el.dataset.fields || '').toLowerCase();
        const normalized = fieldsAttr
          .replaceAll('，', ',')
          .replaceAll('、', ',')
          .replaceAll('；', ',')
          .replaceAll(';', ',');
        const fieldSet = new Set(
          normalized.split(',').map(s => s.trim()).filter(Boolean)
        );
        show = selectedFields.every(f => fieldSet.has(f));
      }

      el.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });

    // Contador
    countEl.textContent = `${visible} curso${visible === 1 ? '' : 's'}`;

    // Sincroniza la URL sin recargar (claves internas)
    const url = new URL(location.href);
    if (currentType === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', currentType);

    const sel = getSelectedFields();
    if (sel.length) url.searchParams.set('fields', sel.join(','));
    else url.searchParams.delete('fields');

    history.replaceState({}, '', url);
  }

  // Eventos
  buttons.forEach(btn => {
    btn.addEventListener('click', () => applyFilters(btn.dataset.filter));
  });
  chkContainer.addEventListener('change', () => applyFilters()); // mantiene currentType

  // Filtro inicial (desde URL o por defecto "all")
  const known = new Set(['all','master','degree','phd','talk','course','highlight']);
  applyFilters(known.has(initialType) ? initialType : 'all');
})();
</script>
