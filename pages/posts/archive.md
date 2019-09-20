---
layout: page
title: Archive
description: A collection of posts, organized by year
permalink: /archive/
---

{% include scrolltop.html %}
<div class="row" style="margin:25px; padding:30px">
   {% for post in site.posts %}
       {% assign currentDate = post.date | date: "%Y" %}
       {% if currentDate != myDate %}
           {% unless forloop.first %}</ul>{% endunless %}
           <h1 style="margin-top:20px; margin-bottom:10px">{{ currentDate }}</h1>
           <ul>
           {% assign myDate = currentDate %}
       {% endif %}
       <li><a href="{{ site.baseurl }}{{ post.url }}"><span>{{ post.date | date: "%B %-d, %Y" }}</span> - {{ post.title }}</a></li>
       {% if forloop.last %}</ul>{% endif %}
   {% endfor %}
</div>
