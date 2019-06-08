# The United States (US) Research Software Engineer Community

[![Build Status](https://travis-ci.org/USRSE/usrse.github.io.svg?branch=master)](https://travis-ci.org/USRSE/usrse.github.io)

## What is this?

This is a repository that containers the files for the official US RSE community website hosted at http://www.us-rse.org.
The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub. 

## How do I contribute?

We encourage the community to contribute to the content of the website.  
To do this: fork the repository, make your proposed changes, test locally (see below), and then create a pull request against `gh-pages`.

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
- name: "Research Software Engineer"
  location: Princeton, NJ
  url: https://main-princeton.icims.com/jobs/10347/research-software-engineer/job
  expires: 2019-07-01
```

We will test that all fields are defined, the url exists, and that the "expires" field loads
as a `datetime.date` object in Python. If you copy the format above, you should
be ok.

## Tests

These tests are also run during the continuous integration to catch any errors,
and instructions for running locally are provided below.

### 1. Test Map Entries

Other than previewing the site and ensuring that the coordinate shows up in the
correct spot, you can run unit testing locally to confirm you have the minimum
required data:

```bash
$ cd tests
$ python -m unittest test_mapdata
```

### 2. Test Jobs

Jobs are tested for correctness, meaning that all fields are entered, a date string
is entered for the "expires" field, and the url is valid. You can run tests locally 
like:

```bash
$ cd tests
$ python -m unittest test_jobs
```

## Previewing the Site Locally

In the top level directory of your forked repository run `jekyll serve` and browse to <http://localhost:4000>.
If you are having trouble try `rm -rf _site`, followed by `bundle update`, then `bundle exec jekyll serve`.

<!--- ## Join us! --->

<a href="https://docs.google.com/forms/d/e/1FAIpQLScBQ6AYpYYK2wL21egcaVvH0ZEvtShU-0s-XbqnY3okUsyIZw/viewform">
<img width="250px" alt="signup button" src="img/signup.png"></a> 
