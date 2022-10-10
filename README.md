# The United States (US) Research Software Engineer Association

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-64-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## What is this?

This is a repository that containers the files for the official US RSE community website hosted at https://us-rse.org.
The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub. 

## How do I contribute?

We encourage the community to contribute to the content of the website.  
To do this: fork the repository, make your proposed changes, test locally (see below), and then create a pull request
against `main`. For more details about opening pull requests and issues, see our [Contributing Guide](.github/CONTRIBUTING.md).

### 1. How do I update the map?

The [map](https://us-rse.org/usrse-map/) is generated programmatically from the US-RSE member list, so if you
have already [joined](https://us-rse.org/join) and provided your institution,
you should be represented on it. If you see any issues or errors with location
lookup (we use geolocation of a named location) please [open an issue](https://github.com/USRSE/usrse-map/issues).

### 2. How do I add a job?

We maintain a list of current and previous job
postings in [_data/jobs.yml](_data/jobs.yml) and
[_data/related-jobs.yml](_data/related-jobs.yml).  If a job posting
is not clearly an RSE role but is sufficiently adjacent to RSE that
some RSEs would be qualified and potentially interested, place it in
[_data/related-jobs.yml](_data/related-jobs.yml).
You can add a new job to these lists, and so that newer jobs appear at the
top of the corresponding section, we ask that you **add the new entry
to the top of the list.**
Specifically, we ask that you provide a name, location (can be Remote), an expiration date, and a url to the posting.
The expiration date is not shown on the page, however it will determine when the job doesn't appear 
anymore. We suggest setting a timeframe such as a month, and if you want to extend it, you
can open a pull request to update the date. An example posting is shown below. This
job would appear on the site until the first of July, 2019.

```yaml
- expires: 2019-07-01
  location: 'Princeton, NJ'
  name: 'Research Software Engineer'
  posted: 2019-02-01
  url: 'https://main-princeton.icims.com/jobs'
```

And don't forget to write your new job at the top of the appropriate file!
For testing, we look to see that all fields are defined, the url exists, and
that the "expires" and "posted" fields load as a `datetime.date` object in
Python. If you copy the format above, you should be ok.

Once your job(s) are merged to `main` a [GitHub Action](.github/workflows/jobs-poster.yml) will automatically
cross-post your job(s) to the USRSE Slack `#jobs` channel!
*NOTE:* jobs added in the "Related" section are not posted to Slack or Twitter.

![example post image](https://raw.githubusercontent.com/rseng/jobs-updater/main/img/example.png)

### 3. How do I add an event?

You can add an event or training to the site by adding a markdown file in the [_events](_events)
folder, organized by year. Do not use the full date (e.g. YYYY-MM-DD-<event-name>.md) in the file name,
Jekyll will not post pages that it interprets to have a future date in the filename. A better option is
to use a partial date (e.g. YYYY-MM-<event-name>.md). Here is an example of a file in `_events/2019` for PEARC19:

```markdown
---
title: PEARC19
location: Chicago, IL
url: https://www.pearc19.pearc.org/
expires: 2019-08-01
duration: 45
category: workshop
event_date: "November 17–22, 2019"
layout: event
repeated: false
time:
    - - start: 2019-07-29T21:15:00Z
        end: 2019-07-29T22:00:00Z
---

Join us at [PEARC19](https://www.pearc19.pearc.org/) for a Birds of a Feather (BOF) session "Building a Community of Research Software Engineers."  Our session is scheduled for 5:15 PM on Monday, July 29.
```

The top section is frontend matter that must include the title, location, url, layout as "event" 
event date, an expiration date, a time, and a "repeated" variable (true or false).
The duration should be in minutes, and is for the calendar export. If you leave it blank, a default (1 hour) is typically used.
Notice that the event date is a string that doesn't get parsed, while the expires must be a date in the format shown.
Importantly, the time should be formatted as shown above, and should be in UTC time, which is 4 hours later than Eastern.
So for the event above, 5:15PM Eastern time corresponds to UTC 21:15. We get this by converting 5:15 to a 24 hour clock (17:15) and
then adding 4 (17:15 + 4:00 = 21:15). You should preview your page to make sure that the time zone is rendering as you'd expect,
and it's also helpful to write out a listing of timezones in the content, e.g.,:

```md
The next community call will be on August 12, 2021 at 12ET/11CT/10MT/9PT.
```

This is helpful because people in the community come from many different time zones and also travel,
and it's nice to quickly see the mapping for other time zones that are close by.

The bottom section (the content) you can write any amount and length
of markdown that is desired. When the event is active (before expiration) the full content will
be shown on the "Events and Training" page. Once it expires, it will move into the events archive.
In both cases, clicking on the Event will take the viewer to its page, and they can
view additional content and the url provided. In the case of the archive, the bulk of content
is only viewable on this page.

#### Why isn't my event showing up?

Uh oh, you didn't follow the naming conventions! If you use a full date in the markdown file name (e.g. YYYY-MM-DD-<event-name>.md)
Jekyll is going to see this as a post. By default Jekyll does not show posts in the future, so unless you are adding an event in the past, it isn't
going to show up. Try renaming your file to something with a year and month partial date such as (e.g. YYYY-MM-<event-name>.md) and it will show up.

#### What are the categories of events?

It's suggested to look in [_data/events.yaml](_data/events.yaml) for the most up to date categories. Suggestions are:

 - dei: Diversity, Equity, and Inclusion
 - community-call: Community Calls
 - careers: Careers    
 - virtual-workshop: Virtual Workshop
 - conference: Conferences
 - workshop: Workshops
 - association-meeting: US-RSE Annual General Meeting and similar association-wide meetings
 - election: Steering committee election deadlines
 - education-training: Education and training events
 - community-learning: Community learning
 - outreach: Outreach events
 - funder: Funders Talk series
 - social: Miscellaneous social events

#### How do I add an all day event?

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

If you need it to span multiple days, just add multiple starts.

```yaml
---
...
time:
    - - start: 2021-10-14
    - - start: 2021-10-15
---
```

#### What is a repeated event?

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

Note that this straightforward format is recommended only for easy repetitions. Also
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
or exchanging a semicolon can lead to the entire interface breaking. It took me (@vsoch)
two instances of testing and changing library versions, formatting, and setup to finally
get this working. To derive your string, you can play around with the 
plugin that we use to generate this [here](https://jakubroztocil.github.io/rrule/).


#### Why isn't my add to calendar button showing up?

Adding to the calendar isn't currently supported for repeating events - the reason
being that we can't reliably render the repetitions in the code to generate the button.
If anyone would like to work on this, please [post on this issue](https://github.com/USRSE/usrse.github.io/issues/558) or (better) just go for it :)

### 4. How do I add a community document?

A community document is a living document that represents a community effort
to discuss a question or idea. We call it "living" because we encourage community
members to edit and contribute to the documents over time, and so there isn't
a "publish" date associated with it. For this reason, we use [the wiki](https://github.com/USRSE/usrse.github.io/wiki) associated
with the repository here. 

![assets/img/usrse-book-small.png](assets/img/usrse-book-small.png)

If you ever need to clone this content, you can do:

```bash
$ git clone https://github.com/USRSE/usrse.github.io.wiki.git
```

NOTE: During the testing phase of the living documents, we currently plan for the wiki to only be editable by community (repository)
members.

#### How do I edit an existing document?

To edit a living document that already exists, you can browse the [wiki](https://github.com/USRSE/usrse.github.io/wiki) to find it and then update it. Generally, we are organizing topics as they are added, so if you want to add a new category or change the existing organization, please do so. 

#### How do I start a new document?

If you want to add a new document, while you might add it directly to the wiki, it's recommended to get others
involved first. You can ping others in the USRSE slack to contribute, and it's also recommended to start the document as a Google
Document for easier commenting and editing, and then move to the wiki when it's in a final first draft state. 
For all community documents, the following points apply:

1. It's strongly suggested to first work on your document in Google Docs or similar, where you can bring in multiple community members to put together a first draft. Importantly, you should make sure that the content adheres to the US-RSE [Code of Conduct](https://us-rse.org/code-of-conduct/). It is suggested that you have discussion and work on the document with at least two other community members before submitting the document to the wiki. You should feel that it's in a solid "first draft state" before doing a submission.
2. Make sure that you verify the following:
 - the content is of interest to the RSE community
 - the content does not violate the Code of Conduct. 
  
  _NOTE_: Any material added to the wiki that does not follow these rules is subject to removal. If you see content on the wiki that is not appropriate or otherwise breaks these rules, please open an issue on the repository immediately, or contact the steering committee.

If you want to start a community document and would like some help or to talk with
others, we encourage you to post on the US-RSE slack or write an issue here.

### 5. How do I add a page redirect?

We have a special header field that you can define if you want a page to redirect 
elsewhere. We do this by way of a meta tag, and we give the viewer 2 seconds
to see a message that they are being redirected.  To keep these pages
organized, we have them located in the `redirects` folder:

```
$ ls pages/redirects/
2020-april-workshop.md
```

And the header front end matter should look like the following:

```yaml
---
layout: page
title: US-RSE Community Building Workshop
permalink: /2020-april-workshop/
redirect: https://us-rse.org/first-community-workshop
---
```

The above says that the page titled "US-RSE Community Building Workshop" served
at permalink /2020-april-workshop will be redirected to 
https://us-rse.org/first-community-workshop.


### 6. How do I embed a video?

If you have a YouTube video to embed, we have an include that will make it easy
to embed a full width, fullscreen enabled video! Simply do:

```
{% include youtube-embed.html url="https://www.youtube.com/embed/gP5UCfV3n-A"  title="Video Title" %}
```

Where the url should be the embed URL that is provided to you when you click to share
and then embed (note that "embed" is in the url) and the title is a title of your
choosing. You are not required to include a title, and it will default to a generic
"YouTube video player."

### 7. How do I add a "Last Modified:" date?

All of our pages come ready to go to add a "last modified" date, which will default to the bottom
right of the page. This means to add a last modified date to a page, simply update the frontend matter as follows:

```yaml
set_last_modified: true
```

If you want to change the default div id (e.g., adding your own html div with a specific ID and not using the default
provided) you can add that too:

```yaml
set_last_modified: true
last_modified_id: last-modified
```

And finally, if the repository you are retrieving the file from is different than the repository here, define the repository
and path (relative to the root) 

```yaml
set_last_modified: true
last_modified_id: last-modified
last_modified_repo: USRSE/documents
last_modified_path: governance.md
```

If you have any questions, please don't hesitate to [open an issue](https://github.com/USRSE/usrse.github.io)

## Tests

Tests are run during continuous integration to catch any errors and to preview
content. Specifically, usrse.github.io uses the following integrations (with links
to configuration files):

 - [CircleCI](.circleci/config.yml) previews the site, and tests jobs and mapdata
 - [GitHub CI](.github/workflows) includes GitHub triggers and actions

Instructions for running locally, along with details about each, are provided below.

### CircleCI

CircleCI is the primary means to preview a pull request, as the site is built and available
for preview as an artifact. Additionally, the jobs and map data is tested (details below).
There are no credentials or secrets required for this setup, other than the repository
needing to be connected to CircleCI, and under settings:

 - build forked pull requests should be on
 - cancel redundant builds is suggested
 - workflows should be enabled

If you want to edit any of the tests, you should edit [config.yml](.circleci/config.yml).
Details about running tests locally are included below. This can be good to do if you
change an input file in [_data](_data) and want to test it.

#### 1. Test Jobs

Jobs are tested for correctness, meaning that all fields are entered, a date string
is entered for the "expires" field, and the url is valid. You can run tests locally 
like:

```bash
$ cd tests
$ python -m unittest test_jobs
```

### 2. Count Jobs

A [script](scripts/count_jobs.py) is provided that will clone the repository
to a temporary directory, find all commits with a changed job file,
and then checkout and read each commit to get the jobs present for that time.
We then use the title and url for the job as a unique identifier to determine
if the job has been seen. A job with the same name and url, and thus the same
unique identifier, is considered the same job. You can run this script
as is if you just want to derive counts:

```bash
$ python scripts/count_jobs.py
Cloning repository https://github.com/USRSE/usrse.github.io
Found 43 commits for _data/jobs.yml
Found a total of 35 unique jobs across 43 commits.
```

or you can add an output file to save the compiled job content to file

```bash
$ python scripts/count_jobs.py all-jobs.yml
Cloning repository https://github.com/USRSE/usrse.github.io
Found 43 commits for _data/jobs.yml
Found a total of 35 unique jobs across 43 commits.
Saving to output file /home/vanessa/Desktop/Code/usrse/usrse.github.io/all-jobs.yml
```

The repository is always cleaned up, and the parsing done separately from the
script.

#### Previewing the Site

To preview the site on CircleCI, after it finishes building, make sure you are logged in
and following the repository, and then click on the "Artifacts" tab. You can select the static
file to open and preview in your browser.

To preview the site locally, you'll need to [install jekyll](https://jekyllrb.com/docs/installation/)
It's then typical to go to the root of the site and issue (just once):

```bash
$ bundle install
```

And then (also in the top level directory of your forked repository) run 

```bash
$ jekyll serve
# or
$ bundle exec jekyll serve
```

and open your browser to <http://localhost:4000>.
If you are having trouble try `rm -rf _site`, followed by `bundle update`, then `bundle exec jekyll serve`.

#### Rakefile

A legacy [Rakefile](Rakefile) is kept with the repository to allow for a manual `rake test`
to use the html-proofer to check links.

This was previously deployed on TravisCI, however it was very buggy and failed often
since the checker had [no concept of retry](https://github.com/USRSE/usrse.github.io/issues/171). 
While the travis instruction has since been removed, you can look at the old configuration
file [here](https://github.com/USRSE/usrse.github.io/blob/9353d147adefcd4e5c2f5ba1e05c0ee7b28dba23/.travis.yml) 
in a previous commit. To run this previous test locally on your own you can do:

```bash
$ rake test
```

This has been replaced by the "URLChecker" in GitHub CI, which does have retry and other
nice features to make it less error prone, discussed next.


### GitHub CI

#### URLChecker and Spelling

The [URLschecker](https://github.com/urlstechie/URLs-checker) is a GitHub action
that @vsoch worked on to contribute retry and some other nice features for the 
repository here. These features are available as of version 0.1.6 that is used
in the [workflow](.github/workflows/urlchecker.yml). In addition, @vsoch found
a Rust tool called [crate-ci/typos](https://github.com/marketplace/actions/typos-action)
and contributed an equivalent action so all posts and pages are spell checked.
If your CI fails, the spelling suggestions will be shown and you can manually
update the mistakes, or [install typos](https://github.com/crate-ci/typos#install) 
and have all errors fixed automatically:

```bash
typos ./pages ./_posts ./README.md --write-changes
```
If there is a word that needs to be ignored, see [instructions](https://github.com/crate-ci/typos#false-positives) 
for adding a `_typos.toml` file to indicate false positives.

#### Clean Expired Jobs

The workflow [clean-expired-jobs.yml](.github/workflows/clean-expired-jobs.yml) is run nightly,
and uses the same function from the urlchecker to check for expired links in jobs.yml,
and given an expired link, remove it from the file if the url check fails. In the case
that a link is not expired and the check fails, we would want to know about this
(and the test will fail). For all jobs, we don't remove them immediately upon expiration -
we give the submitter 60 days to possibly update the data file with a later expiration date.

#### Post New Jobs to Slack

The workflow [jobs-poster.yaml](.github/workflows/jobs-poster.yaml) is run on any push
to `main` with changes to `_data/jobs.yml`. If new jobs are found, it will post the Job URL to
the USRSE Slack `#jobs` channel. It utilizes the [Jobs updater](https://github.com/rseng/jobs-updater)
Github Action by @vsoch and @jhkennedy to parse the `_data/jobs.yml` file for new jobs and post them
the USRSE Slack. For the action:

 - unique: determines the field in the jobs.yml that determines uniqueness (defaults to url)
 - keys: a comma separated list of fields to include. All except for url will have a prefix, so it's recommended to put the url last.

The other fields are intuitive. Example output (in the console that might go to Slack or Twitter)
for a few jobs (done in the testing repository) looks like the following:

```
New Job! 🕶️
Name: Data Engineer & Full Stack Software Engineer
Location: Scoot Science - remote in the US or Canada
https://www.scootscience.com/careers/

New Job! 🔥️
Name: Assistant Research Programmer/Research Programmer/Senior Research Programmer
Location: National Center for Supercomputing Applications / University of Illinois, Urbana, IL
https://jobs.illinois.edu/academic-job-board/job-details?jobID=130370&job=research-programmer-national-center-for-supercomputing-applications-130370

New Job! 🤖️
Name: Assistant Research Programmer/Research Programmer/Senior Research Programmer
Location: National Center for Supercomputing Applications / University of Illinois, Urbana, IL
https://jobs.hr.wisc.edu/en-us/job/510571/researcher

New Job! 👉️
Name: Assistant Research Programmer/Research Programmer/Senior Research Programmer
Location: National Center for Supercomputing Applications / University of Illinois, Urbana, IL
https://jobs.ornl.gov/job/Oak-Ridge-Full-Stack-Software-Engineer-TN-37830/793411000/
```

#### Post New Jobs to Twitter

The same workflow [jobs-poster.yaml](.github/workflows/jobs-poster.yaml) has a follow-up
step that uses output from the [Jobs updater](https://github.com/rseng/jobs-updater) to then
make these same posts on Twitter. In order for this work, using the account that you want to tweet from,
you should sign into the [developer portal](https://developer.twitter.com/en/portal/) and make a new project
that describes the goal of US-RSE, e.g.,:

> We (the United States Research Software Engineer Association) use Twitter to get a broad reach to people working on software in academia - to support community spirit and growth. We currently have a jobs board on our website that populates from GitHub, and will reach more potentially interested people in our community by posting new jobs (as they are merged in a workflow) from a GitHub workflow.

For the use case, you can choose "making a bot" and the title for the project can be anything you like.
Importantly, once you create the bot you'll need to add the following secrets to your GitHub repository:

 - TWITTER_ACCESS_TOKEN: is the key/token created for the user account
 - TWITTER_ACCESS_SECRET: is the secret created for the user account
 - TWITTER_CONSUMER_API_KEY: is the main key for the developer app
 - TWITTER_CONSUMER_API_SECRET: is main secret for the developer app
 
Yes, this means that the tokens are specific to this account.

#### Greetings

This simple greetings action greets first time users (for issues).
The logic of this is determined by the [greetings.yml](.github/workflows/greetings.yml)
workflow. 

#### Member Counts

Two scripts help to create a branch with an updated [member counts file](_data/memberCounts.csv)
that starts with the prefix `update/member-counts`. The workflow [member-counts.yaml](.github/workflows/member-counts.yaml) will generate an updated file and commit and push to a new branch, and it uses [pull-request.sh](scripts/pull-request.sh) to then open a PR with the new branch to the repository. For GitHub CI, there are currently no secrets or credentials, and no setup is required - having actions enabled for the repository and placing the file under `.github/workflows`
enables it.

### Frequently Asked Questions

> Why do we use different services?

Using multiple "free tier" CI services is a common thing for open source projects to do.
There are several reasons to do this:

 1. we can better leverage a free tier, meaning a maximum number of jobs run in parallel or minutes per month by spreading work over multiple services. 
 2. we can scope a particular kind of test to a service. For example, one service might just be to test the core software, another might be to build and deploy containers, and a third might be to preview a site.
 3. each CI service offers unique features. For example, GitHub has the closest integration with the repository here, and CircleCI allows us to preview artifacts.

## Feeds

Added in early 2022, we wanted an ability to provide easy ways to automate specific events, or subscribe
to them. For the reason, we added [pages/feeds](pages/feeds) which includes:

 - rss feeds for different kinds of content
 - equivalent json feeds for the same.
 
The rss feeds are intended to be subscribed to by an appropriate service, while the json API is
more suitable for a client tool.

### RSS (xml) Feeds:

For each RSS feed, we provide the latest 100 items.

 - [https://us-rse.org/feed.xml](https://us-rse.org/feed.xml): subscribe to posts on the US-RSE site
 - [https://us-rse.org/feeds/events.xml](https://us-rse.org/feeds/events.xml): subscribe to US-RSE events, including descriptions, locations, times, publication date, and categories (e.g., working groups or content types).
 - [https://us-rse.org/feeds/newsletters.xml](https://us-rse.org/feeds/newsletters.xml): subscribe to a subset of newsletter posts
 - [https://us-rse.org/feeds/dei.xml](https://us-rse.org/feeds/del.xml): subscribe to DEI working group events
 - [https://us-rse.org/feeds/jobs.xml](https://us-rse.org/feeds/jobs.xml): subscribe to latest non-expired jobs
 - [https://us-rse.org/feeds/member-counts.xml](https://us-rse.org/feeds/member-counts.xml): subscribe to monthly member total counts

### Json Feeds:

JSON feeds are not limited in number, and we can provide this until a single page is not reasonable to load.

 - [https://us-rse.org/api/posts.json](https://us-rse.org/api/posts.json): json list of US-RSE posts, all types
 - [https://us-rse.org/api/events.json](https://us-rse.org/api/events.json): json list of US-RSE events 
 - [https://us-rse.org/api/newsletters.json](https://us-rse.org/api/posts.json): json list of US-RSE newsletters
 - [https://us-rse.org/api/dei.json](https://us-rse.org/api/dei.json): json list of dei events
 - [https://us-rse.org/api/jobs.json](https://us-rse.org/api/jobs.json): json list of non-expired jobs
 - [https://us-rse.org/api/member-counts.json](https://us-rse.org/api/member-counts.json): json list of monthly membership total count

## Thanks

This website would not be possible without art an inspiration from other community projects!

 - [SORSE](https://sorse.github.io)
 - [RSE Steampunk Logo](assets/img/rse-steampunk.png) was designed and created by Natacha and Vanessa Sochat

<!--- ## Join us! --->

<a href="https://docs.google.com/forms/d/e/1FAIpQLScBQ6AYpYYK2wL21egcaVvH0ZEvtShU-0s-XbqnY3okUsyIZw/viewform">
<img width="250px" alt="signup button" src="assets/img/signup.png"></a> 

## Contributors

We use the [all-contributors](https://github.com/all-contributors/all-contributors) 
tool to generate a contributors graphic below.


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://vsoch.github.io"><img src="https://avatars0.githubusercontent.com/u/814322?v=4?s=100" width="100px;" alt="Vanessasaurus"/><br /><sub><b>Vanessasaurus</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Code">💻</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Documentation">📖</a> <a href="#blog-vsoch" title="Blogposts">📝</a> <a href="#content-vsoch" title="Content">🖋</a> <a href="#design-vsoch" title="Design">🎨</a> <a href="#ideas-vsoch" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-vsoch" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-vsoch" title="Maintenance">🚧</a> <a href="#tool-vsoch" title="Tools">🔧</a></td>
      <td align="center"><a href="https://github.com/cosden"><img src="https://avatars3.githubusercontent.com/u/5824618?v=4?s=100" width="100px;" alt="Ian Cosden"/><br /><sub><b>Ian Cosden</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cosden" title="Code">💻</a> <a href="#blog-cosden" title="Blogposts">📝</a> <a href="#content-cosden" title="Content">🖋</a> <a href="#eventOrganizing-cosden" title="Event Organizing">📋</a> <a href="#ideas-cosden" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-cosden" title="Funding Finding">🔍</a> <a href="https://github.com/USRSE/usrse.github.io/pulls?q=is%3Apr+reviewed-by%3Acosden" title="Reviewed Pull Requests">👀</a></td>
      <td align="center"><a href="https://github.com/christophernhill"><img src="https://avatars0.githubusercontent.com/u/3535328?v=4?s=100" width="100px;" alt="Chris Hill"/><br /><sub><b>Chris Hill</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=christophernhill" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/cmaimone"><img src="https://avatars3.githubusercontent.com/u/14303565?v=4?s=100" width="100px;" alt="Christina Maimone"/><br /><sub><b>Christina Maimone</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cmaimone" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/cferenba"><img src="https://avatars2.githubusercontent.com/u/2684626?v=4?s=100" width="100px;" alt="Charles Ferenbaugh"/><br /><sub><b>Charles Ferenbaugh</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cferenba" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/danielskatz"><img src="https://avatars1.githubusercontent.com/u/2913845?v=4?s=100" width="100px;" alt="Daniel S. Katz"/><br /><sub><b>Daniel S. Katz</b></sub></a><br /><a href="#blog-danielskatz" title="Blogposts">📝</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=danielskatz" title="Code">💻</a> <a href="#eventOrganizing-danielskatz" title="Event Organizing">📋</a> <a href="#ideas-danielskatz" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center"><a href="jperr.com"><img src="https://avatars0.githubusercontent.com/u/355615?v=4?s=100" width="100px;" alt="Jordan Perr-Sauer"/><br /><sub><b>Jordan Perr-Sauer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jordanperr" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://www.lanceparsons.net"><img src="https://avatars2.githubusercontent.com/u/645128?v=4?s=100" width="100px;" alt="Lance Parsons"/><br /><sub><b>Lance Parsons</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lparsons" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/mmshad"><img src="https://avatars0.githubusercontent.com/u/31811010?v=4?s=100" width="100px;" alt="Mahmood M. Shad"/><br /><sub><b>Mahmood M. Shad</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mmshad" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/kir0ul"><img src="https://avatars3.githubusercontent.com/u/6053592?v=4?s=100" width="100px;" alt="kir0ul"/><br /><sub><b>kir0ul</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kir0ul" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/abarysh"><img src="https://avatars3.githubusercontent.com/u/11416566?v=4?s=100" width="100px;" alt="Anastasia Baryshnikova"/><br /><sub><b>Anastasia Baryshnikova</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=abarysh" title="Code">💻</a></td>
      <td align="center"><a href="https://eesa.lbl.gov/profiles/gregory-lemieux/"><img src="https://avatars3.githubusercontent.com/u/7565064?v=4?s=100" width="100px;" alt="Gregory Lemieux"/><br /><sub><b>Gregory Lemieux</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=glemieux" title="Code">💻</a></td>
      <td align="center"><a href="http://www.dursi.ca"><img src="https://avatars3.githubusercontent.com/u/1783579?v=4?s=100" width="100px;" alt="Jonathan Dursi"/><br /><sub><b>Jonathan Dursi</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ljdursi" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/jdamerow"><img src="https://avatars2.githubusercontent.com/u/8881141?v=4?s=100" width="100px;" alt="Julia Damerow"/><br /><sub><b>Julia Damerow</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jdamerow" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/kmanalo"><img src="https://avatars2.githubusercontent.com/u/2001688?v=4?s=100" width="100px;" alt="Kevin Manalo"/><br /><sub><b>Kevin Manalo</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kmanalo" title="Code">💻</a></td>
      <td align="center"><a href="https://nampho.me"><img src="https://avatars1.githubusercontent.com/u/1252858?v=4?s=100" width="100px;" alt="Nam Pho"/><br /><sub><b>Nam Pho</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=npho" title="Code">💻</a></td>
      <td align="center"><a href="http://www.noamross.net"><img src="https://avatars1.githubusercontent.com/u/571752?v=4?s=100" width="100px;" alt="Noam Ross"/><br /><sub><b>Noam Ross</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=noamross" title="Code">💻</a></td>
      <td align="center"><a href="http://greptilian.com"><img src="https://avatars2.githubusercontent.com/u/21006?v=4?s=100" width="100px;" alt="Philip Durbin"/><br /><sub><b>Philip Durbin</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pdurbin" title="Code">💻</a></td>
      <td align="center"><a href="http://sandra-gesing.com/"><img src="https://avatars1.githubusercontent.com/u/4429799?v=4?s=100" width="100px;" alt="Sandra Gesing"/><br /><sub><b>Sandra Gesing</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=sandragesing" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/simonbyrne"><img src="https://avatars3.githubusercontent.com/u/1692009?v=4?s=100" width="100px;" alt="Simon Byrne"/><br /><sub><b>Simon Byrne</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=simonbyrne" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/TaiSakuma"><img src="https://avatars0.githubusercontent.com/u/1388081?v=4?s=100" width="100px;" alt="Tai Sakuma"/><br /><sub><b>Tai Sakuma</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=TaiSakuma" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/neisty"><img src="https://avatars2.githubusercontent.com/u/25918660?v=4?s=100" width="100px;" alt="neisty"/><br /><sub><b>neisty</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=neisty" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/toreliza"><img src="https://avatars2.githubusercontent.com/u/8468060?v=4?s=100" width="100px;" alt="toreliza"/><br /><sub><b>toreliza</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=toreliza" title="Code">💻</a></td>
      <td align="center"><a href="http://isda.ncsa.illinois.edu"><img src="https://avatars1.githubusercontent.com/u/2375622?v=4?s=100" width="100px;" alt="Kenton McHenry"/><br /><sub><b>Kenton McHenry</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mchenry" title="Code">💻</a></td>
      <td align="center"><a href="http://abhishekdutta.org"><img src="https://avatars3.githubusercontent.com/u/722415?v=4?s=100" width="100px;" alt="Abhishek Dutta"/><br /><sub><b>Abhishek Dutta</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=thelinuxmaniac" title="Code">💻</a></td>
      <td align="center"><a href="http://carver.cs.ua.edu"><img src="https://avatars2.githubusercontent.com/u/9202282?v=4?s=100" width="100px;" alt="JeffCarver"/><br /><sub><b>JeffCarver</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=JeffCarver" title="Code">💻</a></td>
      <td align="center"><a href="www.nicole-brewer.com"><img src="https://avatars2.githubusercontent.com/u/20686935?v=4?s=100" width="100px;" alt="Nicole Brewer"/><br /><sub><b>Nicole Brewer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=nicole-brewer" title="Code">💻</a></td>
      <td align="center"><a href="s-sajid-ali.github.io"><img src="https://avatars1.githubusercontent.com/u/30510036?v=4?s=100" width="100px;" alt="Sajid Ali"/><br /><sub><b>Sajid Ali</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=s-sajid-ali" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/frolovsa"><img src="https://avatars0.githubusercontent.com/u/55715838?v=4?s=100" width="100px;" alt="frolovsa"/><br /><sub><b>frolovsa</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=frolovsa" title="Code">💻</a></td>
      <td align="center"><a href="https://eduardoarango.dev"><img src="https://avatars1.githubusercontent.com/u/15933089?v=4?s=100" width="100px;" alt="Carlos Eduardo Arango Gutierrez"/><br /><sub><b>Carlos Eduardo Arango Gutierrez</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ArangoGutierrez" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/clairecporter"><img src="https://avatars3.githubusercontent.com/u/3086036?v=4?s=100" width="100px;" alt="clairecporter"/><br /><sub><b>clairecporter</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=clairecporter" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/lefebvre"><img src="https://avatars1.githubusercontent.com/u/70483?v=4?s=100" width="100px;" alt="Jordan P. Lefebvre"/><br /><sub><b>Jordan P. Lefebvre</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lefebvre" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/maxhutch"><img src="https://avatars.githubusercontent.com/u/1538980?v=4?s=100" width="100px;" alt="Max Hutchinson"/><br /><sub><b>Max Hutchinson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=maxhutch" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/jarrah42"><img src="https://avatars.githubusercontent.com/u/6130694?v=4?s=100" width="100px;" alt="Greg Watson"/><br /><sub><b>Greg Watson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jarrah42" title="Code">💻</a></td>
      <td align="center"><a href="https://civilfritz.net"><img src="https://avatars.githubusercontent.com/u/350294?v=4?s=100" width="100px;" alt="Jonathon Anderson"/><br /><sub><b>Jonathon Anderson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=anderbubble" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/exoticDFT"><img src="https://avatars.githubusercontent.com/u/18316938?v=4?s=100" width="100px;" alt="Alexander Koufos"/><br /><sub><b>Alexander Koufos</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=exoticDFT" title="Code">💻</a></td>
      <td align="center"><a href="https://newton.cx/~peter/"><img src="https://avatars.githubusercontent.com/u/59598?v=4?s=100" width="100px;" alt="Peter Williams"/><br /><sub><b>Peter Williams</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pkgw" title="Code">💻</a></td>
      <td align="center"><a href="https://freelancerbrg.com"><img src="https://avatars.githubusercontent.com/u/1132451?v=4?s=100" width="100px;" alt="BRG"/><br /><sub><b>BRG</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=coolbrg" title="Code">💻</a></td>
      <td align="center"><a href="https://csmd.ornl.gov/profile/david-bernholdt"><img src="https://avatars.githubusercontent.com/u/426409?v=4?s=100" width="100px;" alt="David E. Bernholdt"/><br /><sub><b>David E. Bernholdt</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=bernhold" title="Code">💻</a></td>
      <td align="center"><a href="http://sulab.org"><img src="https://avatars.githubusercontent.com/u/2635409?v=4?s=100" width="100px;" alt="Andrew Su"/><br /><sub><b>Andrew Su</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=andrewsu" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/chrisblanton"><img src="https://avatars.githubusercontent.com/u/43550454?v=4?s=100" width="100px;" alt="Christopher Blanton"/><br /><sub><b>Christopher Blanton</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=chrisblanton" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/castelao"><img src="https://avatars.githubusercontent.com/u/1903589?v=4?s=100" width="100px;" alt="Guilherme Castelão"/><br /><sub><b>Guilherme Castelão</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=castelao" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/roelofsaj"><img src="https://avatars.githubusercontent.com/u/14942055?v=4?s=100" width="100px;" alt="Abbey Roelofs"/><br /><sub><b>Abbey Roelofs</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=roelofsaj" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/mtbc"><img src="https://avatars.githubusercontent.com/u/2630707?v=4?s=100" width="100px;" alt="Mark Carroll"/><br /><sub><b>Mark Carroll</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mtbc" title="Code">💻</a></td>
      <td align="center"><a href="https://nicholdav.info/"><img src="https://avatars.githubusercontent.com/u/11934090?v=4?s=100" width="100px;" alt="David Nicholson"/><br /><sub><b>David Nicholson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=NickleDave" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/bjoyce3"><img src="https://avatars.githubusercontent.com/u/11023317?v=4?s=100" width="100px;" alt="Blake Joyce"/><br /><sub><b>Blake Joyce</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=bjoyce3" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/hackdna"><img src="https://avatars.githubusercontent.com/u/452575?v=4?s=100" width="100px;" alt="Ilya Sytchev"/><br /><sub><b>Ilya Sytchev</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=hackdna" title="Code">💻</a></td>
      <td align="center"><a href="oestergaard.dev"><img src="https://avatars.githubusercontent.com/u/34489999?v=4?s=100" width="100px;" alt="Emil Østergaard"/><br /><sub><b>Emil Østergaard</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=axrez" title="Code">💻</a></td>
      <td align="center"><a href="http://jhkennedy.org"><img src="https://avatars.githubusercontent.com/u/7882693?v=4?s=100" width="100px;" alt="Joseph H Kennedy"/><br /><sub><b>Joseph H Kennedy</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jhkennedy" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/crd477"><img src="https://avatars.githubusercontent.com/u/1130035?v=4?s=100" width="100px;" alt="Chad Dougherty"/><br /><sub><b>Chad Dougherty</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=crd477" title="Code">💻</a></td>
      <td align="center"><a href="https://cfwebprod.sandia.gov/cfdocs/CompResearch/templates/insert/dept.cfm?org=01424"><img src="https://avatars.githubusercontent.com/u/55767766?v=4?s=100" width="100px;" alt="Miranda Mundt"/><br /><sub><b>Miranda Mundt</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mrmundt" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/braney"><img src="https://avatars.githubusercontent.com/u/17574483?v=4?s=100" width="100px;" alt="Bryan Raney"/><br /><sub><b>Bryan Raney</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=braney" title="Code">💻</a></td>
      <td align="center"><a href="https://medium.com/@srbdev"><img src="https://avatars.githubusercontent.com/u/2583156?v=4?s=100" width="100px;" alt="sb"/><br /><sub><b>sb</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=srbdev" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/rkakodkar"><img src="https://avatars.githubusercontent.com/u/65554003?v=4?s=100" width="100px;" alt="rkakodkar"/><br /><sub><b>rkakodkar</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=rkakodkar" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/tacaswell"><img src="https://avatars.githubusercontent.com/u/199813?v=4?s=100" width="100px;" alt="Thomas A Caswell"/><br /><sub><b>Thomas A Caswell</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=tacaswell" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/AlfredoR-CSUF"><img src="https://avatars.githubusercontent.com/u/86503312?v=4?s=100" width="100px;" alt="Alfredo Rodriguez"/><br /><sub><b>Alfredo Rodriguez</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=AlfredoR-CSUF" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="https://github.com/dylanmcreynolds"><img src="https://avatars.githubusercontent.com/u/40469975?v=4?s=100" width="100px;" alt="Dylan McReynolds"/><br /><sub><b>Dylan McReynolds</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=dylanmcreynolds" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/jbteves"><img src="https://avatars.githubusercontent.com/u/26722533?v=4?s=100" width="100px;" alt="Joshua Teves"/><br /><sub><b>Joshua Teves</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jbteves" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/chrisvam"><img src="https://avatars.githubusercontent.com/u/6949021?v=4?s=100" width="100px;" alt="chrisvam"/><br /><sub><b>chrisvam</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=chrisvam" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/maffettone"><img src="https://avatars.githubusercontent.com/u/43007690?v=4?s=100" width="100px;" alt="Dr. Phil Maffettone"/><br /><sub><b>Dr. Phil Maffettone</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=maffettone" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/lmilechin"><img src="https://avatars.githubusercontent.com/u/13963460?v=4?s=100" width="100px;" alt="Lauren Milechin"/><br /><sub><b>Lauren Milechin</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lmilechin" title="Code">💻</a></td>
      <td align="center"><a href="adamcooper.sh"><img src="https://avatars.githubusercontent.com/u/14908880?v=4?s=100" width="100px;" alt="Adam Cooper"/><br /><sub><b>Adam Cooper</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=super-cooper" title="Code">💻</a></td>
      <td align="center"><a href="http://www.rafmudaf.com"><img src="https://avatars.githubusercontent.com/u/13797903?v=4?s=100" width="100px;" alt="Rafael M Mudafort"/><br /><sub><b>Rafael M Mudafort</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=rafmudaf" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center"><a href="http://informaticsnerd.blogspot.com"><img src="https://avatars.githubusercontent.com/u/967970?v=4?s=100" width="100px;" alt="Luke R."/><br /><sub><b>Luke R.</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lrasmus" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
