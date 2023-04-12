# Adding Events

You can add an event or training to the site by adding a markdown file in the [_events](_events)
folder, organized by year. 

Events are displayed at https://us-rse.org/events

You can use the [add an event form](https://docs.google.com/forms/d/e/1FAIpQLSda4-gAKyVA1GhJZg3XZmc9EDLaf5Donlm1HKG6r8ve9ooiRQ/viewform) instead if you don't know how to submit a PR. 

## Naming the File

Do not use the full date (e.g. YYYY-MM-DD-<event-name>.md) in the file name,
Jekyll will not post pages that it interprets to have a future date in the filename. Use a partial date (e.g. YYYY-MM-<event-name>.md or YYYY-<event-name>.md). 

## Header information

Here is an example of a file in `_events/2019` for PEARC19:

```markdown
---
title: PEARC19
location: Chicago, IL
expires: 2019-08-01
duration: 45
category: workshop
event_date: "July 29, 2019"
layout: event
repeated: false
time:
    - - start: 2019-07-29T21:15:00Z
        end: 2019-07-29T22:00:00Z
---

Join us at [PEARC19](https://www.pearc19.pearc.org/) for a Birds of a Feather (BOF) session "Building a Community of Research Software Engineers."  Our session is scheduled for 5:15 PM on Monday, July 29.
```

* title: Keep it brief to display at the top of the event card
* location: optional, can leave blank for online events
* expires: usually the day of the event, YYY-MM-DD
* duration: time in minutes, used for calendar export; defaults to 60
* category: see [_data/events.yaml](_data/events.yaml) - use the tag (e.g. dei, virtual-workshop), name is the display name on the page for the tag
* event_date: display text for the date, specific format not required (not displayed in all contexts, so don't rely on it)
* layout: "event"
* repeated: true or false
* time: the format is very specific; times should be in UTC


## Content

The bottom section (the content) you can write any amount and length
of markdown that is desired. When the event is active (before expiration) the full content will
be shown on the "Events and Training" page. Once it expires, it will move into the events archive.
In both cases, clicking on the Event will take the viewer to its page, and they can
view additional content and the url provided. In the case of the archive, the bulk of content
is only viewable on this page.

It's helpful to write out a listing of timezones in the content, e.g.,:

```md
The next community call will be on August 12, 2021 at 12ET/11CT/10MT/9PT.
```

## Troubleshooting/Special Cases

### Why isn't my event showing up?

Check the file name.  If you use a full date in the markdown file name (e.g. YYYY-MM-DD-<event-name>.md)
Jekyll is going to see this as a post. By default Jekyll does not show posts in the future, so unless you are adding an event in the past, it isn't
going to show up. Try renaming your file to something with a year and month partial date such as (e.g. YYYY-MM-<event-name>.md).



### How do I add an all day event?

All day events render as a solid block (strip) on the calendar, and you can use similar syntax to the above but add `all_day: true`.
You don't need to include an end time, but you do need to include a "start" with a date. Here is an example:

```
---
title: An Annual Event
event_date: "October 14, 2021"
layout: event
repeated: true
category: virtual-workshop
all_day: true
time:
    - - start: 2021-10-14
---

Here is information about my annual event!
```

If you need it to span multiple days, add multiple starts.

```yaml
---
...
time:
    - - start: 2021-10-14
    - - start: 2021-10-15
---
```

### What is a repeated event?

You'll notice that there is a folder called "repeated" in the events folder:

```
$ ls _events/
2019  2020  2021  repeated
```

A repeated event is one that happens weekly, monthly, or on a regularly scheduled
basis that typically does not change, meaning that you wouldn't need to
update the post. A weekly call that has a description and a consistent link
to an agenda would be appropriate, while the same call that varies in schedule
or requires an updated description would not quality.
An annual event, or one that would require a different description, would
not be repeated, and should be placed in a folder named by date.
As an example, here is a yearly event that happens on the same month and day:

```yaml
---
title: International RSE Day
event_date: "October 14, 2021"
layout: event
category: virtual-workshop
all_day: true

# Repeated events metadata
repeated: true
interval: 1
frequency: "yearly"
date_start: "2021-10-14"
until: 2030-10-14
time:
  - - start: "2021-10-14"
---
```

Note that this format is recommended only for easy repetitions. Also
note that not all [rrule](https://jakubroztocil.github.io/rrule/) fields are rendered to the template, so you should check the calendar.html template
to see what is supported (view source) or the [_includes/events/event.js](_includes/events/event.js)
for the logic. If you need to, for example "repeat on the first tuesday of every month" you should use an rdate string 
instead. Here is an example:

```yaml
---
...
layout: event
time:
  - - start: 2021-01-04

# Repeated events information
repeated: true

# use an rdate string instead (best for complex repeated events)
# note that the dtstart and rdate at the end are the same
rrule: 
  - DTSTART;TZID=America/New_York:20210104T113000
  # first tuesday of every month
  - RRULE:UNTIL=20220731T080000;FREQ=MONTHLY;BYDAY=+1TU
  - RDATE;TZID=America/New_York:20191014T153000
---
```

The formatting of the lines above is essential - even putting them out of order
or exchanging a semicolon can lead to the entire interface breaking. 

To derive your string, you can play around with the 
plugin that we use to generate this [here](https://jakubroztocil.github.io/rrule/).


### Why isn't my add to calendar button showing up?

Adding to the calendar isn't currently supported for repeating events - the reason
being that we can't reliably render the repetitions in the code to generate the button.
If anyone would like to work on this, please [post on this issue](https://github.com/USRSE/usrse.github.io/issues/558) or (better) just go for it :)

