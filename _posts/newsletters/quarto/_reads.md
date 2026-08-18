## 📚 Featured Reads, Videos, and Podcasts 📚

<a name="reads"></a>

### 📑 Recent Publications
```{=markdown}
{% assign article_refs = site.data.newsletter.articles.references
  | where_exp: "r", "r.annote contains 'Read_Status: To Read'" %}

{% if article_refs.size > 0 %}
{% for ref in article_refs %}
{% include citation-article.html ref=ref %}
{% endfor %}
{% endif %}
```

### 📇 Blog Posts & Other Reads

```{=markdown}
{% assign blog_refs = site.data.newsletter.blogs.references
  | where_exp: "r", "r.annote contains 'Read_Status: To Read'" %}

{% if blog_refs.size > 0 %}
{% for ref in blog_refs %}
{% include citation-blog.html ref=ref %}
{% endfor %}
{% endif %}
```


### 🎧 Podcast Episodes, Videos, and More
```{=markdown}
{% assign media_refs = site.data.newsletter.media.references
  | where_exp: "r", "r.annote contains 'Read_Status: To Read'" %}

{% if media_refs.size > 0 %}
{% for ref in media_refs %}
{% include citation-media.html ref=ref %}
{% endfor %}
{% endif %}

```

Did you read something interesting this week? Want to share your own publications in the community? Reach out on Slack in the `#newsletters` channel!

-----------