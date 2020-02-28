---
layout: page
title: Events & Training
permalink: /events-training/
---

{% for event in site.events %}{% if event.repeated == true %}
<h3><a target="_blank" href="{{ site.url }}{{ event.url }}" target="_blank">{{ event.title }}: <em>{{ event.location }}</em></a>:</h3>
<div style="margin:0px; padding:0px;"><em>{{ event.event_date }}</em></div>
{{ event.content }}
<br>
{% endif %}{% endfor %}

{% assign sorted = (site.events | sort: 'expires') %}
{% for event in sorted %}{% if event.repeated == false %}{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}{% capture expires %}{{ event.expires | date: '%s'}}{% endcapture %}{% if expires > nowunix %}
<h3><a target="_blank" href="{{ site.url }}{{ event.url }}" target="_blank">{{ event.title }}: <em>{{ event.location }}</em></a>:</h3>
<div style="margin:0px; padding:0px;"><em>{{ event.event_date }}</em></div>
{{ event.content }}
<br>
{% endif %}{% endif %}{% endfor %}

<button class="btn btn-primary">
<a style="color:white" href="{{ site.baseurl }}/events-archive/">Events Archive</a></button><br>

_Have an RSE-related event or training?  Have it posted here!  [Join](https://us-rse.org/join/)
the US-RSE slack channel and contact us!_ 



