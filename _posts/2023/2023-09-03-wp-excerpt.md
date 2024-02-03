---
title: "Entradillas en el blog: WP excerpt"
date: 2023-09-03T05:00:00+00:00
author: Enrique Benimeli
layout: post
permalink: /entradillas-8am/
categories: Programación
tags: [informática,WordPress,programación,8am]
---

[![image](assets/images/posts/2023/08/wp_post_excerpt.png)](https://www.ochoenpunto.com/herramientas-metodos-y-enfoque/)

Los detalles marcan la diferencia. Me gusta la idea de que los artículos de *Ocho en punto* tengan una especie de encabezamiento, como las **entradillas** de los artículos en los periódicos y que actúan como un resumen.

En WordPress se puede utilizar la función <code>the_excerpt()</code> o <code>get_the_excerpt()</code> para obtener el extracto (*excerpt*) del *post*. Este **extracto** es un campo especial que quien escribe puede rellenar cuando redacta el artículo. No me extrañaría, sin embargo, que alguien haya integrado ya alguna IA para hacer el resumen automáticamente.

El problema es que, cuando se utilizan estas funciones, se obtiene también un enlace <code>a</code> en HTML del tipo *Read more*. En este caso, no necesitamos un enlace *leer más* porque ya estamos en el propio artículo. Con un filtro y personalizando alguna función se puede lograr que no aparezca este añadido. Una solución relativamente es utilizar una **expresión regular** para identificar enlaces HTML de tipo:

{% highlight html %}
<a href="">...</a>
{% endhighlight %}

para posteriormente eliminarlos. No es probablemente la solución más elegante, pero funciona. Y si WordPress integra algún sistema de caché para las páginas, apenas debería suponer una carga. De todos modos, tarde o temprano, convendría aplicar alguna solución más adecuada.

Con PHP la cosa se soluciona así:

{% highlight php %}
<?php 
    $summary = get_the_excerpt();
    $pattern = '/<a\b[^>]*>.*?<\/a>/i';
    $cleanSummary = preg_replace($pattern, '$1', $summary);
    echo '<p class="summary">'.$cleanSummary.'</p>';
?>
{% endhighlight %}

Y la hoja de estilo CSS podemos personalizar el formato de la entradilla:

{% highlight css %}
p.summary {
    font-size: 1.2em;
    font-weight: normal;
    font-style: normal;
    color: DarkSlateGray;
}
{% endhighlight %}

De esta forma, el código HTML que teníamos **antes**:

{% highlight html %}
<div class="more-link-wrapper"><a class="more-link" href="https://www.ochoenpunto.com/herramientas-metodos-y-enfoque/">Seguir leyendo<span class="screen-reader-text">Herramientas, métodos y enfoque</span> <i class="fas fa-angle-right"></i></a></div>
{% endhighlight %}

Aparece así **después**:

{% highlight html %}
<div class="more-link-wrapper"></div>
{% endhighlight %}

Ahora queda revisar los más de 150 artículos y sus entradillas porque, como en este *post* que comparto, será necesario reducirlo en extensión y hacer un buen resumen.

**Ocho en punto** · [*Herramientas, métodos y enfoque*](https://www.ochoenpunto.com/herramientas-metodos-y-enfoque/)