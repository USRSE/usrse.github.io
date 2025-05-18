---
layout: post
title: US-RSE [Month Year] Newsletter
subtitle: [Month Year]
category: newsletter
tags: [newsletter, [Month]]
date: YYYY-MM-DD 00:00:00 -0400
---

<a name="top"></a>

### 💜 This Month: [Headline Theme] 💜

In this monthly newsletter, we share recent, current, and planned activities of the US-RSE Association, and related news that we think is of interest to US-RSE members. Newsletters are also available on our [website](https://us-rse.org/newsletters/). To receive our newsletter, [join US-RSE](https://us-rse.org/join/).

In this issue:
* [1. USRSE'25 Conference](#conference2025)
* [2. [HEADLINE THEME](#headline)
* [3. Steering Committee Updates](#sc-update)
* [4. Organizational Founding Membership](#orgmember)
* [5. Community and Travel Funds](#community-funds)
* [6. Community News](#news)
* [7. Interesting Events and Opportunities](#events)
* [8. Featured Reads, Videos, or Podcasts](#reads)
* [9. Get Involved](#involved)
* [10. Recent Job Postings](#jobs)

-----------------

<a name="conference2025"></a>
# 🔔 **1. US-RSE Conference 2025 (USRSE'25)**

<!-- Update with current announcements -->

-----------------

<a name="headline"></a>
# 💟 **2. [HEADLINE]**

<!-- Add monthly theme / highlight -->

-----------------

<a name="sc-update"></a>
# 🛞 **3. Steering Committee Updates**

<!-- Fill in with current Steering Committee news -->

-----------------

<a name="orgmember"></a>
# 🤝 **4. Organizational Founding Membership**

Organizations that join on or before **November 30, 2025** will be recognized in perpetuity as founding members. Current fee lock through **December 31, 2028**.

Please reach out to Sandra Gesing at [sandra@us-rse.org](mailto:sandra@us-rse.org) if you are interested in becoming a member.

### Premier Members
{% for org in site.data.org-members.premier %}
- [{{ org.name }}]({{ org.url }})
{% endfor %}

### Standard Members
{% for org in site.data.org-members.standard %}
- [{{ org.name }}]({{ org.url }})
{% endfor %}

### Basic Members
{% for org in site.data.org-members.basic %}
- [{{ org.name }}]({{ org.url }})
{% endfor %}

-----------------

<a name="community-funds"></a>
# ✈️ **5. Community and Travel Funds Program**

{% assign current_month = 'now' | date: '%m' | plus: 0 %}
{% assign current_year = 'now' | date: '%Y' %}

{% if current_month <= 3 %}
  {% assign next_deadline = current_year | append: "-03-31" %}
{% elsif current_month <= 6 %}
  {% assign next_deadline = current_year | append: "-06-30" %}
{% elsif current_month <= 9 %}
  {% assign next_deadline = current_year | append: "-09-30" %}
{% else %}
  {% assign next_deadline = current_year | append: "-12-31" %}
{% endif %}

<div class="alert alert-primary" role="alert">
  <strong>Next Application Deadline:</strong> {{ next_deadline | date: "%B %-d, %Y" }}
</div>

You can apply at [us-rse.org/funds-and-awards](https://us-rse.org/funds-and-awards/)

-----------------

<a name="news"></a>
# 🗞️ **6. Community News**

### **Community Calls**
<!-- Add Upcoming and Previous calls here -->

-----------------

<a name="events"></a>
# 👀 **7. Interesting Events and Opportunities**

<!-- Include opportunity-box and event-box includes -->

-----------------

<a name="reads"></a>
# 📚 **8. Featured Reads, Videos, and Podcasts**

<!-- Add new articles and podcast links -->

-----------------

<a name="involved"></a>
# 🏃 **9. Get Involved**

US-RSE Working Groups:
{% assign wgs = site.data.menus["working-groups"][0].items %}
<ul>
{% for wg in wgs %}
  <li><a href="{{ site.baseurl }}/{{ wg.link }}">{{ wg.name }}</a></li>
{% endfor %}
</ul>

-----------------

<a name="jobs"></a>
# 🧑‍💼 **10. Recent Job Postings**

{% assign today = 'now' | date: "%Y-%m-%d" %}
<ul>
{% for job in site.data.jobs %}
  {% if job.expires | date: "%Y-%m-%d" >= today %}
    <li>
      <strong><a href="{{ job.url }}" target="_blank" rel="noopener">{{ job.name }}</a></strong><br>
      📍 {{ job.location }}<br>
      🗓️ Posted: {{ job.posted }} | Expires: {{ job.expires }}
    </li>
  {% endif %}
{% endfor %}
</ul>

### Other Job Boards

<ul>
{% for board in site.data.job-boards.boards %}
  <li><a href="{{ board.url }}" target="_blank">{{ board.name }}</a></li>
{% endfor %}
</ul>

-----------------

**This newsletter is a joint effort of members of the US-RSE Association.**

© US-RSE • 2021–{{ 'now' | date: "%Y" }} • US-RSE is a fiscally sponsored project of [Community Initiatives](http://communityin.org/)

[Email](mailto:contact@us-rse.org) [Mastodon](https://fosstodon.org/@us_rse) [Twitter](https://twitter.com/us_rse) [YouTube](https://youtube.com/@us_rse) [LinkedIn](https://linkedin.com/company/us-rse/) [GitHub](https://github.com/USRSE)
