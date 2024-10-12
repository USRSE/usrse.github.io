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
candidate_announcements: 2024-11-08 23:59:59 -1000
annual_general_meeting: 2024-12-05 14:00:00 -0500
voting_open: 2024-12-05 14:00:00 -0500
voting_close: 2024-12-13T23:59:59 -1000
election_results: 2024-12-20T00:00:00 +0000
---

{% capture nowunix %}{{'now' | date: '%s'}}{% endcapture %}
{% capture nom_open %}{{page.nominations_open | date: '%s'}}{% endcapture %}
{% if nowunix < nom_open %}
**Elections are open! Please see the "Nominations and Candidate Information"
section to apply for or nominate someone for the US-RSE Steering Committee**
{% else %}
**Elections for the US-RSE Steering Committee are around the corner**
{% endif %}

<hr>

<!-- The 2024 US-RSE Steering Committee elections are happening this December. -->

If you're interested in becoming part of the Steering Committee, we suggest you
have a look at
[Guidance for Potential Steering Committee Candidates](/2022-07-01-candidate-guidance/).


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
  **January 1, 2025**


## Positions and Eligibility

Four Steering Committee seats are open in this election, each for a 2-year term
(January 1, 2025 through December 31, 2027).
The following steering committee members have terms that end this year:
Miranda Mundt, Rinku Gupta, Kenton McHenry, and Julia Damerow.
All US-RSE members in good standing as of the day nominations open are eligible
for nomination. 

The US-RSE Steering Committee sets its own meeting frequency and timing.
Currently, the Steering Committee meets every two weeks on Fridays.
The Steering Committee meeting frequency and schedule for 2025 will be
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
  * Organizing and leading community calls and events
  * Engaging with community members on Slack
* Help further the community by
  * Participating on international RSE committees
  * Organizing BOFs, workshops, meetups, and other events at relevant conferences
  * Leading US-RSE working groups
  * Writing blog posts
  * Bringing new ideas to the organization


## Nominations and Candidate Information

<!-- **[Candidate Information is Available](/2022-11-18-sc-candidates/)** -->

Nominations will open on {{ page.nominations_open | date: "%B %e, %Y" }} and
close on {{ page.nominations_close | date: "%B %e, %Y" }} (see above for more 
details.)

Once nominations open up, interested members are encouraged to nominate themselves.
Alternatively, if you know of a member who you think would make a good
candidate, you can submit a nomination for someone else, who will be invited to run.
All US-RSE members in good standing are eligible to be nominated as candidates.

{% if nowunix <= nom_open %}
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

