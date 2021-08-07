---
layout: page
title: RSE Opportunities
permalink: /jobs/
---

## Current RSE openings

{% assign sorted_jobs = site.data.jobs | sort: "posted" | reverse %}
<ol>{% for job in sorted_jobs %}
{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}
{% capture expires %}{{ job.expires | date: '%s'}}{% endcapture %}
{% capture posted %}{{ job.posted | date: '%b %d, %Y'}}{% endcapture %}

{% if expires > nowunix %}
  {% if posted != '' %}
    <li><a href="{{ job.url }}" target="_blank">{{ job.name }}</a>: {{ job.location }}&emsp;<em>Posted:&nbsp;{{ posted }}</em></li>
  {% else %}
    <li><a href="{{ job.url }}" target="_blank">{{ job.name }}</a>: {{ job.location }}</li>
  {% endif %}
{% endif %}{% endfor %}</ol>

<br>

### Have an RSE-related job posting?  
Please read our [job posting policy]({{ site.baseurl }}/jobs/policy/) first, then fill out this [google form](https://docs.google.com/forms/d/e/1FAIpQLSfYK64R1c0rj-ERldGLxuqedLIbsYPZXj9uBplDRYNmnND10Q/viewform?usp=sf_link) to request additions to the job board.
