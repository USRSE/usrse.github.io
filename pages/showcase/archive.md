---
layout: page
title: Showcase Archive
description: Archive of showcase, by year
permalink: /showcase/archive/
---

<div class="row">
    <div class="col-md-12">
       <a style="float:right" type="button" class="btn btn-sm btn-warning" href="{{ site.baseurl }}/showcase/">Back to Showcase</a>
    </div>
</div>

{% include scrolltop.html %}

{% assign events = site.data.showcase | sort: "published" | reverse %}
<ul>
{% for event in events %}
<li><a href="{{ event.url }}"><em>{{ event.published }}</em> {{ event.title }}</a>: {% if event.description %}{{ event.description }}{% endif %} {% assign added = true %}</li>{% endfor %}
</ul>
<button class="btn btn-primary" style="float:right;">
  <a href="{{ site.baseurl }}/showcase/" style="color:white">Back to Showcase</a></button>
