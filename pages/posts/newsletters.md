---
layout: page
title: Newsletters
description: Newsletters
permalink: /newsletters/
menubar: news
---

{% include scrolltop.html %}
{% assign newsletters = site.posts | where: "category", "newsletter" %}
{% for post in newsletters %}{% assign currentDate = post.date | date: "%Y" %}{% if currentDate != myDate %}{% unless forloop.first %}</ul>{% endunless %}
<h1 style="margin-top:20px; margin-bottom:10px">{{ currentDate }}</h1>
  <ul>{% assign myDate = currentDate %}{% endif %}
   <li><a href="{{ site.baseurl }}{{ post.url }}"><span>{{ post.date | date: "%B %-d, %Y" }}</span> - {{ post.title }}</a></li>
   {% if forloop.last %}</ul>{% endif %}
{% endfor %}
