---
layout: post
title: Highlights from the December 2021 Community Call on Constructive Code Review
tags: [community call, code review, training]
posted_by: David Nicholson
---

Last week, US-RSE held its monthly community call.
For a topic, we chose "Conducting Constructive Code Reviews", as
[suggested on GitHub](https://github.com/USRSE/monthly-community-calls/issues/9#issuecomment-921989398).
Judging from the number of new faces that registered for the call,
the US-RSE commmunity is very interested in this topic.

We'd like to share a couple of highlights from the call.
If these highlights whet your interest, then the
[video is already up on YouTube for you to watch](https://www.youtube.com/watch?v=0vdfNojvlck).
We've also provided
[a link to notes](https://bit.ly/US-RSE-Dec-CC-Breakout)
from the discussion in the breakout rooms.
If you don't watch anything else, you can at least
get a quick update on news from Ian Cosden,
and check out responses to Chris Hill's
Mentimeter poll asking attendees
what else they'd like to get the
newly updated US-RSE logo on, after the
[US-RSE 2021 Winter T-Shirt campaign](https://www.customink.com/fundraising/us-rse-2021?side=front&type=3&zoom=)
comes to an end. (Spoiler alert: "Mugs" was a popular choice.)

## Lightning talks

After news and the Mentimeter poll,
the call moved on to the discussion topic.
David Nicholson got things started
by talking about how recently there has been growing interest in code review for RSEs.
He mentioned the
[Research Code Review Community](https://github.com/ResearchCodeReviewCommunity)
and the Software Saved Institute's
[Collaborations 2022 Workshop](https://esciencelab.org.uk/announcements/projects/2021/10/29/ssi-collaborations-workshop-2022/)
where code reviews in research software will be one of the themes.
Then David introduced two lightning talks
that would help guide community discussion in the breakout rooms.

The [first talk](https://youtu.be/0vdfNojvlck?t=645)
from [Jeff Carver](http://carver.cs.ua.edu/)
provided a crash course in constructive code reviews,
answering a couple of key questions:
* What are the some of the goals of doing code review?
* How should I approach the review if I'm the one submitting code,
  or if I'm reviewing someone else's code?

In the [second talk](https://youtu.be/0vdfNojvlck),
[Pat Schloss ](http://www.schlosslab.org/)
introduced the idea of
[Code Clubs](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008119#sec009),
which he developed in his research group
to achieve many of the same goals of code review,
such as knowledge sharing.

Interestingly, both Jeff and Pat made points
about how reading code, reviewing others' code,
and getting feedback on how we write code
can fill some of the gaps
left in traditional computer science education.
The traditional approach
often encourages students to learn by writing, not reading.
David pointed out that Greg Wilson
had shared, in the US-RSE Slack, the book
["The Programmer's Brain"](https://www.manning.com/books/the-programmers-brain)
that makes similar observations about how
coding is taught,
and describes methods for improving reading comprehension.

## Breakout room discussion

Then the attendees entered the breakout rooms to discuss.
Each group took notes, and then
came back to the main room at the end of the call
[to report out](https://youtu.be/0vdfNojvlck?t=1575).
One common idea across groups was
that of automating as much as possible---with
linters and continuous integration, for example---so that
high-bandwidth face-to-face code review
could focus on big-picture planning.
At the same time, many RSEs were working
in situations where this one-size-fits-all approach
did not lend itself to review: e.g.,
a group with two main developers, where
undergraduate CS students make
limited contributions that require very specific,
tailored recommendations such as "Add a comment here".

## Future community calls

The range of responses from the breakout rooms
suggest that code review will continue to be a topic
of interest for US-RSE and the global RSE community.
One aspect of code review that was not addressed
in this community call is whether
good practices as they are currently understood
can realistically be put into practice by all RSEs.
A "lone wolf" developer or a
single scientist writing analysis code in a small lab 
may not have access to a local community of
software engineers that they can turn to for review.
Could US-RSE help address this
by providing some sort of virtual community?
These accessibility issues could be a topic for a future call.
Please feel free to suggest other topics
that may be of interest to you on the repository we've set up:
<https://github.com/USRSE/monthly-community-calls>.
