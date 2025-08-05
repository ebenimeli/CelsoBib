---
title: "Diputados, currículums y datos abiertos"
date: 2025-07-24T08:00:00+00:00
author: Enrique Benimeli
layout: post
permalink: /cv-diputados/
categories: Actualidad
tags: [política,formación,cv]
---

[![image](assets/images/posts/2024/01/post.jpg)]()

Esta semana, la formación de nuestros diputados es [tema de conversación](https://www.ondacero.es/noticias/espana/que-titulacion-necesaria-ser-diputado-congreso_2025072368809008ffbf4a1a6740f497.html).

En la web del Congreso de los Diputados está [disponible en formato CSV, JSON y XML](https://www.congreso.es/es/opendata/diputados) toda la **información sobre los diputados**. Formación (o no formación) académica incluida. Los datos son abiertos, pero la información, al parecer, la registran los propios diputados.

Estos formatos abiertos permiten procesar y analizar la información fácilmente y ChatGPT hace maravillas. Por ejemplo, cada ficha de diputado se muestra en XML con este formato. Pongamos como ejemplo la ficha del presidente del gobierno, [cuyos títulos también han sido cuestionados](https://www.elmundo.es/espana/2018/09/18/5ba001cd46163ffb8b8b45bd.html).

{% highlight xml %}<result>
        <NOMBRE>Sánchez Pérez-Castejón, Pedro</NOMBRE>
        <CIRCUNSCRIPCION>Madrid</CIRCUNSCRIPCION>
        <FORMACIONELECTORAL>PSOE</FORMACIONELECTORAL>
        <FECHACONDICIONPLENA>17/08/2023</FECHACONDICIONPLENA>
        <FECHAALTA>09/08/2023</FECHAALTA>
        <GRUPOPARLAMENTARIO>Grupo Parlamentario Socialista</GRUPOPARLAMENTARIO>
        <FECHAALTAENGRUPOPARLAMENTARIO>28/08/2023</FECHAALTAENGRUPOPARLAMENTARIO>
        <FECHABAJAENGRUPOPARLAMENTARIO></FECHABAJAENGRUPOPARLAMENTARIO>
        <BIOGRAFIA>Casado y padre 
Doctor en Economía por la Universidad Camilo José Cela.  Máster en Economía de la UE por la Universidad Libre de Bruselas.  Diplomado en Estudios Avanzados en Integración Económica y Monetaria Europea por el Instituto Universitario Ortega y Gasset.  Profesor de Economía en la Universidad Camilo José Cela.  Asesor en el Parlamento Europeo y miembro del Gabinete del Alto Representante de Naciones Unidas en Bosnia Herzegovina.  Presidente del Gobierno desde junio de 2018.  Concejal del Ayuntamiento de Madrid entre 2004 y 2009.  Afiliado al PSOE desde 1993.   Secretario General del PSOE entre 2014 y 2016 y desde 2017</BIOGRAFIA>
    </result>
    <result>
{% endhighlight %}

El diario El Mundo también preparó una [herramienta para consultar el currículum de los diputados](https://www.elmundo.es/elmundo/2023/graficos/ago/diputados_electos_23j/quienes-son-los-diputados-23J-2023-table/index.html) tras su elección. No sé si mantendrán actualizados los datos.

[![image](assets/images/posts/2025/07/cvdiputados-elmundo.png)](https://www.elmundo.es/elmundo/2023/graficos/ago/diputados_electos_23j/quienes-son-los-diputados-23J-2023-table/index.html)

Sospecho que el Congreso ni confirma ni contrasta lo que los diputados declaran. Preguntaba hoy [Borja Adsuara en X](https://x.com/adsuara/status/1948322103398187046) por qué no cruzan los datos, por ejemplo, con el Ministerio de Educación.

> ¿Y por qué no confirmar lo que dicen los Diputados y Senadores en sus declaraciones? Tanto las titulaciones como las propiedades y saldos. Se podría pedir/cruzar datos con la AEAT, Registros, Ministerio de Educación, Universidades, etc.? 🤔

Los datos están ahí. El Estado los tiene y si accedemos, por ejemplo, a [Mi Carpeta Ciudadana](https://carpetaciudadana.gob.es/) y entramos en la sección de *Educación y formación*, podemos descargar incluso un justificante de nuestros títulos académicos.

[![image](assets/images/posts/2025/07/carpeta_ciudadana.png)](https://carpetaciudadana.gob.es/)


**www.congreso.es** · [Datos abiertos de Diputados y Diputadas](https://www.congreso.es/es/opendata/diputados)
