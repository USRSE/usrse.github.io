---
title: US-RSE Showcase
layout: page
title: Recent US-RSE Community Work
description: A showcase of US-RSE community work
menubar: showcase
permalink: /showcase/
---

<style>
.link-preview {
  margin: auto;
  display: block;
  font-weight: normal;
  text-decoration: none;
  max-width: 500px;
}

.link-preview + .link-preview {
  margin-top: 1rem;
}
</style>
<script src="https://cdn.jsdelivr.net/npm/microlinkjs@latest/umd/microlink.min.js"></script>

<div class="card-group mt-2">

{% assign posts = site.data.showcase | sort: "published" | reverse %}
{% for post in posts %}
<div class="col-lg-6 my-3 wow animated fadeIn alltags {% for tag in post.tags %}tag-{{ tag }} {% endfor %}" data-wow-delay=".15s">
  <a href="{{ post.url }}" class="article card {% cycle 'bg-usrse', 'bg-usrse-1' %}">
    <div class="card-body">
       <span data-id="tag-{{ post.category }}" class="tag badge badge-info">{{ post.category }}</span>
       <a src="{{ post.url }}" 
          href="{{ post.url }}"
          target="_blank"
          style="margin-top:10px"
          class="link-preview">{{ post.title }}: {{ post.description }}</a>
      </div>
      </a>
    </div>
  {% endfor %}
</div>

<script>
microlink('.link-preview', { size: 'small', rounded: true });
</script>
