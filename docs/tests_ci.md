## Automation and Tests

Tests are run during continuous integration to catch any errors and to preview
content. Specifically, usrse.github.io uses the following integrations (with links
to configuration files):

 - [CircleCI](.circleci/config.yml) previews the site, and tests jobs and mapdata
 - [GitHub CI](.github/workflows) includes GitHub triggers and actions

Instructions for running locally, along with details about each, are provided below.

## CircleCI

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

### Previewing the Site 

CircleCI builds the site and creates preview of individual pages. 
The preview only works for individual pages (the links within the preview site don't link to other pages in preview).  

In the PR, you'll see:

![PR checks notification](/assets/img/pr_checks.png)

Click on Show All Checks, then get Details for the CircleCI checks:

![PR checks details](/assets/img/pr_checks_detailed.png)

This will take you to the CircleCI page, where you should click on the Artifacts link:

![CircleCI project page](/assets/img/circleci.png)

This will open a list of the individual pages - click on links to review the pages (reminder: internal links won't go to other preview pages)

![CircleCI preview links](/assets/img/circleci_artifacts.png)

### Testing Job Data

Jobs are tested for correctness, meaning that all fields are entered, a date string
is entered for the "expires" field, and the url is valid. You can run tests locally 
like:

```bash
$ cd tests
$ python -m unittest test_jobs
```

### Count Jobs

This is used to compute stats on the job board for reporting.  

A [script](scripts/count_jobs.py) is provided that will clone the repository
to a temporary directory, find all commits with a changed job file,
and then checkout and read each commit to get the jobs present for that time.
We then use the title and URL for the job as a unique identifier to determine
if the job has been seen. A job with the same name and URL, and thus the same
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



### GitHub CI

#### URLs-checker and Spelling

The [URLs-checker](https://github.com/urlstechie/urlchecker-action) is a GitHub action
in the [linting workflow](.github/workflows/linting.yaml). Relative URLs internal to the site are not checked.  

If there are URLs that should be systematically ignored by the checker, they can be added to .github/workflows/linting.yaml 

In addition, @vsoch found
a Rust tool called [crate-ci/typos](https://github.com/marketplace/actions/typos-action)
and contributed an equivalent action so all posts and pages are spell-checked.
If your CI fails, the spelling suggestions will be shown and you can manually
update the mistakes, or [install typos](https://github.com/crate-ci/typos#install) 
and have all errors fixed automatically:

```bash
typos ./pages ./_posts ./README.md --write-changes
```

The config file to specify words to ignore is 
[`.github/workflows/typo_config.toml`](.github/workflows/typo_config.toml).
Edit this file if there are phrases or words that need to be ignored (e.g., surnames, acronyms).

#### Clean Expired Jobs

The workflow [clean-expired-jobs.yml](.github/workflows/clean-expired-jobs.yml) is run nightly,
and uses the same function from the URLs-checker to check for expired links in jobs.yml,
and given an expired link, remove it from the file if the URL check fails. In the case
that a link is not expired and the check fails, we would want to know about this
(and the test will fail). For all jobs, we don't remove them immediately upon expiration -
we give the submitter 60 days to possibly update the data file with a later expiration date.

This job needs to be updated in conjunction with the URLs-checker. If they are not on
compatible URLs-checker versions, you may receive inconsistent behavior and erroneous
failures between this and the PR linting job.

#### Post New Jobs to Slack

The workflow [jobs-poster.yaml](.github/workflows/jobs-poster.yaml) is run on any push
to `main` with changes to `_data/jobs.yml`. If new jobs are found, it will post the Job URL to
the USRSE Slack `#jobs` channel. It utilizes the [Jobs updater](https://github.com/rseng/jobs-updater)
GitHub Action by @vsoch and @jhkennedy to parse the `_data/jobs.yml` file for new jobs and post them
the USRSE Slack. For the action:

 - `unique`: determines the field in the jobs.yml that determines uniqueness (defaults to URL)
 - `keys`: a comma-separated list of fields to include. All except for URL will have a prefix, so it's recommended to put the URL last.

The other fields are intuitive. 

Example output (in the console that might go to Slack or Twitter)
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

This simple greetings action greets first-time users (for issues).
The logic of this is determined by the [greetings.yml](.github/workflows/greetings.yml)
workflow. 

#### Member Counts

Two scripts help to create a branch with an updated [member counts file](_data/memberCounts.csv)
that starts with the prefix `update/member-counts`. The workflow [member-counts.yaml](.github/workflows/member-counts.yaml) will generate an updated file and commit and push to a new branch, and it uses [pull-request.sh](scripts/pull-request.sh) to then open a PR with the new branch to the repository. For GitHub CI, there are currently no secrets or credentials, and no setup is required - having actions enabled for the repository and placing the file under `.github/workflows`
enables it.



## Rakefile

A legacy [Rakefile](Rakefile) is kept with the repository but it is no longer used.

## Frequently Asked Questions

> Why do we use different services?

Using multiple "free tier" CI services is a common thing for open source projects to do.
There are several reasons to do this:

 1. We can better leverage a free tier, meaning a maximum number of jobs run in parallel or minutes per month by spreading work over multiple services. 
 2. We can scope a particular kind of test to a service. For example, one service might just be to test the core software, another might be to build and deploy containers, and a third might be to preview a site.
 3. Each CI service offers unique features. For example, GitHub has the closest integration with the repository here, and CircleCI allows us to preview artifacts.


