---
layout: page
title: Newsletters
description: Newsletters
permalink: /newsletters/
---

{% include scrolltop.html %}

<ul>
{% for post in site.posts %}
{% if post.category == "newsletter" %}

   <li><a href="{{ site.baseurl }}{{ post.url }}"><span>{{ post.date | date: "%B %-d, %Y" }}</span> - {{ post.title }}</a></li>

{% endif %}
{% endfor %}
</ul>
