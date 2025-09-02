---
layout: page
title: US-RSE Steering Committee Elections
permalink: /about/election/
menubar: about
menubar_toc: true
set_last_modified: true
nominations_open: 2024-10-11 23:59:59 -1000
nominations_close: 2024-11-01 23:59:59 -1000
membership_deadline: 2024-11-08 23:59:59 -1000
candidate_announcements: 2024-11-08 17:00:00 -0800
annual_general_meeting: 2024-12-05 14:00:00 -0500
voting_open: 2024-12-05 14:00:00 -0500
voting_close: 2024-12-13T23:59:59 -1000
election_results: 2024-12-20T00:00:00 +0000
election_season_start: 2024-09-12
election_season_end: 2025-02-01
---

{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}
{% capture year %}{{'now' | date: '%Y'}}{% endcapture %}
{% capture nom_open %}{{page.nominations_open | date: '%s'}}{% endcapture %}
{% capture nom_close %}{{page.nominations_close | date: '%s'}}{% endcapture %}
{% capture can_ann %}{{page.candidate_announcements | date: '%s'}}{% endcapture %}
{% capture vote_open %}{{page.voting_open | date: '%s'}}{% endcapture %}
{% capture vote_close %}{{page.voting_close | date: '%s'}}{% endcapture %}
{% capture results %}{{page.election_results | date: '%s'}}{% endcapture %}
{% capture season_start %}{{page.election_season_start | date: '%s'}}{% endcapture %}
{% capture season_end %}{{page.election_season_end | date: '%s'}}{% endcapture %}

