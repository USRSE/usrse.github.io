---
layout: post
title: US-RSE {{ month }} {{ year }} Newsletter
subtitle: "This Month: [Headline Theme]!"
subtitle: {{ month }} {{ year }}
category: newsletter
tags: [newsletter, {{ month }}]
date: {{ date }} 00:00:00 -0400
author: Tinashe M. Tapera
image: "[HEADLINE IMAGE]"
---

<a name="top"></a>

In this monthly newsletter, we share recent, current, and planned activities of the US-RSE Association, and related news that we think is of interest to US-RSE members. Newsletters are also available on our [website](https://us-rse.org/newsletters/). To receive our newsletter, [join US-RSE](https://us-rse.org/join/).

In this issue:
* [1. USRSE'25 Conference](#conference2025)
* [2. [HEADLINE]](#headline)
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
# 💟 **2. [HEADLINE]**

<!-- Monthly headline/highlight -->

-----------------

<a name="sc-update"></a>
# 🛞 **3. Steering Committee Updates**

<!-- Key SC activities, decisions, funding news -->

-----------------

<a name="orgmember"></a>
# 🤝 **4. Organizational Founding Membership**

US-RSE envisions a future where Research Software Engineers are universally respected for advancing science, technology, and society through the transformative power of research software engineering.
We’re excited to share that the momentum around our Organizational Founding Membership continues to grow! Our current members are listed below, and organizations that join on or before November 30, 2025, will be recognized in perpetuity as founding members. Founding organizations will also lock in current membership fees through December 31, 2028.
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
# ✈️ **5. Community and Travel Funds Program**

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

The next community call topic will be on **AI in Research Software Engineering** and will take place on June 13th at 1PM CDT/2PM EST. Please visit the [Community Calls Website](https://us-rse.org/events/category/#community-call) for more information and to access the registration link.

> It’s been almost two years since we lasted talked about AI, ChatGPT, and LLMs in RSEng, and a lot has changed in that time! Let’s get together and share how we’re using these tools today to write code, check code, or otherwise help out in our roles as RSEs. What do they mean for our job? How are they best deployed? Do they create trustworthy code? Or maybe you use them for research rather than for creating code for research? What do they mean for the next generation of research software engineers? These and so many more questions will be discussed at our next community call.

***May Community Call (Past)***   

The May Community Call was about the upcoming **USRSE'25 Conference**, and is available on YouTube:

<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; overflow: hidden; background: #000; aspect-ratio: 16 / 9;">
  <img src="https://img.youtube.com/vi/GuwSPmT-g0c/hqdefault.jpg" 
       alt="YouTube Video Thumbnail" 
       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
       onclick="this.outerHTML='<iframe width=\'640\' height=\'360\' src=\'https://www.youtube.com/embed/GuwSPmT-g0c?si=b1_6Yf34ftgyi9Xk?autoplay=1\' title=\'YouTube video player\' frameborder=\'0\' allow=\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\' allowfullscreen style=\'position: absolute; top: 0; left: 0; width: 100%; height: 100%;\'></iframe>'">
</div>

-----------------

<a name="events"></a>
# 👀 **7. Interesting Events and Opportunities**

🦄 They Arrived as a Herd… But They’re Ready to Travel to You! 🚀

[The 2025 US-RSE magical unicorns have officially arrived!](https://give.communityin.org/unicorn2025?ref=ab_20w0PysS59P20w0PysS59P)


<div style="overflow: hidden;">

  <img src="{{ site.baseurl }}/assets/img/newsletter-202503/640cfde67663483d9c19a2655309a086_large.jpg" 
       alt="US-RSE Unicorn" 
       title="US-RSE Unicorn" 
       style="float: left; max-width: 300px; width: 100%; height: auto; margin: 0 20px 20px 0; border-radius: 10px;">

  <p>
    They came as a herd, packed together in a carton, just like how research software engineers come together to build a stronger community. But now, these unicorns are ready to set off on their own journeys—finding new homes with RSEs, allies, and supporters like you.
  </p>

  <p>
    This year’s edition proudly wears a red shirt featuring the US-RSE logo integrated with 2025, symbolizing another year of growth, collaboration, and impact. Just like our community, these unicorns remind us that while we each have our own paths, we are part of something bigger—a movement dedicated to advancing research software and supporting those who make it happen.
  </p>

  <p>
    By adopting a unicorn, you’re not just getting a fun desk companion—you’re also supporting US-RSE’s mission to strengthen the RSE community, advocate for recognition, and create more opportunities for collaboration.
  </p>

  <p>
    📦 Limited supply—once they leave the herd, they’re gone!
  </p>

  <p>
    🚚 They’ll ship for free within the US! 🚚
  </p>

  <p>
    If you're from another country and want to get your hands on a unicorn, reach out to us, and we'll find out whether we can arrange shipping for you.
  </p>

  <p>
    Don't miss out on this opportunity to own a piece of US-RSE magic and donate to get your Unicorn 2025 Edition today. This edition will be available while supplies last until December 10, 2025 ✨🦄✨
  </p>

</div>

👉 [https://give.communityin.org/unicorn2025?ref=ab_20w0PysS59P20w0PysS59P](https://give.communityin.org/unicorn2025?ref=ab_20w0PysS59P20w0PysS59P)

<!-- Include {% include event-box.html %} or opportunity-box -->

<!--

Advertise your interesting opportunities here

        We're using an html-box for automating opportunities.
        They look pretty, and are easy to use.
        Just copy the code in the include block below, and fill in the details in markdown.

{% include opportunity-box.html 
    title="Awesome opportunity" 
    preamble="Are you an R user passionate about software engineering and collaboration?  
Join the **R-RSE Affinity Group** to connect with fellow R users, share projects, and build community."
    links="[Learn more about R-RSE](https://us-rse.org/ag/r-rse/)"
%}
-->

<!--
        Advertise your events and opportunities in in the coming months and beyond here!

        We're using an html-box for automating events.
        They look pretty, and are easy to use.
        Just copy the code in the include block below, and fill in the details in markdown.

{% include event-box.html 
    
    title="My cool event" 
    when="Tomorrow, May 15, 5:30–7:00 PM" 
    where="My place"
    preamble="Come on over to my cool event. It's going to be **awesome**! Here's a list of things we can do:
    - eat pizza
    - drink soda
    - play games
    - have fun
    It's all in markdown too!"
    links="Make sure to include a CALL TO ACTION: Show up by registering[here](https://example.com) or on [Meetup](https://example.com)"
%}

-->

-----------------

<a name="reads"></a>
# 📚 **8. Featured Reads, Videos, and Podcasts**

<!--
  This section now uses an automated bibliography system powered by Zotero and BibTeX.
  
  Workflow:
  1. Throughout the month, collect interesting media in Zotero with the tag "newsletter"
  2. Use Zotero's read status plugin to mark items as "Read" or "Unread"
  3. Export the Zotero collection to _data/interesting_reads.bib (BibTeX format)
  4. Run: python scripts/bibtex_to_yaml.py (converts BibTeX to YAML)
  5. The bibliography will automatically render below, filtered by read_status
  
  Manual entries can still be added in the sections below if needed.
-->

### 📑 Recent Publications

{% comment %}
  Automatically render unread publications from the bibliography
{% endcomment %}
{% for entry in site.data.interesting_reads %}
  {% if entry.read_status == 'Unread' and entry.type != 'misc' %}
{% include bibliography-entry.html entry=entry %}
  {% endif %}
{% endfor %}

<!-- You can still add manual entries here if needed -->

### 📝 Blog Posts

{% comment %}
  Automatically render unread blog posts from the bibliography
{% endcomment %}
{% for entry in site.data.interesting_reads %}
  {% if entry.read_status == 'Unread' and entry.type == 'misc' %}
{% include bibliography-entry.html entry=entry %}
  {% endif %}
{% endfor %}

<!-- You can still add manual entries here if needed -->

### 🎧 Podcast Highlights

Recent episodes from the **#code4thought** podcast:
<!-- Template format for podcasts:
- **Let's Go Atomic (with Design) – Brad Frost**  
  <a href="https://codeforthought.buzzsprout.com/1326658/episodes/17077805-en-let-s-go-atomic-with-design-brad-frost" target="_blank" rel="noopener">Listen here</a>

-->

> Have something interesting you'd like to share? Please send us your suggestions for the next newsletter using the #newsletters channel in the USRSE Slack!
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

These opportunities were recently posted to the [RSE Opportunities page](https://us-rse.org/jobs/):


{% assign today = site.time | date: "%Y-%m-%d" %}
<ul>
{% for job in site.data.jobs %}
  {% assign job_expiry = job.expires | date: "%Y-%m-%d" %}
  {% if job_expiry >= today %}
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
