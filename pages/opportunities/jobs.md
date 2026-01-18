---
layout: page
title: RSE Opportunities
permalink: /jobs/
---

{% assign us-rse_jobs = site.data.us-rse-jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="## Current US-RSE Association Openings" sorted_jobs=us-rse_jobs %}

{% assign org-member_jobs = site.data.org-member-jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="## Organizational Member Openings" sorted_jobs=org-member_jobs %}

{% assign rse_jobs = site.data.jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="## Current RSE Openings" sorted_jobs=rse_jobs %}

{% assign related_jobs = site.data.related-jobs | sort: "posted" | reverse %}
{% include joblist.html section_heading="### Related Openings" sorted_jobs=related_jobs %}

{% assign internships = site.data.internships | sort: "posted" | reverse %}
{% include joblist.html section_heading="### Internships" sorted_jobs=internships %}

{% assign freelance = site.data.freelance | sort: "posted" | reverse %}
{% include joblist.html section_heading="### Freelance Opportunities" sorted_jobs=freelance %}

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
