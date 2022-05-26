---
layout: page
title: ""
description: "Puedes ver mis fotografías en Instagram (@ebenimeli), pero aquí tienes una foto al azar"
---

{% assign min = 1 %}
{% assign max = 3 %}
{% assign diff = max | minus: min %}
{% assign randomNumber = "now" | date: "%N" | modulo: diff | plus: min %}

[
![image](images/misc/foto{{randomNumber}}.jpg)
](https://www.instagram.com/ebenimeli/)
