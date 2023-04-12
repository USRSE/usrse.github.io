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
 - [https://us-rse.org/feeds/dei.xml](https://us-rse.org/feeds/dei.xml): subscribe to DEI working group events
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
