---
layout: post
title: "US-RSE June 2026 Newsletter"
subtitle: "🤔 Arrestive Curiosity & RSEs: How to Turn the Shiny Toy Syndrome Bug into a Feature 🤔"
category: newsletter
tags: [newsletter, June]
date: 2026-06-15 00:00:00 -0400
author: "Tinashe M. Tapera (Author & Editor), Sandra Gesing (Editor), Ian Cosden (Editor)"
image: "/assets/img/newsletter-202606/tasha-kostyuk-TtMKq3lJm-U-unsplash.jpg" #Done
img_alttext: "A railway traffic controller with his back to the camera, looking at several screens with train camera feed and data." #Done
next_meeting_date: Thursday, July 9, 2026, 12:00PM EST #Done
sections:
  preamble: true #Done
  headline: true #Done
  conference: true #Done
  execupdate: false #TODO
  scupdate: false #TODO
  orgmember: true #TODO
  communityfunds: false #TODO
  news: true #TODO
  events: true #TODO
  reads: true #TODO
  involved: true
  jobs: true

---

<a name="top"></a>

First of all, Happy Pride Month 🌈, and Happy Juneteenth 🎉! We hope you
are all having a wonderful summer celebrating the diversity and
resilience of our communities.

It’s been another busy month for US-RSE, as conference planning
continues to ramp up, membership continues to grow, and the organization
continues to expand its offerings and impact to the research software
community. In this issue, we’ll discuss shiny toy syndrome in
technology, celebrate the LGBTQ+ community, and share all the latest and
greatest news from US-RSE.

<p align="center">
  <img src="{{ site.baseurl }}/assets/img/newsletter-202606/tasha-kostyuk-TtMKq3lJm-U-unsplash.jpg" alt="A railway traffic controller with his back to the camera, looking at several screens with train camera feed and data." style="width: 750px; height: auto;">
</p>

In this issue:

