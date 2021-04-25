---
title: Event buttons
permalink: /programme/calendar-buttons/
sidebar:
  nav:  programme
fullcalendar: true
---

{% assign events = '' | split: '' %}
{% for post in site.events %}
    {% if post.time %}
        {% assign events = events | push: post %}
    {% endif %}
{% endfor %}
{% assign events = events | sort: "last_modified_at" | reverse %}

{% for post in events %}
{%- assign event_id = post.id | split: '/' | last %}
## {{ event_id }}: {{ post.title }}
<div>
{% for occurrence in post.time %}
{% for time in occurrence %}
{% include events/event-time.html %}

{% endfor %}
{% endfor %}
{{ post.last_modified_at }}
</div>
{% endfor %}
