---
layout: page
title: Events & Training
permalink: /events-training/
---

{% for event in site.data.events %}{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}{% capture expires %}{{ event.expires | date: '%s'}}{% endcapture %}{% if expires > nowunix %}
<h3><a target="_blank" href="{{ event.url }}" target="_blank">{{ event.name }}: <em>{{ event.location }}</em></a></h3>
{{ event.description }}
<br>
{% endif %}{% endfor %}

<button class="btn btn-primary">
<a style="color:white" href="{{ site.baseurl }}/events-archive/">Events Archive</a></button><br>

_Have an RSE-related event or training?  Have it posted here!  [Join](https://us-rse.org/join/)
the US-RSE slack channel and contact us!_ 



