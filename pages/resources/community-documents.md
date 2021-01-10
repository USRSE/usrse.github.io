---
title: Community Documents
permalink: /community-documents/
---

Community documents are living documents, meaning that community members are encouraged to
work on them over time, and they are not associated with a specific date.

{% for document in site.docs %}
<h3><a target="_blank" href="{{ site.url }}{{ document.url }}" target="_blank">{{ document.title }}</a></h3>
<div style="margin:0px; padding:0px;"><em>{{ document.subtitle }}</em></div>
<br>
{% endfor %}
