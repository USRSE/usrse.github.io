# The United States (US) Research Software Engineer Association

![contributors.svg](./contributors.svg)

## What is this?

This is a repository that containers the files for the official US RSE community website hosted at https://us-rse.org.
The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub. 

## How do I contribute?

We encourage the community to contribute to the content of the website.  
To do this: fork the repository, make your proposed changes, test locally (see below), and then create a pull request against `master`. For more details about opening pull requests and issues, see our [Contributing Guide](.github/CONTRIBUTING.md).

### 1. How do I update the map?

If you belong to a group of Research Software Engineers (hooray!), or want
to add yourself as an individual you can do so by adding
an entry to the [_data/map.yml](_data/map.yml) file. Specifically, an entire
should include a name, institution, url, type, and coordinate. The name could be an individual,
or the name of a group. If you are adding yourself as an individual, set the
type to be "person." If you are adding a group, set the type to be "group."
Here is an example:

```yaml
- name: "Stanford Research Computing Center"
  url: https://srcc.stanford.edu
  coords: [37.424107, -122.166077]
  institution: Stanford University
  type: group
```

You are also free to add an image parameter, in case your group has a logo.
And of course this could apply to an individual too.

> How do I find a latitude and longitude?

You can actually look it up on [Google Maps](http://maps.google.com), and a more direct approach
is to use [https://www.latlong.net/](https://www.latlong.net/) and enter
your location by name.

> What if I don't have an image, or don't want to include one?

The image is not required. If you leave it out, the box will only contain text.

### 2. How do I add a job?

We maintain a list of current and previous job postings in [_data/jobs.yml](_data/jobs.yml).
Specifically, we ask that you provide a name, location (can be Remote), an expiration date, and a url to the posting.
The expiration date is not shown on the page, however it will determine when the job doesn't appear 
anymore. We suggest setting a timeframe such as a month, and if you want to extend it, you
can open a pull request to update the date. An example posting is shown below. This
job will appear on the site until the first of July, 2019.

```yaml
- {expires: 2019-07-01, location: 'Princeton, NJ', name: 'Research Software Engineer'
    url: 'https://main-princeton.icims.com/jobs'}
```

We will test that all fields are defined, the url exists, and that the "expires" field loads
as a `datetime.date` object in Python. If you copy the format above, you should
be ok.


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

### 4. How do I add a page redirect?

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

#### 1. Test Map Entries

Other than previewing the site and ensuring that the coordinate shows up in the
correct spot, you can run unit testing locally to confirm you have the minimum
required data:

```bash
$ cd tests
$ python -m unittest test_mapdata
```

#### 2. Test Jobs

Jobs are tested for correctness, meaning that all fields are entered, a date string
is entered for the "expires" field, and the url is valid. You can run tests locally 
like:

```bash
$ cd tests
$ python -m unittest test_jobs
```

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

## URLChecker

The [URLschecker](https://github.com/urlstechie/URLs-checker) is a GitHub action
that @vsoch worked on to contribute retry and some other nice features for the 
repository here. These features are available as of version 0.1.6 that is used
in the [workflow](.github/workflows/urlchecker.yml).

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

#### Contributors Graphic
We use the GitHub Workflow [update-contributors-graphic.yml](.github/workflows/update-contributors-graphic.yml)
to generate a contribution graphic using [sourcecred](https://sourcecred.io/) on a weekly basis, and open a pull
request to review the updates every Sunday. Sourcecred is a beautiful tool that takes into account
almost every way you can contribute on a repository (issues, comments, stars or likes, reviews)
and then generates a simple, beautiful graphic with avatars. It's a really easy way to show off
the size of the community, and it runs all via containers in this GitHub Action.


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
 3. each CI service offers unique features. For example, GitHub has the closets integration with the repository here, and CircleCI allows us to preview artifacts.

<!--- ## Join us! --->

<a href="https://docs.google.com/forms/d/e/1FAIpQLScBQ6AYpYYK2wL21egcaVvH0ZEvtShU-0s-XbqnY3okUsyIZw/viewform">
<img width="250px" alt="signup button" src="assets/img/signup.png"></a> 
