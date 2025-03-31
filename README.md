# The United States (US) Research Software Engineer Association

https://us-rse.org

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-86-orange.svg?style=flat-square)](#contributors)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## What is this?

These are the files for the official US RSE community website hosted at https://us-rse.org.
The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub. 

Members of US-RSE have access to the organizational Slack space.  The #website channel, referenced frequently below, is part of that space.  It's the best place to ask questions and get help.  

## How do I contribute?

We encourage the community to contribute to the content of the website.  
To do this: fork the repository, make your proposed changes, and then create a pull request against `main`. More details below.

### Where is the page I'm looking for?

The webpage text exist in markdown files (.md) in several places like `_events`, `_pages`, and `wg`. The best way to find the page you're trying to edit is to follow the path in the URL of the page itself. Example: editing the page for "https://us-rse.org/events/2022/2022-10-funder-talk-series/" would be in `/_events/2022/2022-10-funder-talk-series.md`

Can't find what you're looking for?  You're not alone.  Ask on the Slack #website channel.  

### How do I add an image/file?

Small files like .png images go into `/assets/img`

Larger files like slides from a speaker series currently go into a read-only Google Drive. One exists for the speaker series [here](https://drive.google.com/drive/folders/1HiwQZgmXF30BSFDxEfQOfu68Hv4F4NwC?usp=share_link). 

- You'll need to ask to add slides to that folder if you are not an editor.
- Managers will need to change the permissions of files added there to be read-only and provide a share link that is accessible to anyone with the link to view.

### How do I add a job?

Please [fill out the form](https://docs.google.com/forms/d/e/1FAIpQLSfYK64R1c0rj-ERldGLxuqedLIbsYPZXj9uBplDRYNmnND10Q/viewform).  Jobs are reviewed for relevance.

### How do I add an event?

[Fill out the form](https://docs.google.com/forms/d/e/1FAIpQLSda4-gAKyVA1GhJZg3XZmc9EDLaf5Donlm1HKG6r8ve9ooiRQ/viewform), or see the [events details page](docs/events.md) on how to create an event file directly.


### How do I...?

Further content editing tips are in the [details file](docs/details.md)


## Pull Request (PR) Process

PRs should be made on the main branch only.

Those who have full permissions to the repository should still be working on separate branches and creating PRs for any changes.  

### What to Include

Give the PR a descriptive title.  The PR template asks you for a description of the changes - a brief description is fine for simple/routine changes.

Three things to do after creating the PR:

1. Preview the site, either locally (necessary for complex functionality changes - see [docs/local_previews.md](docs/local_previews.md) for details) or with the CircleCI preview (fine for routine content changes and additions - see [docs/tests_ci.md](docs/tests_ci.md) for details).
2. Ask others to review content if needed.  For example, if your change is part of a working group's activities, you may need to check with other members of the working group to review your update.
3. Once the content is settled, post a link to the PR on the Slack #website channel to get reviewers for functionality and basic website style conformity.  

### Review Policy

**PR reviews are not content reviews.**  While corrections to basic grammatical issues, links, clarity problems, etc. in the files that are part of the review can be noted, the content of things to be posted to the website should generally be discussed and resolved before creating a PR.  If you create a PR that needs a content review before a technical review by the website group, please note that in the PR info.  

Those with merge permissions on the repo: use your judgment as to whether you need a reviewer.  Routine edits, additions, changes that are part of the normal activities of US-RSE do not need to be reviewed unless you want.  For larger edits (things requiring discussion or assistance), please ask for someone else to review.  Generally "squash" when merging.  

For those without merge permissions: 

* 1 reviewer for routine/small edits, additions, and changes.  If you get a review from someone who doesn't have merge permissions, ping the #website channel on Slack to let people know your PR has been reviewed but needs to be merged.
* 2 reviewers (and likely discussion in the PR, an issue, or the Slack #website channel) for changes to the layout, functionality, or style of the website

Anyone in US-RSE who is familiar with the website is welcome to review PRs.  

Want merge permissions?  Join the #website channel in Slack, help out a bit with tasks that come up, and then ask - we're happy to have new website maintainers.  


### Checks and Tests

[![Remove Expired Jobs](https://github.com/USRSE/usrse.github.io/actions/workflows/clean-expired-jobs.yaml/badge.svg)](https://github.com/USRSE/usrse.github.io/actions/workflows/clean-expired-jobs.yaml)

When you create a PR, automated tests run; see [docs/tests_ci.md](docs/tests_ci.md) for details.  

What the PR submitter is responsible for:

* URL Checker: This does NOT check internal relative links on the site, only absolute/full URLs.  If the URL checker fails, click on the Details link, and then expand the URLs-checker section of the report that comes up to try to find the failed URL.
  * Failed URL in a file that is part of your PR: you must fix it.
  * Failed URLs in the job listings: OK to ignore
  * Failed URL check where you know the URL is actually OK: OK to ignore.
  * Failed URL on another page outside of your PR: fix it if you can.  If you can't fix it (not sure what to replace it with, etc.), please note the problem in the PR discussion.  The person who merges the PR may choose to ignore the issue.  
* Spellchecker: Click on the Details link, then expand the Check Spelling section of the report that comes up to identify the issue.
  * Spelling issue in a file that is part of the PR: you must fix it.  If it's a legitimate word, you may need to add an exception to [`.github/workflows/typo_config.toml`](.github/workflows/typo_config.toml)
  * Spelling issue in a file that is not part of the PR: this generally shouldn't happen, as previous PRs have also had the spellchecker run.   
  
Questions?  Not sure what to do or what the problem is?  Ask on the #website channel on Slack.  


## Supporting Documentation

More details can be found in:

* [docs/events.md](docs/events.md): formatting for events, how the events and calendar work
* [docs/details.md](docs/details.md): redirects, embedding videos, last modified dates on pages, etc.
* [docs/tests_ci.md](docs/tests_ci.md): further details on CI processes
* [docs/local_previews.md](docs/local_previews.md): how to run and preview the site locally on your computer
* [docs/feeds.md](docs/feeds.md): RSS and JSON feeds available for the site



## Contributors

We use the [all-contributors](https://github.com/all-contributors/all-contributors) 
tool to generate a contributors graphic below.


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://vsoch.github.io"><img src="https://avatars0.githubusercontent.com/u/814322?v=4?s=100" width="100px;" alt="Vanessasaurus"/><br /><sub><b>Vanessasaurus</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Code">💻</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=vsoch" title="Documentation">📖</a> <a href="#blog-vsoch" title="Blogposts">📝</a> <a href="#content-vsoch" title="Content">🖋</a> <a href="#design-vsoch" title="Design">🎨</a> <a href="#ideas-vsoch" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-vsoch" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-vsoch" title="Maintenance">🚧</a> <a href="#tool-vsoch" title="Tools">🔧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cosden"><img src="https://avatars3.githubusercontent.com/u/5824618?v=4?s=100" width="100px;" alt="Ian Cosden"/><br /><sub><b>Ian Cosden</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cosden" title="Code">💻</a> <a href="#blog-cosden" title="Blogposts">📝</a> <a href="#content-cosden" title="Content">🖋</a> <a href="#eventOrganizing-cosden" title="Event Organizing">📋</a> <a href="#ideas-cosden" title="Ideas, Planning, & Feedback">🤔</a> <a href="#fundingFinding-cosden" title="Funding Finding">🔍</a> <a href="https://github.com/USRSE/usrse.github.io/pulls?q=is%3Apr+reviewed-by%3Acosden" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/christophernhill"><img src="https://avatars0.githubusercontent.com/u/3535328?v=4?s=100" width="100px;" alt="Chris Hill"/><br /><sub><b>Chris Hill</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=christophernhill" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cmaimone"><img src="https://avatars3.githubusercontent.com/u/14303565?v=4?s=100" width="100px;" alt="Christina Maimone"/><br /><sub><b>Christina Maimone</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cmaimone" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cferenba"><img src="https://avatars2.githubusercontent.com/u/2684626?v=4?s=100" width="100px;" alt="Charles Ferenbaugh"/><br /><sub><b>Charles Ferenbaugh</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=cferenba" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/danielskatz"><img src="https://avatars1.githubusercontent.com/u/2913845?v=4?s=100" width="100px;" alt="Daniel S. Katz"/><br /><sub><b>Daniel S. Katz</b></sub></a><br /><a href="#blog-danielskatz" title="Blogposts">📝</a> <a href="https://github.com/USRSE/usrse.github.io/commits?author=danielskatz" title="Code">💻</a> <a href="#eventOrganizing-danielskatz" title="Event Organizing">📋</a> <a href="#ideas-danielskatz" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="jperr.com"><img src="https://avatars0.githubusercontent.com/u/355615?v=4?s=100" width="100px;" alt="Jordan Perr-Sauer"/><br /><sub><b>Jordan Perr-Sauer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jordanperr" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.lanceparsons.net"><img src="https://avatars2.githubusercontent.com/u/645128?v=4?s=100" width="100px;" alt="Lance Parsons"/><br /><sub><b>Lance Parsons</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lparsons" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mmshad"><img src="https://avatars0.githubusercontent.com/u/31811010?v=4?s=100" width="100px;" alt="Mahmood M. Shad"/><br /><sub><b>Mahmood M. Shad</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mmshad" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kir0ul"><img src="https://avatars3.githubusercontent.com/u/6053592?v=4?s=100" width="100px;" alt="kir0ul"/><br /><sub><b>kir0ul</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kir0ul" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abarysh"><img src="https://avatars3.githubusercontent.com/u/11416566?v=4?s=100" width="100px;" alt="Anastasia Baryshnikova"/><br /><sub><b>Anastasia Baryshnikova</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=abarysh" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://eesa.lbl.gov/profiles/gregory-lemieux/"><img src="https://avatars3.githubusercontent.com/u/7565064?v=4?s=100" width="100px;" alt="Gregory Lemieux"/><br /><sub><b>Gregory Lemieux</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=glemieux" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.dursi.ca"><img src="https://avatars3.githubusercontent.com/u/1783579?v=4?s=100" width="100px;" alt="Jonathan Dursi"/><br /><sub><b>Jonathan Dursi</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ljdursi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jdamerow"><img src="https://avatars2.githubusercontent.com/u/8881141?v=4?s=100" width="100px;" alt="Julia Damerow"/><br /><sub><b>Julia Damerow</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jdamerow" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kmanalo"><img src="https://avatars2.githubusercontent.com/u/2001688?v=4?s=100" width="100px;" alt="Kevin Manalo"/><br /><sub><b>Kevin Manalo</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kmanalo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nampho.me"><img src="https://avatars1.githubusercontent.com/u/1252858?v=4?s=100" width="100px;" alt="Nam Pho"/><br /><sub><b>Nam Pho</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=npho" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.noamross.net"><img src="https://avatars1.githubusercontent.com/u/571752?v=4?s=100" width="100px;" alt="Noam Ross"/><br /><sub><b>Noam Ross</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=noamross" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://greptilian.com"><img src="https://avatars2.githubusercontent.com/u/21006?v=4?s=100" width="100px;" alt="Philip Durbin"/><br /><sub><b>Philip Durbin</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pdurbin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sandra-gesing.com/"><img src="https://avatars1.githubusercontent.com/u/4429799?v=4?s=100" width="100px;" alt="Sandra Gesing"/><br /><sub><b>Sandra Gesing</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=sandragesing" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/simonbyrne"><img src="https://avatars3.githubusercontent.com/u/1692009?v=4?s=100" width="100px;" alt="Simon Byrne"/><br /><sub><b>Simon Byrne</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=simonbyrne" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TaiSakuma"><img src="https://avatars0.githubusercontent.com/u/1388081?v=4?s=100" width="100px;" alt="Tai Sakuma"/><br /><sub><b>Tai Sakuma</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=TaiSakuma" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/neisty"><img src="https://avatars2.githubusercontent.com/u/25918660?v=4?s=100" width="100px;" alt="neisty"/><br /><sub><b>neisty</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=neisty" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/toreliza"><img src="https://avatars2.githubusercontent.com/u/8468060?v=4?s=100" width="100px;" alt="toreliza"/><br /><sub><b>toreliza</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=toreliza" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://isda.ncsa.illinois.edu"><img src="https://avatars1.githubusercontent.com/u/2375622?v=4?s=100" width="100px;" alt="Kenton McHenry"/><br /><sub><b>Kenton McHenry</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mchenry" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://abhishekdutta.org"><img src="https://avatars3.githubusercontent.com/u/722415?v=4?s=100" width="100px;" alt="Abhishek Dutta"/><br /><sub><b>Abhishek Dutta</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=thelinuxmaniac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://carver.cs.ua.edu"><img src="https://avatars2.githubusercontent.com/u/9202282?v=4?s=100" width="100px;" alt="JeffCarver"/><br /><sub><b>JeffCarver</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=JeffCarver" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="www.nicole-brewer.com"><img src="https://avatars2.githubusercontent.com/u/20686935?v=4?s=100" width="100px;" alt="Nicole Brewer"/><br /><sub><b>Nicole Brewer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=nicole-brewer" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="s-sajid-ali.github.io"><img src="https://avatars1.githubusercontent.com/u/30510036?v=4?s=100" width="100px;" alt="Sajid Ali"/><br /><sub><b>Sajid Ali</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=s-sajid-ali" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/frolovsa"><img src="https://avatars0.githubusercontent.com/u/55715838?v=4?s=100" width="100px;" alt="frolovsa"/><br /><sub><b>frolovsa</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=frolovsa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://eduardoarango.dev"><img src="https://avatars1.githubusercontent.com/u/15933089?v=4?s=100" width="100px;" alt="Carlos Eduardo Arango Gutierrez"/><br /><sub><b>Carlos Eduardo Arango Gutierrez</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ArangoGutierrez" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/clairecporter"><img src="https://avatars3.githubusercontent.com/u/3086036?v=4?s=100" width="100px;" alt="clairecporter"/><br /><sub><b>clairecporter</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=clairecporter" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lefebvre"><img src="https://avatars1.githubusercontent.com/u/70483?v=4?s=100" width="100px;" alt="Jordan P. Lefebvre"/><br /><sub><b>Jordan P. Lefebvre</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lefebvre" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maxhutch"><img src="https://avatars.githubusercontent.com/u/1538980?v=4?s=100" width="100px;" alt="Max Hutchinson"/><br /><sub><b>Max Hutchinson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=maxhutch" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jarrah42"><img src="https://avatars.githubusercontent.com/u/6130694?v=4?s=100" width="100px;" alt="Greg Watson"/><br /><sub><b>Greg Watson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jarrah42" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://civilfritz.net"><img src="https://avatars.githubusercontent.com/u/350294?v=4?s=100" width="100px;" alt="Jonathon Anderson"/><br /><sub><b>Jonathon Anderson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=anderbubble" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/exoticDFT"><img src="https://avatars.githubusercontent.com/u/18316938?v=4?s=100" width="100px;" alt="Alexander Koufos"/><br /><sub><b>Alexander Koufos</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=exoticDFT" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://newton.cx/~peter/"><img src="https://avatars.githubusercontent.com/u/59598?v=4?s=100" width="100px;" alt="Peter Williams"/><br /><sub><b>Peter Williams</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=pkgw" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://freelancerbrg.com"><img src="https://avatars.githubusercontent.com/u/1132451?v=4?s=100" width="100px;" alt="BRG"/><br /><sub><b>BRG</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=coolbrg" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://csmd.ornl.gov/profile/david-bernholdt"><img src="https://avatars.githubusercontent.com/u/426409?v=4?s=100" width="100px;" alt="David E. Bernholdt"/><br /><sub><b>David E. Bernholdt</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=bernhold" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sulab.org"><img src="https://avatars.githubusercontent.com/u/2635409?v=4?s=100" width="100px;" alt="Andrew Su"/><br /><sub><b>Andrew Su</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=andrewsu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chrisblanton"><img src="https://avatars.githubusercontent.com/u/43550454?v=4?s=100" width="100px;" alt="Christopher Blanton"/><br /><sub><b>Christopher Blanton</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=chrisblanton" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/castelao"><img src="https://avatars.githubusercontent.com/u/1903589?v=4?s=100" width="100px;" alt="Guilherme Castelão"/><br /><sub><b>Guilherme Castelão</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=castelao" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/roelofsaj"><img src="https://avatars.githubusercontent.com/u/14942055?v=4?s=100" width="100px;" alt="Abbey Roelofs"/><br /><sub><b>Abbey Roelofs</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=roelofsaj" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mtbc"><img src="https://avatars.githubusercontent.com/u/2630707?v=4?s=100" width="100px;" alt="Mark Carroll"/><br /><sub><b>Mark Carroll</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mtbc" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nicholdav.info/"><img src="https://avatars.githubusercontent.com/u/11934090?v=4?s=100" width="100px;" alt="David Nicholson"/><br /><sub><b>David Nicholson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=NickleDave" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bjoyce3"><img src="https://avatars.githubusercontent.com/u/11023317?v=4?s=100" width="100px;" alt="Blake Joyce"/><br /><sub><b>Blake Joyce</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=bjoyce3" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hackdna"><img src="https://avatars.githubusercontent.com/u/452575?v=4?s=100" width="100px;" alt="Ilya Sytchev"/><br /><sub><b>Ilya Sytchev</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=hackdna" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="oestergaard.dev"><img src="https://avatars.githubusercontent.com/u/34489999?v=4?s=100" width="100px;" alt="Emil Østergaard"/><br /><sub><b>Emil Østergaard</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=axrez" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://jhkennedy.org"><img src="https://avatars.githubusercontent.com/u/7882693?v=4?s=100" width="100px;" alt="Joseph H Kennedy"/><br /><sub><b>Joseph H Kennedy</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jhkennedy" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/crd477"><img src="https://avatars.githubusercontent.com/u/1130035?v=4?s=100" width="100px;" alt="Chad Dougherty"/><br /><sub><b>Chad Dougherty</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=crd477" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://cfwebprod.sandia.gov/cfdocs/CompResearch/templates/insert/dept.cfm?org=01424"><img src="https://avatars.githubusercontent.com/u/55767766?v=4?s=100" width="100px;" alt="Miranda Mundt"/><br /><sub><b>Miranda Mundt</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=mrmundt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/braney"><img src="https://avatars.githubusercontent.com/u/17574483?v=4?s=100" width="100px;" alt="Bryan Raney"/><br /><sub><b>Bryan Raney</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=braney" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://medium.com/@srbdev"><img src="https://avatars.githubusercontent.com/u/2583156?v=4?s=100" width="100px;" alt="sb"/><br /><sub><b>sb</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=srbdev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rkakodkar"><img src="https://avatars.githubusercontent.com/u/65554003?v=4?s=100" width="100px;" alt="rkakodkar"/><br /><sub><b>rkakodkar</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=rkakodkar" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tacaswell"><img src="https://avatars.githubusercontent.com/u/199813?v=4?s=100" width="100px;" alt="Thomas A Caswell"/><br /><sub><b>Thomas A Caswell</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=tacaswell" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AlfredoR-CSUF"><img src="https://avatars.githubusercontent.com/u/86503312?v=4?s=100" width="100px;" alt="Alfredo Rodriguez"/><br /><sub><b>Alfredo Rodriguez</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=AlfredoR-CSUF" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dylanmcreynolds"><img src="https://avatars.githubusercontent.com/u/40469975?v=4?s=100" width="100px;" alt="Dylan McReynolds"/><br /><sub><b>Dylan McReynolds</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=dylanmcreynolds" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jbteves"><img src="https://avatars.githubusercontent.com/u/26722533?v=4?s=100" width="100px;" alt="Joshua Teves"/><br /><sub><b>Joshua Teves</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jbteves" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chrisvam"><img src="https://avatars.githubusercontent.com/u/6949021?v=4?s=100" width="100px;" alt="chrisvam"/><br /><sub><b>chrisvam</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=chrisvam" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maffettone"><img src="https://avatars.githubusercontent.com/u/43007690?v=4?s=100" width="100px;" alt="Dr. Phil Maffettone"/><br /><sub><b>Dr. Phil Maffettone</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=maffettone" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lmilechin"><img src="https://avatars.githubusercontent.com/u/13963460?v=4?s=100" width="100px;" alt="Lauren Milechin"/><br /><sub><b>Lauren Milechin</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lmilechin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="adamcooper.sh"><img src="https://avatars.githubusercontent.com/u/14908880?v=4?s=100" width="100px;" alt="Adam Cooper"/><br /><sub><b>Adam Cooper</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=super-cooper" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.rafmudaf.com"><img src="https://avatars.githubusercontent.com/u/13797903?v=4?s=100" width="100px;" alt="Rafael M Mudafort"/><br /><sub><b>Rafael M Mudafort</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=rafmudaf" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://informaticsnerd.blogspot.com"><img src="https://avatars.githubusercontent.com/u/967970?v=4?s=100" width="100px;" alt="Luke R."/><br /><sub><b>Luke R.</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=lrasmus" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="www.davidbeckingsale.com"><img src="https://avatars.githubusercontent.com/u/334483?v=4?s=100" width="100px;" alt="David Beckingsale"/><br /><sub><b>David Beckingsale</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=davidbeckingsale" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rinkug"><img src="https://avatars.githubusercontent.com/u/768870?v=4?s=100" width="100px;" alt="Rinku Gupta"/><br /><sub><b>Rinku Gupta</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=rinkug" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/adamrubens"><img src="https://avatars.githubusercontent.com/u/126014033?v=4?s=100" width="100px;" alt="adamrubens"/><br /><sub><b>adamrubens</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=adamrubens" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/manning-ncsa"><img src="https://avatars.githubusercontent.com/u/56734137?v=4?s=100" width="100px;" alt="T. Andrew Manning"/><br /><sub><b>T. Andrew Manning</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=manning-ncsa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://burntfen.com"><img src="https://avatars.githubusercontent.com/u/910753?v=4?s=100" width="100px;" alt="Richard Littauer"/><br /><sub><b>Richard Littauer</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=RichardLitt" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="jamilgafur.com"><img src="https://avatars.githubusercontent.com/u/58782189?v=4?s=100" width="100px;" alt="Jamil Gafur"/><br /><sub><b>Jamil Gafur</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jamilgafur" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="henryburgess.net"><img src="https://avatars.githubusercontent.com/u/60735885?v=4?s=100" width="100px;" alt="Henry Burgess"/><br /><sub><b>Henry Burgess</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=henryjburg" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/peterfpeterson"><img src="https://avatars.githubusercontent.com/u/404003?v=4?s=100" width="100px;" alt="Pete Peterson"/><br /><sub><b>Pete Peterson</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=peterfpeterson" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://kevinbonham.com"><img src="https://avatars.githubusercontent.com/u/3502975?v=4?s=100" width="100px;" alt="Kevin Bonham"/><br /><sub><b>Kevin Bonham</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=kescobo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="blog.aaronholmes.net"><img src="https://avatars.githubusercontent.com/u/277061?v=4?s=100" width="100px;" alt="Aaron Holmes"/><br /><sub><b>Aaron Holmes</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=aholmes" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jbteves-sandia"><img src="https://avatars.githubusercontent.com/u/134551825?v=4?s=100" width="100px;" alt="jbteves-sandia"/><br /><sub><b>jbteves-sandia</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jbteves-sandia" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ksbeattie"><img src="https://avatars.githubusercontent.com/u/1534843?v=4?s=100" width="100px;" alt="Keith Beattie"/><br /><sub><b>Keith Beattie</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=ksbeattie" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://orcid.org/0000-0002-8999-9003"><img src="https://avatars.githubusercontent.com/u/6338509?v=4?s=100" width="100px;" alt="William F. Broderick"/><br /><sub><b>William F. Broderick</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=billbrod" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sanyatonwu"><img src="https://avatars.githubusercontent.com/u/155703270?v=4?s=100" width="100px;" alt="sanyatonwu"/><br /><sub><b>sanyatonwu</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=sanyatonwu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/davidbrownell"><img src="https://avatars.githubusercontent.com/u/6353056?v=4?s=100" width="100px;" alt="David Brownell"/><br /><sub><b>David Brownell</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=davidbrownell" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jperrsau-at-nrel"><img src="https://avatars.githubusercontent.com/u/171282530?v=4?s=100" width="100px;" alt="jperrsau-at-nrel"/><br /><sub><b>jperrsau-at-nrel</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jperrsau-at-nrel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="www.kristijanarmeni.net"><img src="https://avatars.githubusercontent.com/u/14061041?v=4?s=100" width="100px;" alt="Kristijan Armeni"/><br /><sub><b>Kristijan Armeni</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=KristijanArmeni" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jmelot"><img src="https://avatars.githubusercontent.com/u/1252409?v=4?s=100" width="100px;" alt="Jennifer Melot"/><br /><sub><b>Jennifer Melot</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=jmelot" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://budhram.com.np"><img src="https://avatars.githubusercontent.com/u/1132451?v=4?s=100" width="100px;" alt="Budh Ram Gurung (BRG)"/><br /><sub><b>Budh Ram Gurung (BRG)</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=brgnepal" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="www.ericrscott.com"><img src="https://avatars.githubusercontent.com/u/25404783?v=4?s=100" width="100px;" alt="Eric R. Scott"/><br /><sub><b>Eric R. Scott</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=Aariq" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="lentner.io"><img src="https://avatars.githubusercontent.com/u/8965948?v=4?s=100" width="100px;" alt="Geoffrey Lentner"/><br /><sub><b>Geoffrey Lentner</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=glentner" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.tinashemtapera.com"><img src="https://avatars.githubusercontent.com/u/15770644?v=4?s=100" width="100px;" alt="Tinashe Michael Tapera"/><br /><sub><b>Tinashe Michael Tapera</b></sub></a><br /><a href="https://github.com/USRSE/usrse.github.io/commits?author=TinasheMTapera" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
