## 👀 Interesting Events and Opportunities 👀

<a name="events"></a>

```{=html}
{% assign today = "now" | date: "%Y-%m-%d" %}
{% for opp in site.data.newsletter-events-opportunities %}
{% assign expires = opp.expires | date: "%Y-%m-%d" %}
{% if opp.type == "opportunity" and expires >= today %}
{% include opportunity-box.html
  title=opp.title
  when=opp.when
  where=opp.where
  preamble=opp.preamble
  links=opp.links
%}
{% endif %}
{% endfor %}
```

```{=html}
{% for event in site.data.newsletter-events-opportunities %}
{% assign expires_formatted = event.expires | date: "%Y-%m-%d" %}
{% if expires_formatted >= today %}
{% if event.type == "event" %}  
{% include event-box.html 
  title=event.title 
  when=event.when
  where=event.where
  preamble=event.preamble
  links=event.links
%}
{% endif %}
{% endif %}
{% endfor %}
```

Have an event or opportunity you want to promote? Reach out on Slack in the `#newsletters` channel!

---------