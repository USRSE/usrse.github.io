# The United States (US) Research Software Engineer Association

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-39-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## What is this?

This is a repository that containers the files for the official US RSE community website hosted at https://us-rse.org.
The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub. 

## How do I contribute?

We encourage the community to contribute to the content of the website.  
To do this: fork the repository, make your proposed changes, test locally (see below), and then create a pull request against `master`. For more details about opening pull requests and issues, see our [Contributing Guide](.github/CONTRIBUTING.md).

### 1. How do I update the map?

The [map](https://us-rse.org/usrse-map/) is generated programmatically from the US-RSE member list, so if you
have already [joined](https://us-rse.org/join) and provided your institution,
you should be represented on it. If you see any issues or errors with location
lookup (we use geolocation of a named location) please [open an issue](https://github.com/USRSE/usrse-map/issues).

### 2. How do I add a job?

We maintain a list of current and previous job postings in [_data/jobs.yml](_data/jobs.yml).
You can add a new job to this list, and so that newer jobs appear at the top, we ask
that you **add the new entry to the top of the list.**
Specifically, we ask that you provide a name, location (can be Remote), an expiration date, and a url to the posting.
The expiration date is not shown on the page, however it will determine when the job doesn't appear 
anymore. We suggest setting a timeframe such as a month, and if you want to extend it, you
can open a pull request to update the date. An example posting is shown below. This
job would appear on the site until the first of July, 2019.

```yaml
- {expires: 2019-07-01, posted: 2019-02-01, location: 'Princeton, NJ',
    name: 'Research Software Engineer', url: 'https://main-princeton.icims.com/jobs'}
```

And don't forget to write your new job at the top of the [_data/jobs.yml](_data/jobs.yml) file!
For testing, we look to see that all fields are defined, the url exists, and
that the "expires" and "posted" fields load as a `datetime.date` object in
Python. If you copy the format above, you should be ok.


### 3. How do I add an event?

You can add an event or training to the site by adding a markdown file in the [_events](_events)
folder, organized by year. Do not use the full date (e.g. YYYY-MM-DD-<event-name>.md) in the file name,
Jekyll will not post pages that it interprets to have a future date in the filename. A better option is
to use a partial date (e.g. YYYY-MM-<event-name>.md).
Here is an example of a file in `_events/2019` for PEARC19:

```markdown
---
title: PEARC19
location: Chicago, IL
url: https://www.pearc19.pearc.org/
expires: 2019-08-01
event_date: "November 17–22, 2019"
layout: event
repeated: false
---

Join us at [PEARC19](https://www.pearc19.pearc.org/) for a Birds of a Feather (BOF) session "Building a Community of Research Software Engineers."  Our session is scheduled for 5:15 PM on Monday, July 29.
```

The top section is frontend matter that must include the title, location, url, layout as "event" 
event date, an expiration date, and a "repeated" variable (true or false).
Notice that the event date is a string that doesn't get parsed,
while the expires must be a date in the format shown.
The bottom section (the content) you can write any amount and length
of markdown that is desired. When the event is active (before expiration) the full content will
be shown on the "Events and Training" page. Once it expires, it will move into the events archive.
In both cases, clicking on the Event will take the viewer to it's page, and they can
view additional content and the url provided. In the case of the archive, the bulk of content
is only viewable on this page.

### What is a repeated event?


You'll notice that there is a folder called "repeated" in the events folder:

```
$ ls _events/
2019  2020  repeated
```

A repeated event is one that happens weekly, monthly, or on a regularly scheduled
basis that typically does not change, meaning that you wouldn't need to
update the post. A weekly call that has a description and a consistent link
to an agenda would be appropriate, while the same call that varies in schedule
or requires an updated description would not quality.
An annual event, or one that would require a different description, would
not be repeated, and should be placed in a folder named by date.
Repeated events are always shown at the top of the events page, and 
do not expire.

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

## URLChecker and Spelling

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

## Clean Expired Jobs

The workflow [clean-expired-jobs.yml](.github/workflows/clean-expired-jobs.yml) is run nightly,
and uses the same function from the urlchecker to check for expired links in jobs.yml,
and given an expired link, remove it from the file if the url check fails. In the case
that a link is not expired and the check fails, we would want to know about this
(and the test will fail).

### Greetings
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
  <tr>
    <td align="center"><a href="https://vsoch.github.io"><img src="https://avatars0.githubusercontent.com/u/814322?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vanessasaurus</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Code">💻</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Documentation">📖</a> <a href="#blog-vsoch" title="Blogposts">📝</a> <a href="#content-vsoch" title="Content">🖋</a> <a href="#design-vsoch" title="Design">🎨</a> <a href="#ideas-vsoch" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-vsoch" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-vsoch" title="Maintenance">🚧</a> <a href="#tool-vsoch" title="Tools">🔧</a></td>
    <td align="center"><a href="https://github.com/cosden"><img src="https://avatars3.githubusercontent.com/u/5824618?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ian Cosden</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cosden" title="Code">💻</a> <a href="#blog-cosden" title="Blogposts">📝</a> <a href="#content-cosden" title="Content">🖋</a> <a href="#eventOrganizing-cosden" title="Event Organizing">📋</a> <a href="#ideas-cosden" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-cosden" title="Funding Finding">🔍</a> <a href="https://github.com/USRSE/usrse.github.io/pulls?q=is%3Apr+reviewed-by%3Acosden" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://github.com/christophernhill"><img src="https://avatars0.githubusercontent.com/u/3535328?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Chris Hill</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=christophernhill" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cmaimone"><img src="https://avatars3.githubusercontent.com/u/14303565?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Christina Maimone</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cmaimone" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cferenba"><img src="https://avatars2.githubusercontent.com/u/2684626?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charles Ferenbaugh</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cferenba" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/danielskatz"><img src="https://avatars1.githubusercontent.com/u/2913845?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daniel S. Katz</b></sub></a><br /><a href="#blog-danielskatz" title="Blogposts">📝</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=danielskatz" title="Code">💻</a> <a href="#eventOrganizing-danielskatz" title="Event Organizing">📋</a> <a href="#ideas-danielskatz" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="jperr.com"><img src="https://avatars0.githubusercontent.com/u/355615?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jordan Perr-Sauer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jordanperr" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://www.lanceparsons.net"><img src="https://avatars2.githubusercontent.com/u/645128?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Lance Parsons</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lparsons" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mmshad"><img src="https://avatars0.githubusercontent.com/u/31811010?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mahmood M. Shad</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mmshad" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/kir0ul"><img src="https://avatars3.githubusercontent.com/u/6053592?v=4?s=100" width="100px;" alt=""/><br /><sub><b>kir0ul</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kir0ul" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/abarysh"><img src="https://avatars3.githubusercontent.com/u/11416566?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anastasia Baryshnikova</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=abarysh" title="Code">💻</a></td>
    <td align="center"><a href="https://eesa.lbl.gov/profiles/gregory-lemieux/"><img src="https://avatars3.githubusercontent.com/u/7565064?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gregory Lemieux</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=glemieux" title="Code">💻</a></td>
    <td align="center"><a href="http://www.dursi.ca"><img src="https://avatars3.githubusercontent.com/u/1783579?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jonathan Dursi</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ljdursi" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jdamerow"><img src="https://avatars2.githubusercontent.com/u/8881141?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Julia Damerow</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jdamerow" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/kmanalo"><img src="https://avatars2.githubusercontent.com/u/2001688?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kevin Manalo</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kmanalo" title="Code">💻</a></td>
    <td align="center"><a href="https://nampho.me"><img src="https://avatars1.githubusercontent.com/u/1252858?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nam Pho</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=npho" title="Code">💻</a></td>
    <td align="center"><a href="http://www.noamross.net"><img src="https://avatars1.githubusercontent.com/u/571752?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Noam Ross</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=noamross" title="Code">💻</a></td>
    <td align="center"><a href="http://greptilian.com"><img src="https://avatars2.githubusercontent.com/u/21006?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Philip Durbin</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pdurbin" title="Code">💻</a></td>
    <td align="center"><a href="http://sandra-gesing.com/"><img src="https://avatars1.githubusercontent.com/u/4429799?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sandra Gesing</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=sandragesing" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/simonbyrne"><img src="https://avatars3.githubusercontent.com/u/1692009?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Simon Byrne</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=simonbyrne" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/TaiSakuma"><img src="https://avatars0.githubusercontent.com/u/1388081?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tai Sakuma</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=TaiSakuma" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/neisty"><img src="https://avatars2.githubusercontent.com/u/25918660?v=4?s=100" width="100px;" alt=""/><br /><sub><b>neisty</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=neisty" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/toreliza"><img src="https://avatars2.githubusercontent.com/u/8468060?v=4?s=100" width="100px;" alt=""/><br /><sub><b>toreliza</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=toreliza" title="Code">💻</a></td>
    <td align="center"><a href="http://isda.ncsa.illinois.edu"><img src="https://avatars1.githubusercontent.com/u/2375622?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kenton McHenry</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mchenry" title="Code">💻</a></td>
    <td align="center"><a href="http://abhishekdutta.org"><img src="https://avatars3.githubusercontent.com/u/722415?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Abhishek Dutta</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=thelinuxmaniac" title="Code">💻</a></td>
    <td align="center"><a href="http://carver.cs.ua.edu"><img src="https://avatars2.githubusercontent.com/u/9202282?v=4?s=100" width="100px;" alt=""/><br /><sub><b>JeffCarver</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=JeffCarver" title="Code">💻</a></td>
    <td align="center"><a href="www.nicole-brewer.com"><img src="https://avatars2.githubusercontent.com/u/20686935?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicole Brewer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=nicole-brewer" title="Code">💻</a></td>
    <td align="center"><a href="s-sajid-ali.github.io"><img src="https://avatars1.githubusercontent.com/u/30510036?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sajid Ali</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=s-sajid-ali" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/frolovsa"><img src="https://avatars0.githubusercontent.com/u/55715838?v=4?s=100" width="100px;" alt=""/><br /><sub><b>frolovsa</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=frolovsa" title="Code">💻</a></td>
    <td align="center"><a href="https://eduardoarango.dev"><img src="https://avatars1.githubusercontent.com/u/15933089?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Carlos Eduardo Arango Gutierrez</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ArangoGutierrez" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/clairecporter"><img src="https://avatars3.githubusercontent.com/u/3086036?v=4?s=100" width="100px;" alt=""/><br /><sub><b>clairecporter</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=clairecporter" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/lefebvre"><img src="https://avatars1.githubusercontent.com/u/70483?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jordan P. Lefebvre</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lefebvre" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/maxhutch"><img src="https://avatars.githubusercontent.com/u/1538980?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Max Hutchinson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=maxhutch" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jarrah42"><img src="https://avatars.githubusercontent.com/u/6130694?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Greg Watson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jarrah42" title="Code">💻</a></td>
    <td align="center"><a href="https://civilfritz.net"><img src="https://avatars.githubusercontent.com/u/350294?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jonathon Anderson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=anderbubble" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/exoticDFT"><img src="https://avatars.githubusercontent.com/u/18316938?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alexander Koufos</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=exoticDFT" title="Code">💻</a></td>
    <td align="center"><a href="https://newton.cx/~peter/"><img src="https://avatars.githubusercontent.com/u/59598?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Peter Williams</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pkgw" title="Code">💻</a></td>
    <td align="center"><a href="https://freelancerbrg.com"><img src="https://avatars.githubusercontent.com/u/1132451?v=4?s=100" width="100px;" alt=""/><br /><sub><b>BRG</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=coolbrg" title="Code">💻</a></td>
    <td align="center"><a href="https://csmd.ornl.gov/profile/david-bernholdt"><img src="https://avatars.githubusercontent.com/u/426409?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David E. Bernholdt</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=bernhold" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
