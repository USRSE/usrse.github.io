## 📚 Featured Reads, Videos, and Podcasts 📚

<a name="reads"></a>

```{=markdown}
{% assign refs = site.data.newsletter_bib_yml.references 
  | where_exp: "r", "r.annote contains 'Read_Status: To Read'" %}

{% assign professional = refs | where: "type", "article-journal" %}

{% if professional.size > 0 %}
### 📑 Recent Publications
{% for ref in professional %}
{% include citation-publication.html ref=ref %}
{% endfor %}
{% endif %}

{% assign podcasts = refs | where: "type", "song" %}

{% if podcasts.size > 0 %}
### 🎧 Podcast Episodes
{% for ref in podcasts %}
{% include citation-podcast.html ref=ref %}
{% endfor %}
{% endif %}

{% assign other = refs | where: "type", "webpage" %}

{% if other.size > 0 %}
### 📇 Blog Posts & Other Reads
{% for ref in other %}
{% include citation.html ref=ref %}
{% endfor %}
{% endif %}
```

Did you read something interesting this week? Want to share your own publications in the community? Reach out on Slack in the `#newsletters` channel!

-----------