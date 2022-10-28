---
title: Odd Months Community Call
subtitle:
location: Virtual
expires: 2025-12-11
event_date: "alternating 2nd Thursday (12:00-1:00pm ET) and 2nd Friday (2:00-3:00pm ET)"
layout: event
category: community-call
time:
  - - start: 2022-07-14 12:00 EST

# Repeated events information
repeated: true

# use an rdate string instead (best for complex repeated events)
# note that the dtstart and rdate at the end are the same
rrule:
# second Thursday of every other month
  - DTSTART;TZID=America/New_York:20220714T120000
  - RDATE;TZID=America/New_York:20220714T120000
  - RRULE:UNTIL=20251211T120000;FREQ=MONTHLY;INTERVAL=2;BYDAY=+2TH
---

The USRSE community calls of each odd month (Jan, Mar, May, Jul, Sep, Nov) take place on the second Thursday of the month, 12:00-1:00pm ET on Zoom. Community call topics, agenda and zoom registration announcements are posted to Slack and sent to USRSE email accounts.

Community calls typically have a topical focus. They provide a forum for USRSE members to compare experiences around a topic, hang-out and chat on zoom.

Community calls alternate between the second Thursday (12:00-1:00pm ET) of each odd month and second Friday (2:00-3:00pm ET) of each even month. 

Any and all suggestions for topics are
welcome at [https://github.com/USRSE/monthly-community-calls/issues](https://github.com/USRSE/monthly-community-calls/issues).
Anyone in USRSE is super welcome to lead a call on a topic of their choosing. Feel free to reach out to the organizers (currently Julia Damerow and
Chris Hill) on USRSE slack ( "@Julia Damerow" and/or "@Chris Hill") or elsewhere if you would like to host (or help with) a call.
