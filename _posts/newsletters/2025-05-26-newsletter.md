---
layout: post
title: US-RSE [Month Year] Newsletter
subtitle: [Month Year]
category: newsletter
tags: [newsletter, [Month]]
date: YYYY-MM-DD 00:00:00 -0400
---

<a name="top"></a>

### 💜 This Month: Meetups! 💜

In this monthly newsletter, we share recent, current, and planned activities of the US-RSE Association, and related news that we think is of interest to US-RSE members. Newsletters are also available on our [website](https://us-rse.org/newsletters/). To receive our newsletter, [join US-RSE](https://us-rse.org/join/).

This month, we want to highlight the importance of meetups in our community. 

[TODO: pics from meetups we can gather]

Meetups are a great way to connect with fellow Research Software Engineers, share knowledge, and build relationships. Whether you're interested in discussing best practices, collaborating on projects, or simply networking, meetups provide a valuable platform for engagement. Read on to hear about how our members are using meetups to connect with each other and the community at large.

In this issue:
* [1. USRSE'25 Conference](#conference2025)
* [2. [HEADLINE THEME]](#headline)
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

<p align="center">
  <img src="https://us-rse.org/usrse25/assets/img/banner.png" alt="USRSE25 Banner" style="width: 1000px; height: auto;">
</p>

Are you making plans to join us in 🦅 **Philadelphia, Pennsylvania 🦅 October 6-8, 2025**? The theme for the third annual conference from the United States Research Software Engineer Association ([US-RSE](https://us-rse.org/)) is **“Code, Practices, and People.”** 

The conference organizers are pleased to share that we received many high quality submissions to the upcoming conference. Thank you to all who submitted your work! Reviews are underway and notifications should be sent by July 14. Registration will open in June.

**While the submission deadline for most formats has passed, we continue to invite poster submissions for [USRSE'25](https://us-rse.org/usrse25/participate/)**.  Poster submissions will be accepted through July 20, 2025\. 

Whether you’re a research software engineer, data scientist, digital humanist, scientific programmer, software developer, or research software user, US-RSE is where people at the intersection of code and research come together. The USRSE'25 conference is your chance to connect with peers, mentors, and experts in the fast-growing world of research software. Don’t just take our word for it—100% of last year's post-conference survey respondents said they would return and recommend the conference to others.

Visit the [conference website](https://us-rse.org/usrse25/participate/) for further details including:

- Venue, hotel, and travel [details](https://us-rse.org/usrse25/attend/) 
- Posters: how and where to submit (still have questions? contact [usrse2025@easychair.org](mailto:usrse2025@easychair.org))  
- Dates for notification of acceptance and other important dates  


-----------------

<a name="headline"></a>
# 👯 **2. How Meetups Help Us Connect**

Meetups are a vital part of any community, and US-RSE is no exception. They provide a space for our members to connect, share ideas, and collaborate on projects. This month, we want to highlight some of the recent meetups that have taken place in our community.

<!-- Add monthly theme / highlight -->

-----------------

<a name="sc-update"></a>
# 🛞 **3. Steering Committee Updates**

<!-- Fill in with current Steering Committee news -->

-----------------

<a name="orgmember"></a>
# 🤝 **4. Organizational Founding Membership**

US-RSE envisions a future where Research Software Engineers are universally respected for advancing science, technology, and society through the transformative power of research software engineering.
We’re excited to share that the momentum around our Organizational Founding Membership continues to grow! See the list below for the current members (six more are onboarding at the moment).

Organizations that join on or before November 30, 2025, will be recognized in perpetuity as founding members. Founding organizations will also lock in current membership fees through December 31, 2028.
Organizational support helps sustain and expand vital community offerings, including the annual conference, monthly calls and newsletter, job board, working groups, and new resources.

Please reach out to Sandra Gesing at [sandra@us-rse.org](mailto:sandra@us-rse.org) if you are interested in becoming an organizational founding member!

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
# ✈️ **4. Community and Travel Funds program**

{% assign current_month = 'now' | date: '%m' | plus: 0 %}
{% assign current_year = 'now' | date: '%Y' %}

{% if current_month <= 3 %}
  {% assign next_deadline = current_year | append: "-03-31" %}
{% elsif current_month <= 6 %}
  {% assign next_deadline = current_year | append: "-06-30" %}
{% elsif current_month <= 9 %}
  {% assign next_deadline = current_year | append: "-09-30" %}
{% elsif current_month <= 12 %}
  {% assign next_deadline = current_year | append: "-12-31" %}
{% endif %}

<div class="alert alert-primary" role="alert">
  <strong>Next Application Deadline:</strong> {{ next_deadline | date: "%B %-d, %Y" }}
</div>

*Part of the Alfred P. Sloan Foundation grant for US-RSE has been delegated for the [Community and Travel Funds program](https://us-rse.org/funds-and-awards/). Members of US-RSE can apply for funds for community or individual purposes for event costs, get-togethers, travel funding, and more.*

The next application deadline is **{{ next_deadline | date: "%B %-d, %Y" }}**. We encourage you to apply for funding to support your community and travel needs!  
The application process is simple and straightforward. You can find the application form [here](https://us-rse.org/funds-and-awards/).

-----------------

<a name="news"></a> 
# 🗞️ **6. Community News** 

<!--Someone you want to shoutout? DO IT HERE!-->

<a name="community-calls"></a>
### **Community Calls**

<!--Community call news goes here-->

[TODO]
The next community call will be all about **conferences** and will take place on June 13th at 1PM CDT/2PM EST. Please visit the [Community Calls Website](https://us-rse.org/events/category/#community-call) for more information and to access the registration link.

***May Community Call (Past)***   

The May Community Call was about **git branching strategies and continuous integration tools**, and is available on YouTube:

<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; overflow: hidden; background: #000; aspect-ratio: 16 / 9;">
  <img src="https://img.youtube.com/vi/UdpjTha4F4M/hqdefault.jpg" 
       alt="YouTube Video Thumbnail" 
       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
       onclick="this.outerHTML='<iframe width=\'640\' height=\'360\' src=\'https://www.youtube.com/embed/UdpjTha4F4M?autoplay=1\' title=\'YouTube video player\' frameborder=\'0\' allow=\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\' allowfullscreen style=\'position: absolute; top: 0; left: 0; width: 100%; height: 100%;\'></iframe>'">
</div>

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