- [<span class="toc-section-number">1</span> 🤔 Arrestive Curiosity &
  RSEs: How to Turn the Shiny Toy Syndrome Bug into a Feature
  🤔](#thinking-arrestive-curiosity--rses-how-to-turn-the-shiny-toy-syndrome-bug-into-a-feature-thinking)
- [<span class="toc-section-number">2</span> 📣 Mark Your Calendars for
  USRSE’26! 📣](#mega-mark-your-calendars-for-usrse26-mega)
- [<span class="toc-section-number">3</span> 🤝 Organizational Founding
  Membership
  🤝](#handshake-organizational-founding-membership-handshake)
- [<span class="toc-section-number">4</span> 🗞️ Community News
  🗞️](#newspaper_roll-community-news-newspaper_roll)
- [<span class="toc-section-number">5</span> Community
  Spotlight](#community-spotlight)
- [<span class="toc-section-number">6</span> 👀 Interesting Events and
  Opportunities 👀](#eyes-interesting-events-and-opportunities-eyes)
- [<span class="toc-section-number">7</span> 📚 Featured Reads, Videos,
  and Podcasts 📚](#books-featured-reads-videos-and-podcasts-books)
- [<span class="toc-section-number">8</span> 🏃 Get Involved!
  🏃](#running-get-involved-running)
- [<span class="toc-section-number">9</span> 🧑‍💼 Recent Job Postings
  🧑‍💼](#office_worker-recent-job-postings-office_worker)

------------------------------------------------------------------------

## 🤔 Arrestive Curiosity & RSEs: How to Turn the Shiny Toy Syndrome Bug into a Feature 🤔

<a name="headline"></a>

This month, I had the pleasure of meeting some fellow R users at the
Boston R User Group meetup, where I can say I finally felt safe opening
a conversation with a hot take like, “R is the best,” knowing it would
likely not spark a flame war. I’m sure many of you having read that
sentence are already compiling the several counterarguments in your
head, mashing away your response in a text editor, choosing all your
best and worst use cases as examples and calling on the greats of your
respective community to back you up. But this discussion is actually not
about flame wars; in fact, as I’m sure you’ve experienced, we as
technologists often care less about what tool is objectively best, and
more about what tool is best for us, our project, and our team.

And while this can sound like a freeing stance on tooling in general, it
leaves us with an acute conundrum: how do we know when to *switch*
tools? When do we know that the tool we’re using is no longer best for
us, and that we should switch to something else? As computing becomes
more accessible and capable, more individuals are building tools that
avow to *finally* and *decisively* solve the problem of \[insert other
tools’ shortcomings here\]. Indeed, whether it was Markdown’s attempt to
become the de facto standard for writing on the web Anaconda claim to be
the last word in environment management for data science, or the eternal
paradox of Apple’s latest OS somehow always having “the best feature,
ever,” technology is rife with shiny toys that promise to solve all our
problems. On the one hand, it can be incredibly overwhelming trying to
keep up with the latest and greatest, and on the other, you could easily
risk missing out on a tool that could be a game changer for you and your
team if you don’t branch out and experiment from time to
time[1^](In%20fact,%20at%20this%20UseR%20Boston%20meetup,%20we%20ourselves%20had%20a%20hard%20time%20rectifying%20our%20excitement).

This decision fatigue can end up being a significant job hazard for
people who work with technology. What if your organization is one of the
unfortunate few that decided to go all-in on Skype\[2^\], or what if you
can’t ship a new product or publish a paper because your team has not
ported over its legacy libraries to Python 3 yet? As RSEs, part of our
responsibility is to help scientific teams navigate this ever-changing
landscape of tools and technologies, and it can be very tricky to draw
the line between productive experimentation and [shiny toy
syndrome](https://nesslabs.com/shiny-toy-syndrome). How does one justify
several afternoons’ worth of tinkering, only to come to the conclusion
that the new tool actually *doesn’t* do what it says on the box - or at
least, not to your satisfaction — and continue to be trusted with the
responsibility of guiding your team’s technological vision?

But as I thought about this more, I realized that this activity of
tinkering and experimenting with new tools is actually a critical part
of our job as RSEs, and that we can turn this “bug” of shiny toy
syndrome into a “feature” of arrestive curiosity. Arrestive curiosity is
the tendency to be so curious about new tools and technologies that you
cannot move forward with your own work until you’ve proven a new tool is
either better or worse for you than the one you’re currently
using\[3^\]. If you’ve ever been up late at night trying to get a VSCode
extension to run without error, trying to figure out why a new library
can’t just install on your system, or drawing out your ultimate
note-taking entourage of apps for never losing a thought, I see you!
This kind of curiosity can be a disastrous time sink — but it can also
be a powerful way to stay on top of the latest and greatest, and to make
sure you’re using the best tools for you and your team.

So, how do we cultivate arrestive curiosity without falling into the
trap of time-wasting? Having wrestled with this for several years, I
think I can provide a few considerations that have helped me strike this
balance:

1.  *Stop being distracted by the perfect tool until you know what
    perfect is supposed to look like.* Before seriously investigating a
    new tool, write down exactly what problem or need you think it is
    trying to solve for you. In the simple process of articulating this,
    you may find that your existing workflow just needs some refinement,
    or a simple adjustment or reframing of the problem. 95% of the time,
    my tinkering does not pass this step.

2.  *Get comfortable with the discomfort of your current tools.* If
    you’ve successfully passed the first step, then you know for a fact
    that your current workflow needs are not being met, and a new tool —
    or repurposing an old one — is likely the solution. But before you
    dive into the new tool, now is the time to measure the discomfort of
    your current workflow. How much time are you losing to this problem?
    How much mental energy are you spending on it? How much is it
    costing your team in productivity and morale? If the cost of your
    current workflow is not high enough, then it may not be worth the
    time and effort to switch to a new tool. If you can tolerate the
    discomfort, then the tool search ends here.

3.  *Refine to absurdum.* If you are still convinced that something is
    missing, then it is time to start looking for what is missing.
    Surely someone has felt this acute pain, right? The internet is a
    vast place, and there are several billion of us using it at any
    given time. It’s more than likely that someone, somewhere, has been
    in the exact position you’re in, with an install that is too slow, a
    link that doesn’t work, or a workflow that is too clunky and just
    missing that, *secret something*. Go out into dark corners of the
    second, third, and fourth pages of Google search, ask around on
    Reddit and Facebook groups, or find forums and communities that are
    relevant to the problem space. Surely **someone** has faced this
    problem, too?

4.  If the solution is identified, use it. If not, build it. By this
    point, if you have found a niche problem that 1) arrests your
    productivity, 2) causes measurable discomfort, and 3) has not been
    solved by anyone else, then this is a problem worth solving. In
    fact, as an RSE, this is the *perfect* problem to have, because it
    is within this narrow gap between your vision and the status quo
    that you can actually make valuable impact to your team. If you
    can’t or don’t want to build the solution yourself, one of two
    things must be true: either the problem is not worth solving, or you
    are *not yet* the right person to solve it.

In my experience, the really interesting Research Software Engineering
is what happens when as an engineer I have become *obsessed* with a
particular technological blocker to the success of my or my colleagues’
scientific endeavors.

It is the moment we look at the scientific engine and say, “I know we
*could* just use \[X Tool\] to write this part of the paper, but I just
can’t accept that this is the best way to do it. I simply can’t. There
*must* be a better way.”

This is the “arrestive,” part of “arrestive curiosity” — the part that
keeps you up at night, ceases you in your tracks every time you think
about it, and continues to consume all of your mental energy until you
have either found a solution or come to terms with the fact that there
is no solution.

And if you ask me, that tendency to be obsessed with finding the best
way to do science is what makes a good RSE a *great* RSE. So, the next
time you find yourself in the throes of shiny toy syndrome, try to
channel that energy into arrestive curiosity using the flowchart I
outlined above, and see where it takes you. You might just find that the
perfect tool was right in front of you all along, or you might end up
building something that changes the game for you, your team, and perhaps
even the science itself.

vs. hesitation around all things AI in the R world. We could barely come
to a consensus on whether we could be convinced to switch over to the
new native pipe `|>` or stick with the beloved `magrittr` pipe `%>%`
that we’ve been using for years, all the while doing our best “old man
yells at cloud” impression. Spoiler alert: I’m yelling at the cloud.
\[2^\]: Shout out to everyone currently being held hostage by their
CTO’s contract with Microsoft and having to wake up every morning to the
sound of a Teams notification. We see you, and we feel your pain.
\[3^\]: Yes, I just came up with it. No, I will not be answering
questions.

------------------------------------------------------------------------

## 📣 Mark Your Calendars for USRSE’26! 📣

<a name="conference2026"></a>

Save the date for USRSE’26: **Advancing Science in the Age of AI**

<p align="center">

<img src="{{ site.baseurl }}/assets/img/newsletter-202605/usrse26-logo_6.svg" alt="USRSE'26 Conference Logo" style="width: 750px; height: auto;"/>
</p>

We’re thrilled to announce that USRSE’26 will be held at the San Jose
Marriott from October 19-21, 2026 in San Jose, California, with the
theme **“Advancing Science in the Age of AI”.**

Chairs have been appointed to lead each of the core committees for
USRSE’26. These chairs have begun assembling sub‑teams from the pool of
volunteers who expressed interest in supporting the respective areas. If
you were not selected for a chair position, please stay tuned, as chairs
reach out for volunteers for these committee positions.

**What’s next?**

- **Call for Proposals:** Submit your work via papers, short talks,
  BoFs, workshops, or posters. [View
  More](https://us-rse.org/usrse26/participate/)
- **Call for Reviewers:** Play a key role in creating a dynamic and
  varied technical program that will appeal to conference attendees from
  all RSE backgrounds. [Apply to
  Review](https://forms.gle/hDGsK52sJFqUA2MA7)
- **Committee Formation:** Sub‑teams will be formed shortly; be on the
  lookout for an email from a perspective committee chair with details.
- **Stay Informed:** Regular updates will be posted at
  [us-rse.org/usrse26](https://us-rse.org/usrse26). Please bookmark the
  page and check back frequently for the latest information.

Your continued involvement is essential to the success of USRSE’26. We
look forward to collaborating with you to deliver a vibrant, inclusive,
and impactful conference.

#### 📧 Join Our Mailing List 📧

Want to stay updated on all things US-RSE? Join our mailing list to
receive direct news about all US-RSE conferences. Sign up
[here](https://groups.google.com/a/us-rse.org/g/usrse-conference).

#### 💬 Have Questions? 💬

If you have any questions, feel free to reach out to the organizers at
usrse26-conference@us-rse.org.

#### 📅 Save the Date 📅

More details about the conference program, registration, and travel
information will be coming your way in the months ahead. Stay tuned at
[us-rse.org/usrse26](https://us-rse.org/usrse26)!

We’re looking forward to seeing you all in **San Jose**!

------------------------------------------------------------------------

## 🤝 Organizational Founding Membership 🤝

<a name="orgmember"></a>

<!-- List organizational founding members -->

US-RSE envisions a future where Research Software Engineers are
universally respected for advancing science, technology, and society
through the transformative power of research software engineering. We’re
excited to share that the momentum around our Organizational Founding
Membership continues to grow! See the list below for the current members
(six more are onboarding at the moment).

Organizations that join **on or before June 30, 2026**, will be
recognized in perpetuity as founding members. Founding organizations
will also lock in current membership fees through December 31, 2028.
Organizational support helps sustain and expand vital community
offerings, including the annual conference, monthly calls and
newsletter, job board, working groups, and new resources.

Please reach out to Sandra Gesing at <sandra@us-rse.org> if you are
interested in becoming an organizational founding member!

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

------------------------------------------------------------------------

## 🗞️ Community News 🗞️

<a name="news"></a>

<!--Someone you want to shoutout? DO IT HERE!-->

### **Community Shoutouts**

🥳 Congratulations to members of the RSE community recognized with
[Stanford Data Science
(CORES)](https://datascience.stanford.edu/cores/awards) awards!

- Malcolm Barrett & Alex Koufos : OpenSource@Stanford Community Prize
- Ellianna Abrahams: Open Science Innovator Prize

These awards recognize individuals who have made significant
contributions to open science and data science, and we’re thrilled to
see members of our community being honored for their impactful work!

Additionally, The RAPTOR team from Argonne National Laboratory and
collaborating institutions recently won the SC25 Best Reproducibility
Advancement Award, using Chameleon Cloud to make their artifact fully
reproducible. This marks the second consecutive year a Chameleon user
has taken home this honor!

Read the announcement
[here](https://blog.chameleoncloud.org/posts/sc25-best-reproducibility-advancement-award/).

> Did you know that we have a community Code of Conduct? Anyone is able
> to view it in the `#code_of_conduct` Slack channel, under `Files`!

### In Memoriam

We mourn the loss of a dear friend and colleague, Cleve Moler, who
passed away on May 20, 2026, at the age of 86 at his home surrounded by
his family. Cleve was chief mathematician and cofounder of MathWorks and
the author of the first version of MATLAB. Please join us in remembering
their contributions to science and engineering by reading Mathworks
official announcement
[here](https://www.mathworks.com/company/aboutus/founders/clevemoler.html).

## Community Spotlight

🌱 Our community is full of people doing fascinating research and
software work, and we want to put a face to it. Starting this month,
we’ll be featuring a group of different members in a regular spotlight:
what they work on, a tool they can’t live without, and how they found
their way into RSE work.

We’d love to feature YOU. It takes about 5 minutes to fill out, and
nothing gets posted without your okay:
<https://forms.gle/dXqVsHKiHnot2u449>

Email [Pengyin Shan](mailto:pengyins@illinois.edu) for any questions!

### **Community Calls**

<!--Community call news goes here-->

<!-- Add a link to the recording of the call if available 
**TBD last call**
<div style="position: relative; width: 100%; max-width: 640px; margin: 0 auto; overflow: hidden; background: #000; aspect-ratio: 16 / 9;">
  <img src="" 
       alt="YouTube Video Thumbnail" 
       style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; cursor: pointer;" 
       onclick="this.outerHTML='<iframe width=\'640\' height=\'360\' src=\'\' title=\'YouTube video player\' frameborder=\'0\' allow=\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\' allowfullscreen style=\'position: absolute; top: 0; left: 0; width: 100%; height: 100%;\'></iframe>'">
</div>
-->

Our next meeting is scheduled for Thursday, July 9, 2026, 12:00PM EST.
We hope to see you there!

------------------------------------------------------------------------

## 👀 Interesting Events and Opportunities 👀

<a name="events"></a>

{% assign today = "now" | date: "%Y-%m-%d" %}
{% for opp in site.data.newsletter-events-opportunities %}
{% assign expires = opp.expires | date: "%Y-%m-%d" %}
{% if opp.type == "opportunity" and expires >= today %}
{% include opportunity-box.html
  title=opp.title
  when=opp.when
  where=opp.where
  preamble=opp.preamble
  links=opp.links
%}
{% endif %}
{% endfor %}

{% for event in site.data.newsletter-events-opportunities %}
{% assign expires_formatted = event.expires | date: "%Y-%m-%d" %}
{% if expires_formatted >= today %}
{% if event.type == "event" %}  
{% include event-box.html 
  title=event.title 
  when=event.when
  where=event.where
  preamble=event.preamble
  links=event.links
%}
{% endif %}
{% endif %}
{% endfor %}

Have an event or opportunity you want to promote? Reach out on Slack in
the `#newsletters` channel!

------------------------------------------------------------------------

## 📚 Featured Reads, Videos, and Podcasts 📚

<a name="reads"></a>

{% assign refs = site.data.newsletter_bib_yml.references 
  | where_exp: "r", "r.annote contains 'Read_Status: To Read'" %}

{% assign professional = refs | where: "type", "article-journal" %}

{% if professional.size > 0 %}
### 📑 Recent Publications
{% for ref in professional %}
{% include citation-publication.html ref=ref %}
{% endfor %}
{% endif %}

{% assign podcasts = refs | where: "type", "motion_picture" %}

{% if podcasts.size > 0 %}
### 🎧 Podcast Episodes
{% for ref in podcasts %}
{% include citation-podcast.html ref=ref %}
{% endfor %}
{% endif %}

{% assign other = refs | where: "type", "webpage" %}

{% if other.size > 0 %}
### 📇 Blog Posts, Videos, & Other Reads
{% for ref in other %}
{% include citation.html ref=ref %}
{% endfor %}
{% endif %}

Did you read something interesting this week? Want to share your own
publications in the community? Reach out on Slack in the `#newsletters`
channel!

------------------------------------------------------------------------

## 🏃 Get Involved! 🏃

<a name="involved"></a>

US-RSE Working Groups:

{% assign wgs = site.data.menus["working-groups"][0].items %}
<ul>
{% for wg in wgs %}
  <li><a href="{{ site.baseurl }}/{{ wg.link }}">{{ wg.name }}</a></li>
{% endfor %}
</ul>

------------------------------------------------------------------------

## 🧑‍💼 Recent Job Postings 🧑‍💼

<a name="jobs"></a>

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

You can learn more about job boards in the `#jobs` Slack channel!

------------------------------------------------------------------------

**This newsletter is a joint effort of members of the US-RSE
Association.**

© US-RSE • 2021–{{ 'now' | date: "%Y" }} • US-RSE is a fiscally sponsored project of [Community Initiatives](http://communityin.org/)

[Email](mailto:contact@us-rse.org) [Mastodon](https://fosstodon.org/@us_rse) [Twitter](https://twitter.com/us_rse) [YouTube](https://youtube.com/@us_rse) [LinkedIn](https://linkedin.com/company/us-rse/) [GitHub](https://github.com/USRSE)
