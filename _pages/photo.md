---
layout: page
title: ""
description: "Puedes ver mis fotografías en Instagram (@ebenimeli), pero aquí tienes una foto al azar"
---

{% capture time_seed %}{{ 'now' | date: "%s" }}{% endcapture %}
{% assign random = time_seed | times: 1103515245 | plus: 12345 | divided_by: 65536 | modulo: 32768 | modulo: 4 %}

[
![image](images/misc/foto{{random}}.jpg)
](https://www.instagram.com/ebenimeli/)
