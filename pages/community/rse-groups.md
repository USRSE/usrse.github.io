---
layout: page
title: Organizations with RSEs
permalink: /rse-groups/
---


<table id="t01" style="margin-top:50px">
  <tr>
    <th>Organization</th>
    <th>Group/Department</th> 
  </tr>
{% for entry in site.data.map %}{% if entry.type == "group" %}<tr>
    <td>{% if entry.institution %}{{ entry.institution }}{% else %}{{ entry.name }}{% endif %}</td>
    <td><a href="{{ entry.url }}">{{ entry.name }}</a></td> 
</tr>{% endif %}{% endfor %}
</table>


Want to have your organization on the list? Contact us via [Slack](https://usrse.slack.com).
