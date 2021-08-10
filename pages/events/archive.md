---
layout: page
title: Events Archive
description: Archive of events, organized by year
permalink: /events/archive/
---

<div class="row">
    <div class="col-md-12">
       <a style="float:right" type="button" class="btn btn-sm btn-warning" href="{{ site.baseurl }}/events/">Back to Events</a>
    </div>
</div>

{% include scrolltop.html %}
{% assign events = site.events | sort: "expires" | reverse %}
{% for event in events %}{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}{% capture expires %}{{ event.expires | date: '%s'}}{% endcapture %}{% if expires < nowunix %}{% assign yearDate = event.expires | date: "%Y" %}
{% if yearDate != myDate %}{% if added %}</ul>{% endif %}
<h1 style="margin-top:20px; margin-bottom:10px">{{ yearDate }}</h1>
<ul>{% assign myDate = yearDate %}{% endif %}
   <li><a href="{{ site.baseurl }}{{ event.url }}">{{ event.title }}</a>: {{ event.event_date }}{% if event.location %},{% endif %} {% assign added = true %} <em>{{ event.location }}</em></li>
 {% if forloop.last %}</ul>{% endif %}{% endif %}{% endfor %}

<button class="btn btn-primary" style="float:right;">
  <a href="{{ site.baseurl }}/events/" style="color:white">Back to Events</a></button>
