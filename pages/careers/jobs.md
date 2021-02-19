---
layout: page
title: RSE Opportunities
permalink: /jobs/
---

## Current RSE openings

<ol>{% for job in site.data.jobs %}
{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}
{% capture expires %}{{ job.expires | date: '%s'}}{% endcapture %}

{% if expires > nowunix %}
   <li><a href="{{ job.url }}" target="_blank">{{ job.name }}</a>: {{ job.location }}</li>
{% endif %}{% endfor %}</ol>

<br>

### Have an RSE-related job posting?  
Contact us via [slack](https://usrse.slack.com) or directly make a pull request in the website's [GitHub repository](https://github.com/USRSE/usrse.github.io).
