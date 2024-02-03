---
title: "Letra capital con CSS (y en WordPress)"
date: 2023-04-30T00:08:00+00:00
author: Enrique Benimeli
layout: post
permalink: /letracapitalcss/
categories: Informática
tags: [programación,css,WordPress,blog,8am]
---

Lo que me gusta a mí una [**letra capital**](https://es.wikipedia.org/wiki/Letra_capital). Las he vuelto a utilizar en el [blog de *Ocho en punto*](https://www.ochoenpunto.com/cajon-de-sastre-16-ideas-mejorar-productividad/).

[![image](assets/images/posts/2023/04/letra_capital_8am.png)](https://www.ochoenpunto.com/cajon-de-sastre-16-ideas-mejorar-productividad/)

El siguiente código CSS funciona aunque no se utilice WordPress, pero el caso particular que comparto explica cómo mostrar una letra capital (o capitular) personalizando el tema activo de WordPress (*Apariencia > Temas > Personalizar)* y añadiendo el siguiente código en el apartado *CSS adicional*.

Con este código hacemos capital la primera letra del primer párrafo del *post*:

{% highlight css %}
 div.post-content p:first-child:first-letter {
	float: left;
	font-size: 6em;
	font-weight: 900;
	color: #000000;
	margin-right: 0.10em;
	line-height: 90%;
	text-shadow: 0.05em 0.05em #c1c1c1c1;
	font-family: Times New Roman;
}
{% endhighlight %}

Con el siguiente código, hacemos capital la primera letra del **segundo párrafo** del *post*. Este es el código que aplico en mis artículos del [blog *Ocho en punto*](https://www.ochoenpunto.com/tercer-alto-camino-150-articulos-organizacion-personal/) porque el primer párrafo está reservado para el tiempo estimado de lectura.

Por cierto, **nth-child** es una pseudoclase de CSS que permite seleccionar varios elementos hijos de la clase indicando su posición.

{% highlight css %}
 div.post-content p:nth-child(2):first-letter {
    float: left;
    font-size: 6em;
    font-weight: 900;
    color: #000000;
    margin-right: 0.10em;
    line-height: 90%;
    text-shadow: 0.05em 0.05em #c1c1c1c1;
    font-family: Times New Roman;
 }
{% endhighlight %}

**Ocho en punto** \| [www.ochoenpunto.com](https://www.ochoenpunto.com)