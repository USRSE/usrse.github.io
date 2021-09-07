---
layout: page
title: Archive of Events by Categories
permalink: /events/category/
collection: events
---

<div class="row">
    <div class="col-md-12">
       <a style="float:right" type="button" class="btn btn-sm btn-warning" href="{{ site.baseurl }}/events/">Back to Events</a>
    </div>
</div>


{% include scrolltop.html %}

{% assign collection = site[page.collection] %}
{% include group-by-array.html collection=collection field="category" %}

<ul class="taxonomy__index">
  {% for category in group_names %}
  {% assign category_name = site.data.events.names[category].name | default: category %}
    <li style="list-style:none">
      <a href="#{{ category | slugify | downcase }}">
        <strong>{{ category_name }}</strong> <span class="badge badge-warning" style="margin:auto; margin-right:0px">{{ group_items[forloop.index0] | size }}</span>
      </a>
    </li>
  {% endfor %}
</ul>

{% for category in group_names %}
  {% assign category_name = site.data.events.names[category].name | default: category %}
  {% assign posts = group_items[forloop.index0] %}
      {% include events/events-subcollection-all.html collection=posts sort_by=page.sort_by sort_order=page.sort_order type=page.entries_layout category=category category_name=category_name %}
{% endfor %}
