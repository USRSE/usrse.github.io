## 🧑‍💼 Recent Job Postings 🧑‍💼

<a name="jobs"></a>

```{=markdown}
{% assign today = 'now' | date: "%Y-%m-%d" %}
<ul>
{% for job in site.data.jobs %}
  {% assign expires_formatted = job.expires | date: "%Y-%m-%d" %}
  {% if expires_formatted >= today %}
    <li>
      <strong><a href="{{ job.url }}" target="_blank" rel="noopener">{{ job.name }}</a></strong><br>
      📍 {{ job.location }}<br>
      🗓️ Posted: {{ job.posted }} | Expires: {{ job.expires }}
    </li>
  {% endif %}
{% endfor %}
</ul>

### Other Job Boards

<ul>
{% for board in site.data.job-boards.boards %}
  <li><a href="{{ board.url }}" target="_blank">{{ board.name }}</a></li>
{% endfor %}
</ul>
```

You can learn more about job boards in the `#jobs` Slack channel!

----------