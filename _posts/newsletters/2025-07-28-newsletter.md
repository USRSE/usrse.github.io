---
layout: post
title: US-RSE July 2025 Newsletter
subtitle: "🫶 This Month: THANK YOU for Contributing to US-RSE'25 🫶"
category: newsletter
tags: [newsletter, July]
date: 2025-07-29 00:00:00 -0400
author: Tinashe M. Tapera
image: "/assets/img/newsletter-202506/photo-1629904869392-ae2a682d4d01.jpeg"
carousels:
  - images: 
    - image: "/assets/img/newsletter-202507/1752508512981.jpeg"
    - image: "/assets/img/newsletter-202507/1752508513266.jpeg"
    - image: "/assets/img/newsletter-202507/1752508513365.jpeg"
    - image: "/assets/img/newsletter-202507/1752866720529.jpeg"
---

<a name="top"></a>

Welcome to this month’s edition of the US-RSE Newsletter! US-RSE'25 is right around the corner, and we're so pleased to have received so many great submissions!

<p align="center">
  <img src="{{ site.baseurl }}/assets/img/newsletter-202507/jud-mackrill-Of_m3hMsoAA-unsplash.jpg" alt="Group of RSEs stock photo" style="width: 750px; height: auto;">
</p>


In this issue:
* [1. USRSE'25 Conference](#conference2025)
* [2. Executive Update: AI in the Workplace](#headline)
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

🔔 [Registration](https://us-rse.org/usrse25/attend/registration/) is **now open!** 🔔

Thank you to all who have submitted work for this conference! Reviews (for posters only) are underway and notifications should be sent before August 16. We received an impressive 170 submissions across all tracks, with particularly strong interest in talks and posters. This contributed to a competitive peer review process and a slate of high quality material to look forward to at the conference in October.

**Registration opened in late June.** Check out our [registration](https://us-rse.org/usrse25/attend/registration/) page for information on rates and for the link to register through Eventbrite. Please note that **August 8 is the author registration deadline** (all formats but posters) and **August 20 is the early-bird registration deadline**.

Whether you’re a research software engineer, data scientist, digital humanist, scientific programmer, software developer, or research software user, US-RSE is where people at the intersection of code and research come together. The USRSE'25 conference is your chance to connect with peers, mentors, and experts in the fast-growing world of research software. Don’t just take our word for it—100% of last year's post-conference survey respondents said they would return and recommend the conference to others.

Visit the [conference website](https://us-rse.org/usrse25/attend/) for further details including: venue, hotel, registration costs and deadlines, travel details, dates for notification of acceptance and other important dates.


-----------------

<a name="headline"></a>
# 🔊 **2. Executive Director's Update: State of AI in the Workplace**
<!-- Add monthly theme / highlight -->

Sandra has worked with the Academic Data Science Alliance on the proposal “State of AI at the Workplace” and we received the funding! There will be Birds of the Feather (BoFs) and USRSE’25 and RSECon’25 in the UK. We plan for more also at SC25 and more interactive events. The survey “Generative AI at the Workplace” is also part of it.

> The goals of this project as well as the survey are to capture broad “state of the field” information and to help define topic areas for a set of convenings with the RSE community over the coming year. These convenings are intended to dig into the details of AI use in the RSE workplace: to understand what’s already happening, identify key challenges and opportunities, and explore how RSEs themselves can actively shape the future of AI-augmented research software engineering.

Please take a moment to fill out the 5-minute survey [here](https://form.jotform.com/251737608797069?utm_source=ADSA&utm_campaign=af84474998-EMAIL_CAMPAIGN_2021_02_02_06_24_COPY_01&utm_medium=email&utm_term=0_5401c7226a-af84474998-353402058).


-----------------

<a name="sc-update"></a>
# 🛞 **3. Steering Committee Updates**

<!-- Fill in with current Steering Committee news -->

In July, the Steering Committee focused on several operational and strategic efforts. We spent significant time discussing the logistics of facilitating funding for the conference, specifically travel for students and early career participants. In collaboration with Sandra, we outlined key priorities for our new Interim Project Manager. This is a temporary role, expected to last approximately six months, and will differ in scope and focus from the previous Community Manager position. We also have been preparing and participating in the development of two important surveys: (1) an internal US-RSE community survey and, (2) the next iteration of the International RSE survey. Both surveys will help us better understand and serve both our members and the broader RSE community. Lastly, we have been working through some ongoing challenges related to external funding and the processes and procedures of fiscal sponsorship.

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
### INTERSECT 2025 Bootcamp (via @cosden Ian Cosden!)

The 3rd year of **INTERSECT: Research Software Engineering Training** brought together another awesome cohort of graduate students, postdocs, and early-career researchers for a week-long deep dive into intermediate and advanced research software engineering (RSE) practices.

The 4.5 day bootcamp of intensive, hands-on training is designed to engage participants with topics critical to building sustainable, reproducible, and collaborative research software. The curriculum emphasizes:

- **Software design principles** like modularity and functional independence  
- **Testing infrastructure**, like unit testing and continuous integration with tools like TravisCI and Jenkins  
- **Collaboration techniques** using GitHub workflows (pull requests, code review, issue tracking)  
- **Software packaging & distribution** for real-world deployment and community reuse  
- **Documentation strategies** using tools like Sphinx and Doxygen  

By targeting those with an existing foundation in research software development, the bootcamp fosters a unique environment where participants could immediately apply best practices to their own work—and return to their institutions as local leaders in research software sustainability. Congratulations to Ian and the team at Princeton University for another successful bootcamp!

{% include carousel.html height="45" unit="%" duration="10" number="1" %}

Interested in attending next year? Just visit the [INTERSECT website](https://intersect-training.org/bootcamps/) to learn more about the program and sign up for updates.

<a name="community-calls"></a>
### **Community Calls**

<!--Community call news goes here-->
***July Community Call***

Our recent community call was packed with valuable insights, focusing on topics close to our hearts, including the US-RSE community, RSE careers, funding, and more. After a leadership overview and presentations from two of our members, we split into breakout rooms to dive deeper into these topics.

One standout breakout room focused on RSE careers, exploring how to find RSE roles, effective resources for job applications, keywords, and more. You can check out the notes from this discussion [here](https://docs.google.com/document/d/1cRJSyhbW8Z93ZOXl6RaxOuhCefR5kC1wmzu09InKEtY/edit?tab=t.0).

We'd love to hear from you! Share the keywords you use when searching for your next RSE role or when posting RSE positions. Your input can help us all navigate the job market more effectively.

<!-- Add a link to the recording of the call if available 
**TBD Mentimeter** 

<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; overflow: hidden; background: #000; aspect-ratio: 16 / 9;">
<iframe width="640" height="360" src="" title="Mentimeter July 2025" frameborder="0" allow="gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

**TBD last call**
<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; overflow: hidden; background: #000; aspect-ratio: 16 / 9;">
  <img src="" 
       alt="YouTube Video Thumbnail" 
       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
       onclick="this.outerHTML='<iframe width=\'640\' height=\'360\' src=\'\' title=\'YouTube video player\' frameborder=\'0\' allow=\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\' allowfullscreen style=\'position: absolute; top: 0; left: 0; width: 100%; height: 100%;\'></iframe>'">
</div>
-->
-----------------

<a name="events"></a>
# 👀 **7. Interesting Events and Opportunities**

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

<!-- Include opportunity-box and event-box includes -->

{% include opportunity-box.html 
    title="Call for abstracts: Research Software Engineers in HPC (RSE-HPC-2025)" 
    preamble="
To be held as part of SC25, St. Louis, MO, USA and online, Sunday, November 16, 2025, 8:30 am - 5:00 pm CST (UTC-6)

**=== Overview ===**

Research software engineers (RSEs) are critical to the impact of HPC, data science, and the larger scientific community. They have existed for decades, though often not under that name. The past several years, however, have seen the development of the RSE concept, common job titles, and career paths; the creation of professional networks to connect RSEs; and the emergence of RSE groups at universities, national laboratories, and industry.
This workshop will bring together RSEs and allies involved in HPC, from all over the world, to grow the RSE community by establishing and strengthening professional networks of current RSEs and RSE leaders. We'll hear about successes and challenges that RSEs and RSE groups have experienced, and discuss ways to increase awareness of RSE opportunities and improve support for RSEs.

The workshop will be highly interactive, featuring breakout discussions and panels, as well as invited addresses and submitted talks.

**=== Submissions ===**

We encourage prospective participants to submit abstracts of proposed lightning talks (limit of 1 page, no format prescribed) on topics related to RSE issues. Possible topics include, but are not limited to:

- Career paths: how should RSEs be hired, promoted and evaluated?Building RSE organizations: how to find RSEs in your country/region and how to motivate them to join the network and engage?
- Supporting RSE organizations: what can be done to help RSEs (and those supporting RSEs) at international, national, regional, and local levels?
- Making the business case for RSEs and RSE groups: evidence, case studies, tactics
- How do we want funders to support RSE roles and activities?
- Building in RSE requirements as part of wider research infrastructure
- Providing mentoring and training for RSEs
- How will RSEs contribute to new technologies such as AI/ML, quantum computing, neuromorphic computing?

The authors of accepted abstracts will be invited to present lightning talks or participate in panel discussions at the workshop. Note that SC25 is planning an in-person event and presenting in-person is encouraged. A supporting digital experience will accommodate those who cannot attend in-person due to travel restrictions or health concerns.

We particularly encourage submissions from first-time conference presenters, and from members of groups that have historically been underrepresented in the HPC community. **The deadline for submissions is Friday, August 8, 2025, at 11:59 PM AoE (UTC-12).**
"
    links="[Learn more here!](https://us-rse.org/rse-hpc-2025/)"
%}

<!-- {% include opportunity-box.html 
    title="Generative AI in the Workplace Survey📊" 
    preamble="
The Academic Data Science Alliance, US Research Software Engineer Association, and Schmidt Sciences are working together to uncover how Research Software Engineers (RSEs) and those in adjacent workspaces (e.g., research team members, data scientists) are using Generative AI in the workplace.

The goals of this survey are to capture broad “state of the field” information and to help define topic areas for a set of convenings with the RSE community over the coming year. These convenings are intended to dig into the details of AI use in the RSE workplace: to understand what’s already happening, identify key challenges and opportunities, and explore how RSEs themselves can actively shape the future of AI-augmented research software engineering."
    links="Please take a moment to fill out the survey [here](https://form.jotform.com/251737608797069)"
%} -->


{% include opportunity-box.html 
    title="Supercomputing and the Future of AI: Watch the Full Virtual Exchange Series On-Demand! 🤖" 
    preamble="
Our exciting webinar series for K–12 classrooms, presented in partnership with Reach the World, has officially wrapped! Over the past ten weeks, more than 840 students joined us to explore the fascinating world of supercomputing, quantum computing, and artificial intelligence.
Now, all episodes are available to watch on-demand along with companion journal articles that bring the topics to life for students, educators, and curious minds of all ages. Together with Reach the World, US-RSE created this virtual exchange to offer a behind-the-scenes look at how research software engineers and data scientists use cutting-edge computing to tackle real-world challenges.
"
    links="Learn more at [ReachTheWorld.org](https://reachtheworld.org/supercomputing-and-future-ai-0), and please reach out to [Sandra Gesing](mailto:sandra@us-rse.org) with any questions"
%}

{% include opportunity-box.html 
    title="Code Review Study" 
    preamble="Dr. Jeffrey Carver, Dr. Nasir Eisty, and Md Ariful Malik from the University of Alabama are conducting a study to explore the code review process used by Research Software Engineers (RSEs).

As an RSE, we invite you to participate in an interview to share your experiences with the code review process. The interview will take approximately 15–20 minutes and can be conducted via Zoom or in person, depending on your preference.

Your participation is completely voluntary and confidential. Information will be kept anonymous, and with your approval, we will record the audio of the interview. Any personal information will be deleted after the interview. You may choose to withdraw at any time before or during the interview. To be eligible, you must be 18 years or older. This study has been approved by the University of Alabama Institutional Review Board."
    links="We would greatly appreciate your participation and insights. Thank you in advance!
If you are interested in being interviewed, please fill out [this short information form](https://universityofalabama.az1.qualtrics.com/jfe/form/SV_e39KXNkAYyjVtEG ) so we can contact you to schedule an interview."
%}


{% include opportunity-box.html 
    title="LLM in a Box Template" 
    preamble="
Community members [Georg Heiler](https://www.linkedin.com/in/geoheil/) and [Aaron Culich](https://www.linkedin.com/in/aaron-culich/) created a template for making LLMs (from different vendors and even self hosted ones) easily accessible to researchers - including advanced document RAG!
"
    links="[See the project here for details](https://github.com/complexity-science-hub/llm-in-a-box-template)"
%}

{% include opportunity-box.html 
    title="Contribute to the future of DEI in USRSE" 
    preamble="
The US-RSE DEI Working Group is seeking input from the community! We’re exploring new ways to foster diversity, equity, and inclusion within our organization and would love to hear your ideas. What would make US-RSE a more inclusive and welcoming space for you and others?

Let’s work together to make US-RSE a place where everyone feels they belong.
"
    links="If you have suggestions, big or small, please share them in the #dei-disccussion Slack channel or reach out directly to the [DEI Working Group](mailto:wg-dei@us-rse.org). Your feedback will help guide our future initiatives and ensure they reflect the needs of our diverse community.
"
%}

{% include opportunity-box.html 
    title="Scientific Programming Survey by UMichigan" 
    preamble="
Are you a scientist who programs?

A survey study led by a University of Michigan team is being conducted about scientists programming practices, experiences, and tool usage. The survey should take no more than 10-15 minutes to complete. Participants may opt-into a raffle of **five $100 cash awards.**

Scientists in any research area, career track, and stage (including student research assistants) are invited.
"
    links="Please follow [this link](https://umich.qualtrics.com/jfe/form/SV_8GHoOcLfpBp4JOC) to participate, and questions can be directed to [code-for-science@umich.edu](mailto:code-for-science@umich.edu)"
%}

{% include opportunity-box.html 
    title="Open Innovation Sprint" 
    preamble="
Research software is the engine driving modern science and discovery. From analyzing complex datasets to simulating intricate phenomena, it's an indispensable part of the research lifecycle. Yet, understanding and quantifying its impact remains a significant challenge for researchers, project contributors, institutions, and funders alike.

How do we effectively measure the reach and influence of these vital tools? How can we incentivize better practices around software citation, metadata, and sustainability?

To tackle these shared ecosystem challenges head-on, [NumFOCUS’s](https://numfocus.org/) [Open Source Science Initiative](http://opensource.science/) launched the 2025 “Impact of Research Software” Open Innovation Sprint!

Running from March through late 2025, this sprint is a collaborative, fast-paced initiative bringing together researchers, engineers, designers, community organizers, and users. Our goal is to produce actionable, community-driven outputs – open source tools ready for immediate use and contribution.

This inaugural sprint, focused on measuring research software impact, is inspired by efforts such as the [CZI 2023 Software Impact Hackathon](https://github.com/chanzuckerberg/software-impact-hackathon-2023), is led by NumFOCUS’s Open Source Science Initiative, and is made possible through collaboration with the [Research Software Alliance (ReSA)](https://www.researchsoft.org/), [Open Source Collective](https://opencollective.com/opensource) and [ecosyste.ms](http://ecosyste.ms/), and the Sprint’s contributors and their organizations.
"
    links="[Learn more and sign up for a sprint track here!](https://www.opensource.science/updates/making-research-software-count-one-month-into-our-open-innovation-sprint-track-2)"
%}

{% include opportunity-box.html 
    title="NSF NCAR Co-Development Discovery Workshop"  
    preamble="The U.S. National Science Foundation National Center for Atmospheric Research (NSF NCAR) is hosting a Co-Development Discovery Workshop from August 20-21, 2025 in Boulder, CO, and online.

The goals of this workshop are to:
 Learn from best practices at other organizations and develop ideas to inform the process and framework of software co-development (between scientists and software engineers) at NSF NCAR. Identify ways to improve efficiency in communications, collaboration, and decision making in the co-development space.
 Hear how other organizations provide support, professional development, and develop culture and communities of practice within their software engineering teams.

Anticipated agenda topics include: decision making, communications and team dynamics, better platform agility, automation, GPU optimization, adapting to new hardware, software career support and processes, and more.
"
    links="[Learn more and sign up for a sprint track here!](https://www.opensource.science/updates/making-research-software-count-one-month-into-our-open-innovation-sprint-track-2)"
%}


<!-- end opportunities boxes-->

<!--
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

{% include event-box.html 
    
    title="RSECon25 in the UK 🇬🇧" 
    when="September 9-11, 2025" 
    where="Online via Zoom"
    preamble="Across the pond, the RSE Society is currently gearing up for **RSECon25** which will take place at the University of Warwick 9-11th September 2025! Registration for remote attendance remains open until August 30th!
"
    links="Registration details can be found [here](https://rsecon25.society-rse.org/registration/) and a draft program can be viewed [here](https://rsecon25.society-rse.org/programme/). In addition, we encourage all of our readers to connect with the RSE Society on [Mastodon](https://mastodon.social/@ResearchSoftEng/), [LinkedIn](https://www.linkedin.com/company/society-of-research-software-engineering/), and [Bluesky](https://bsky.app/profile/society-rse.org/post/3lu5wqkn56i2g) channels!"
%}

{% include event-box.html 
    
    title="Gateways 2025 Annual Conference" 
    when="Tuesday, October 28 – Thursday, October 30, 2025" 
    where="The Oneida Hotel, Green Bay, Wisconsin"
    preamble="**Gateways 2025** bridges the connection between science and gateways, bringing together developers, researchers, and users to learn, share, and collaborate. Hosted annually in the U.S., the conference features a robust program of keynotes, short papers, panels, posters, tutorials, demos, and open access proceedings.

This year’s event will also offer a **special journal publication opportunity** for all accepted papers.

Whether you're a seasoned gateway developer or just getting started, Gateways is a great way to expand your skills and network in a welcoming, interdisciplinary environment.

**Presentation and Publication Options** 
We invite the submission of papers and abstracts related to science gateways. All contributions will be subject to standard peer review on quality and relevance. This will apply to tutorial sessions, papers, panels, posters, demos, and BYOP (Bring Your Own Portal). Tutorial sessions, papers, panels, posters, and demos will be published openly accessible in Zenodo. Please note that authors of papers will be invited to submit an extended and updated version of their paper for a special issue journal on science gateways.
- Tutorial submissions are due ~~June 16, 2025~~ **July 9, 2025 (Extended!)**
- Paper, demo, and panel submissions are due ~~June 16, 2025~~ **July 9, 2025 (Extended!)**
- Poster and BYOP - Bring Your Own Portal submissions are due **August 4, 2025**
- Student Poster submissions are due **September 10, 2025**
"
    
    links="[Learn more and get involved](https://sciencegateways.org/gateways2025). Want to help shape the event? Email [help@sciencegateways.org](mailto:help@sciencegateways.org) to join the planning committee."
%}

{% include event-box.html 
    
    title="Reproducible Machine Learning Workflows for Scientists Workshop 2025" 
    when="Aug 12–14, 2025, 8:30 AM – 4:00 PM US Central Time" 
    where="Discovery Building, 330 N. Orchard St, Madison, WI 53715 🏛️"
    preamble="
This national workshop introduces Pixi, a modern open-source tool for creating reproducible computing environments across heterogeneous platforms. Participants will gain hands-on experience building and deploying Python-based machine learning workflows with hardware acceleration and containerization, focusing on real-world reproducibility challenges.

No prior experience with machine learning or Pixi is required, but familiarity with the command line, Git, and Python is expected. Early-career researchers are especially encouraged to apply.

🏨 **Lodging stipend available** for up to 10 non-local participants.  
🤝 **Instructors:** Matthew Feickert, Chris Endemann, Ryan Bemowski, Raheem Hashmani  
🎓 **Supported by:** URSSI, Sloan Foundation, OSG Consortium, UW–Madison Data Science Institute
"
    
    links="[Apply to Register](https://indico.global/event/14982/)"
%}


{% include event-box.html 
    
    title="Building Engagement (BE) program at the 2025 US-RSE25" 
    when="October 2-8, 2025" 
    where="Philadelphia, PA"
    preamble="
Sustainable Horizons Institute is organizing a Building Engagement (BE) program at the 2025 US-Research Software Engineers (US-RSE25) conference to be held October 2-8, 2025 in Philadelphia, PA. The BE program is designed to expand the professional association by supporting students from a variety of backgrounds. BE@US-RSE25 will provide funding and special activities designed to welcome students and help them become part of the community.
BE participants are recruited from non-mainstream and smaller academic institutions. For many, US-RSE25 will be their first experience at a scientific conference. Many will be undergraduate students from minority-serving institutions, women’s and community colleges, or small liberal arts colleges. For some, attending US-RSE25 will have a dramatic impact on their future.
BE first started at the Society of Industrial and Applied Mathematics 2015 Computational Science and Engineering conference and has welcomed approximately 350 students and professionals into professional societies.
We are currently recruiting volunteers (unfortunately we are not able to provide funding for volunteers) for these roles:
Guided Affinity Group Leaders: work with a small group of students to help them get the most out of the conference; must already have funding to attend the conference; for more information visit the BE@US-RSE Guided Affinity Groups page.
Review Committee members: US-RSE and other computational science and engineering community members with an interest in supporting students from a variety of backgrounds and with an interest in the mission of the Building Engagement program; committee members will review applications for funded participants in late August; all work will be completed virtually in 1-2 hours
" 
    links="If you are interested in volunteering, please go to the [BE submission site](https://ssl.linklings.net/conferences/SHInstitute/) and complete one of these forms:

BE@USE-RSE25 Volunteer Application: Guided Affinity Group Leader; deadline: August 8, 2015
BE@USE-RSE25 Volunteer Application: Review Committee; deadline: August 15, 2025

If you have any questions please contact: [BE@shinstitute.org](mailto:BE@shinstitute.org)
"
%}

-----------------

<a name="reads"></a>
# 📚 **8. Featured Reads, Videos, and Podcasts**

### 📑 Recent Publications

- **N. U. Eisty, J. C. Carver, J. Cohoon, I. A. Cosden, C. Goble, S. Grayson**, _"Ten Simple Rules for Catalyzing Collaborations and Building Bridges between Research Software Engineers and Software Engineering Researchers,"_ *IEEE Computing in Science & Engineering (CiSE)*, 2025. [Read the article.](https://doi.org/10.1109/MCSE.2025.3569786)

- **S. Gesing, M. Dahan, C. Stirm, L. Hayden, J. Baker**, _"NAIRR Portal Report,"_ *Zenodo*, Version v1, July 2, 2025. [Read the report.](https://doi.org/10.5281/zenodo.15792892)

- **F. Schreiber, T. Czauderna, D. Garkov, N. Gröne, K. Klein, M. Lange, U. Scholz, B. Sommer**, _"Sustainable software development in science – insights from 20 years of Vanted,"_ *Journal of Integrative Bioinformatics*, July 1, 2025. [Read the article.](https://doi.org/10.1515/jib-2025-0007)

<!-- Add new articles and podcast links -->

### 📝 Blog Posts

- **A. Mittal**, _"From Cloud Chaos to Developer Delight — A Practical Guide to Building Your First Internal Developer Platform,"_ *Medium*, May 19, 2025. [Read the post.](https://medium.com/@akshaymittal_90606/from-cloud-chaos-to-developer-delight-a-practical-guide-to-building-your-first-internal-ff3d12834ad0)

- **S. Gregurick**, _"Introducing the 2025–2030 NIH Strategic Plan for Data Science,"_ *NIH Director’s Blog*, June 2025. [Read the post.](https://datascience.nih.gov/director/directors-blog-introducing-2025-2030-nih-strategic-plan-for-data-science)


### 🎧 Podcast Highlights

Recent episodes from the **#code4thought** podcast:

- **A Service for All Seasons - the MetOffice UK** 
  <a href="https://codeforthought.buzzsprout.com/1326658/episodes/17395352-en-a-service-for-all-seasons-the-metoffice-uk" target="_blank" rel="noopener">Listen here</a>

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
  {% assign expires_formatted = job.expires | date: "%Y-%m-%d" %}
  {% if expires_formatted >= today %}
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

