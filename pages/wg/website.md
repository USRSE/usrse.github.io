---
layout: page
title: Website Working Group
subtitle:
permalink: /wg/website/
---

# Overview

The website working group was established to work on the website that you are reading right now! To get involved with the website working group, visit the [`#website`](https://usrse.slack.com/messages/website) channel on the US-RSE slack. This page include some additional information about content on the site.


## Feeds

Added in early 2022, we wanted an ability to provide easy ways to automate specific events, or subscribe
to them. For the reason, we added differet kinds of programmatic subscriptions or feeds that include:

 - rss feeds for different kinds of content
 - equivalent json feeds for the same.
 
The rss feeds are intended to be subscribed to by an appropriate service, while the json API is
more suitable for a client tool.

### RSS (xml) Feeds:

For each RSS feed, we provide the latest 100 items.

 - [https://us-rse.org/feed.xml](https://us-rse.org/feed.xml): subscribe to posts on the US-RSE site
 - [https://us-rse.org/feeds/events.xml](https://us-rse.org/feeds/events.xml): subscribe to all US-RSE events.
 - [https://us-rse.org/feeds/newsletters.xml](https://us-rse.org/feeds/newsletters.xml): subscribe to a subset of newsletter posts
 - [https://us-rse.org/feeds/dei.xml](https://us-rse.org/feeds/del.xml): subscribe to DEI working group events

### Json Feeds:

JSON feeds are not limited in number, and we can provide this until a single page is not reasonable to load.

 - [https://us-rse.org/api/posts.json](https://us-rse.org/api/posts.json): json list of US-RSE posts, all types
 - [https://us-rse.org/api/events.json](https://us-rse.org/api/events.json): json list of US-RSE events 
 - [https://us-rse.org/api/newsletters.json](https://us-rse.org/api/posts.json): json list of US-RSE newsletters
 - [https://us-rse.org/api/dei.json](https://us-rse.org/api/dei.json): json list of dei events

If you are looking for a feed that does not exist, please [let us know](https://github.com/USRSE/usrse.github.io/issues).
