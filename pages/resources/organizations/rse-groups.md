---
layout: page
title: Organizations with RSEs
subtitle: Organizations around the United States that employ groups of RSEs
menubar: organizations
permalink: /resources/organizations/rse-groups/
---
<style>
table#rse-groups {
    display: table;
    font-size: 1em;
    margin-left: auto;
    margin-right: auto;
    width: auto;
}

#rse-groups th {
    font-weight: bold;
}

#rse-groups th:nth-child(1) {
    text-align: right;
	padding-right: 2em;
}

#rse-groups th:nth-child(2) {
    text-align: left;
}

#rse-groups td.institution {
    text-align: right;
	padding-right: 2em;
}

#rse-groups td.name {
    text-align: left;
}

#rse-groups td {
	vertical-align: middle;
}
</style>

<table id="rse-groups">
  <tr>
    <th class="highlight">Organization</th>
    <th class="highlight">Group or Department</th>
  </tr>
{% assign rowspan_remaining = 0 %}
{% for group in site.data.rse-groups | sort: "institution" %}
  <tr>
  {% if rowspan_remaining == 0 %}
    {% assign matches = site.data.rse-groups | where: "institution", group.institution %}
    {% assign rowspan_remaining = matches.size %}
    {% if group.name %}
      {% if rowspan_remaining > 1 %}
    <td class="institution" rowspan="{{ rowspan_remaining }}">{{ group.institution }}</td>
      {% else %}
    <td class="institution">{{ group.institution }}</td>
      {% endif %}
    <td class="name"><a href="{{ group.url }}">{{ group.name }}</a></td>
    {% else %}
    <td class="institution"><a href="{{ group.url }}">{{ group.institution }}</a></td>
    <td></td>
    {% endif %}
  {% else %}
    <td class="name"><a href="{{ group.url }}">{{ group.name }}</a></td>
  {% endif %}
  {% assign rowspan_remaining = rowspan_remaining | minus:1 %}
  </tr>
{% endfor %}
</table>

Want to have your organization on the list? Contact us via [Slack](https://usrse.slack.com).