<!-- Current election status notification section -->
<strong>
{%- if nowunix >= nom_open and nowunix < nom_close -%}
Election process has begun. Nominations are open! Please see the "Nominations
and Candidate Information" section to apply for or nominate someone for the
US-RSE Steering Committee
{%- elsif nowunix >= nom_close and nowunix < can_ann -%}
Nominations have closed! We will be announcing the candidates shortly.
{%- elsif nowunix >= can_ann and nowunix < vote_open -%}
Meet the [2024 Steering Committee candidates](#candidate-information)!
{%- elsif nowunix >= vote_open and nowunix < vote_close -%}
Voting for the US-RSE Steering Committee are now open!
{%- else -%}
Elections for the US-RSE Steering Committee happen near the end of each year
{%- endif -%}
</strong>

<hr>


<!-- Timetime or congratulations section -->
{% if nowunix >= season_start and nowunix < season_end %}
## 2024 Election Timeline

* Nominations open:
  **{{ page.nominations_open | date: "%B %-d, %Y" }}** <!-- Should be link to form once open -->
* Nominations Due Date:
  **{{ page.nominations_close | date: "%A %B %e, %Y at %H:%M (Hawaii)" }}**
* Deadline to [join US-RSE](/join) to be eligible to vote:
  **{{ page.membership_deadline | date: "%B %-d, %Y at %H:%M (Hawaii)" }}**
* Planned Candidate Announcement Date:
  **{{ page.candidate_announcements | date: "%B %-d, %Y" }}**
<!--* [Candidates Announced](/2023-11-10-sc-candidates/): **November 8, 2024**-->
* Annual US-RSE General Meeting, including candidate statements:
  **{{ page.annual_general_meeting | date: "%B %-d, %Y at %H:%M (Eastern)" }}**
* Voting Open:
  **{{ page.voting_open | date: "%B %-d, %Y at %H:%M (Eastern)" }} -
    {{ page.voting_close | date: "%B %-d, %Y at %H:%M (Hawaii)" }}**
* Planned Election Results Announcement Date:
  **{{ page.election_results | date: "%B %-d, %Y" }}**
* Elected Steering Committee members take office:
  **January 1, {{ year | plus: 1 }}**
{% else %}
## Congratulations to the {{ year }} - {{ year | plus: 2 }} Steering Committee Cohort!

- Cordero Core
- Julia Damerow
- Kenton McHenry
- Miranda Mundt
{% endif %}

If you're interested in becoming part of the Steering Committee, we suggest you
have a look at
[Guidance for Potential Steering Committee Candidates](/2022-07-01-candidate-guidance/).


## Positions and Eligibility

{% if nowunix >= season_start and nowunix < results %}
Four Steering Committee seats are open in this election, each for a 2-year term
(January 1, {{ year | plus: 1 }} through December 31, {{ year | plus: 3 }}).
The following steering committee members have terms that end this year:
Abbey Roelofs, Alex Koufos, Ian Cosden, Jeff Carver, and Keith Beattie.
{% endif %}

### Eligibility

Steering Committee (SC) candidates must have a meaningful connection to,
history with, and vested interest in the community of Research Software
Engineers (RSEs) in the United States (US). To ensure that the SC can
effectively advocate for and address the needs of the RSE community in the
US, candidates must have a demonstrated history of engagement within US-RSE.

Candidates must both live in the US and be affiliated with or retired from
a US entity or self-employed. Exceptions to the residency and affiliation
requirement will be considered on a case-by-case basis.

The exception process will be led by the two Election Chairs who will create
a subcommittee that includes several other members of the US-RSE community.

### Responsibilities

The US-RSE Steering Committee sets its own meeting frequency and timing.
Currently, the Steering Committee meets every two weeks on Fridays.
The Steering Committee meeting frequency and schedule for {{ year | plus: 1 }} will be
determined once new members are elected.

The responsibilities of Steering Committee members are detailed in the
[US-RSE Membership and Governance](https://github.com/USRSE/documents/blob/master/governance.md)
document.
They include:

* Setting the overall policy and direction of the US-RSE Association
* Being responsible for day-to-day activities, operations, and development of the US-RSE Association

Additionally, Steering Committee members are expected to:

* Attend and participate in Steering Committee meetings
* Follow and participate in Steering Committee discussions on Slack
* Contribute to US-RSE operations through activities such as
  * Updating the website
  * Writing newsletters and communications
  * Organizing and leading community events
  * Engaging with community members on Slack
* Help further the community by
  * Participating on international RSE committees
  * Organizing BOFs, workshops, meetups, and other events at relevant conferences
  * Leading US-RSE working groups
  * Writing blog posts
  * Bringing new ideas to the organization


## Nominations and Candidate Information

{% if nowunix >= season_start and nowunix < season_end %}
Nominations will open on {{ page.nominations_open | date: "%B %e, %Y" }} and
close on {{ page.nominations_close | date: "%B %e, %Y" }} (see above for more 
details.)
{% endif %}

Once nominations open up, interested members are encouraged to nominate themselves.
Alternatively, if you know of a member who you think would make a good
candidate, you can submit a nomination for someone else, who will be invited to run.
All US-RSE members in good standing are eligible to be nominated as candidates.


<!-- Nomination form and candidates section -->
{% if nowunix >= season_start and nowunix < season_end %}
  {% if nowunix >= nom_open and nowunix < nom_close %}
### Nomination Form

The nomination form can be found [HERE](https://docs.google.com/forms/d/e/1FAIpQLSdymmrCfE3QgKmeOmPUSeaDhEEG2z0adxfmiNGHbO3C6nv1YA/viewform). Please fill this form for self-nomination OR if you are nominating someone else.
If nominating someone else, then please fill the form early so that we can
contact the nominated person and obtain their nomination materials before the
nominations due date of November 01, 2024.

On the nomination form, expect to provide the following information.

**If Nominating Someone Else:**
* Your name and email
* Nominee's name and email
* Short statement about why you think the nominated individual will make a good Steering Committee member

Nominations of others will only be shared with the Election Chairs and the
nominated individual.
The Election Chairs will contact the nominated individual to let them know they
were nominated, and by whom, and to confirm their interest in participating.
The information will not be made public.

**Self-nomination or Accepted Nomination:**

* Your name and a publicly-shareable email
* A link to a resume, CV, LinkedIn profile, or professional website
* Why do you want to be on the US-RSE Steering Committee? (<=1000 characters)
* How do you contribute to the US-RSE Association or RSE community more broadly? (<= 1500 characters)

All candidate information will be shared on the US-RSE website.
Additionally, candidates will have a chance to share information about
themselves at the Annual General Meeting on December 6, 2024.

An [#election channel is available on Slack](https://usrse.slack.com/archives/C01BC66Q16E)
for any discussion with or about candidates.

  {% elsif nowunix >= nom_close and nowunix < can_ann %}
### Nomination Form

Nominations are now closed. We will be announcing the candidates soon!

  {% elsif nowunix >= can_ann %}
### Nomination Form

Nominations are now closed and our candidates for next cycle can be found below.


### Candidate Information

Candidates are listed in alphabetical order.
- Anees Ur Rahman
- Chen Zhang
- Cordero Core
- Daniel Madren
- Julia Damerow
- Kenton McHenry
- Lezlie Espana
- Miranda Mundt
- Sujata Goswami

More information about the candidates can be [found here](/2024-11-08-sc-candidates).

  {% endif %}
{% endif %}


## Voting

If there are more candidates than seats available, an election will be held.  

Elections will be run through https://electionbuddy.com.
US-RSE members' email addresses will be shared with this site for the sole
purpose of voting.
Each US-RSE member as of
{{ page.membership_deadline | date: "%B %-d, %Y at %H:%M (Hawaii)" }},
gets one ballot with the voting rule of
[single transferable vote (STV)](https://electionbuddy.com/features/voting-systems/stv-voting).
This voting rule asks each voter to rank the candidates, and seats are allocated
across candidates using this ranking information.

The results of the election are valid regardless of the turnout rate for the
election.


## Questions?

Contact Election Chairs on Slack or email:
- [Alex Koufos](mailto:akoufos@stanford.edu)
- [Keith Beattie](mailto:ksbeattie@lbl.gov).

