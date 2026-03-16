## 🏃 Get Involved! 🏃

<a name="involved"></a>

US-RSE Working Groups:

```{=html}
{% assign wgs = site.data.menus["working-groups"][0].items %}
<ul>
{% for wg in wgs %}
  <li><a href="{{ site.baseurl }}/{{ wg.link }}">{{ wg.name }}</a></li>
{% endfor %}
</ul>
```

------------