---
layout: page
title: ""
description: "Ingeniería Informática"
---

## Ingeniería en Informática

  {% for curso in site.data.inginf %}
<details class="course">
  <summary>
  <span class="course-title">{{ curso.name }}</span>. <span class="organizer">{{ curso.organizer }}</span>. {% if curso.credits %} {{ curso.credits }} ECTS {% endif %} / {% if curso.hours %} {{ curso.hours }} horas {% endif %} [+ info]
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
  {% endfor %}


## Lista completa

<!--
* Plan de estudios: [Ingeniería en Informática - plan 1993](http://cv1.cpd.ua.es/consplanesestudio/cvAsignaturas.asp?wCodEst=35&scaca=2003-04)
* Fecha de publicación en BOE: [12 de Febrero de 1993](https://www.boe.es/buscar/doc.php?id=BOE-A-1993-28067)
  
## Asignaturas cursadas
-->

* Álgebra y Teoría de Matrices
* Análisis Matemático
* Fundamentos de los Computadores
* Estadística I
* Matemática Discreta
* Fundamentos Tecn. de los Computadores
* Lógica de Primer Orden
* Fundamentos de la Programación
* Fundamentos Físicos de la Informática
* Lengua Alemana I
* Fundamentos de las Bases de Datos
* Modelos Abstractos del Cálculo
* Diseño y Gestión de Base de Datos
* Bases de Datos Avanzadas
* Tecnol. y Control de Robots y Sist. Sens
* Fundamentos de los Sist. Operativos
* Estructura de Computadores I
* Tipos Abstractos de Datos
* Programación Metódica
* Análisis y Espec. de Sis. de Información
* Ingeniería del Software I
* Sistemas de Transporte de Datos
* Desarrollo y Gestión de los Sistema de Información en la Empresa
* Historia de la Informática y Metodología Científica
* Introducción Inglés Científico-Técnico
* Inglés para Informática I
* Lenguajes, Gramáticas y Autómatas
* Redes de Computadores
* Compiladores I
* Sistemas de Información de la Empresa
* Arquitectura de Computadores
* Fundamentos de Inteligencia Artificial
* Ingeniería del Software II
* Técnicas de Inteligencia Artificial
* Razonamiento Geométrico
* Robótica
* Sistemas Conexionistas
* Esquemas Algorítmicos
* Compiladores II
* Sistemas de Información Semiestructurada
* Tecnologías Web
* Administración de Sistemas Operativos
* Programación Orientada a Objetos
* Sistemas Tolerantes a Fallos
* Implantación de las Tecnologías de la Información
* Inglés para Informática II
* Diseño de Sistemas Operativos
* Arquitectura Avanzada de Computadores I
* Prácticas en Empresas (18 ECTS)
* Sistemas Informáticos
* Java para Dispositivos Móviles (J2ME)
* Modular Inicial: Alemán
* Programación en .NET
* Programación Avanzada en Java
