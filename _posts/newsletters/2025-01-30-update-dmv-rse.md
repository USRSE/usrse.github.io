---
layout: post
title: January DMV-RSE meetup recap
subtitle: January 2025
category: update
tags: [update, dmv-rse]
---

The second DMV-RSE meetup, broadly centered on RSE Career Development, started strong -- pizza, drinks, and some casual introductory chatter and professional updates. After that, a small but dedicated crowd heard from Dr. Angeline Burrell, a research physicist at the Space Science Division, Naval Research Laboratory.


![DMV-RSE meetup]({{ site.baseurl }}/assets/img/dmv-rse-jan22_1.jpg "The second DMV-RSE meetup was hosted at the Center for Security and Emerging Technology, Georgetown University")


**Promoting (RSE) careers: writing effective recommendation letters.** Not everyone will be called upon to write an effective recommendation letter, but almost everyone will need one at some point. Recommendation letters are an important leverage point in a research scientists' career. But there’s nuance to it: How to make sure to best promote the candidate, but also retain professional integrity and provide a fair assessment? How to make sure the language used does not bias against the candidate's prospects? (hint: use a gender bias calculator: https://slowe.github.io/genderbias/)

**Baby steps, linters, and collaboration: Incentivizing good coding practices in research labs.** The second part of the meetup was centered on publishing research code. How do we incentivize domain scientists to adopt good coding practices (think code versioning, unit testing, and packaging…)? Most research labs don’t incentivize code quality, so do you spend time writing the paper or documenting the codebase? Do you spend time polishing publication-ready figures or writing unit tests?


![DMV-RSE meetup]({{ site.baseurl }}/assets/img/dmv-rse-jan22_2.jpg "Dr. Angeline Burrell gave a talk at the second DMV-RSE meetup")

In practice, Dr. Burrell suggested that the main force that will push towards adoption of these practices is _collaboration_. If researchers know other researchers or labs will depend on their codebase, they will most likely spend additional time on making sure the code runs, is understandable, etc. But even if the incentive is there, how do you adopt the practices on a daily basis? Start small and embrace baby steps. Does your code produce a figure? Write down all the steps that happen such that somebody else can understand it. That's the first version. Call it the alpha version. Did a reviewer require changes to figures and/or analyses? Update the code. Update documentation. Update the code version. Rinse and repeat.

What's the one practice that’s the most efficient in order to start maintaining robust code? In Dr. Burrell's experience that's clear: _code linters_. Start off by making code well formatted. This will make it easier for others to review it. Once that bottleneck is cleared, other changes (refactoring, documenting) are easier to take on.

![DMV-RSE meetup]({{ site.baseurl }}/assets/img/dmv-rse-jan22_3.jpg "Discussing code sharing in research labs")

**Incentivizing via funding: evaluation needs to show some teeth.** Finally, an audience question moved us to more systemic leverage points: how do we incentivize sharing code and data in funding schemes and applications? The first step is to make artifact (e.g. code and data) management plans required. However, this measure alone can and will fail if the evaluation stage shows no teeth and does not directly penalize poorly thought through applications. Attendees experienced in evaluating funding proposals shared their stories of how such watered down evaluation can look like in practice.

All in all, a half-hour presentation led to about an hour long, rich discussion and sharing of RSE experiences among RSEs coming from a diverse set of research environments (National Institutes of health, Naval Research Laboratory, National Labs, National Institutes of Standards and Technology, NASA, private sector...). A few new participants joined the US-RSE Slack, and some of us connected afterwards. Just what this meetup is supposed to do. Next up is a meetup in Spring, stay tuned for details!
