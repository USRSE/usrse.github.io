---
layout: page
title: Statements from Leadership
description: Messages from the Steering Committee and Executive Director
permalink: /news/leadership/
menubar: news
---

{% include scrolltop.html %}
{% assign leadership = site.posts | where: "category", "leadership" %}
{% for post in leadership %}{% assign currentDate = post.date | date: "%Y" %}{% if currentDate != myDate %}{% unless forloop.first %}</ul>{% endunless %}
<h1 style="margin-top:20px; margin-bottom:10px">{{ currentDate }}</h1>
  <ul>{% assign myDate = currentDate %}{% endif %}
   <li><a href="{{ site.baseurl }}{{ post.url }}"><span>{{ post.date | date: "%B %-d, %Y" }}</span> - {{ post.title }}</a></li>
   {% if forloop.last %}</ul>{% endif %}
{% endfor %}
