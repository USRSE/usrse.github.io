---
layout: page
title: RSE Opportunities
permalink: /jobs/
---

{% assign rse_jobs = site.data.jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="## Current RSE openings" sorted_jobs=rse_jobs %}

{% assign related_jobs = site.data.related-jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="### Related Openings" sorted_jobs=related_jobs %}

{% assign board_size = site.data.job-boards.boards | size %}
{% if board_size > 0 %}

### Other Job Boards

The following boards might also be of interest.

<ol>{% for board in site.data.job-boards.boards %}
    <li><a href="{{ board.url }}" target="_blank">{{ board.name }}</a></li>
    {% endfor %}</ol>
<br>
{% endif %}


### Have an RSE-related job posting?
Please read our [job posting policy]({{ site.baseurl }}/jobs/policy/) first, then fill out this [Google form](https://docs.google.com/forms/d/e/1FAIpQLSfYK64R1c0rj-ERldGLxuqedLIbsYPZXj9uBplDRYNmnND10Q/viewform?usp=sf_link) to request additions to the job board.
