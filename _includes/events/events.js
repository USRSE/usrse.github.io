{%- assign events = '' | split: '' -%}
{%- assign event_ids = '' | split: '' -%}
{%- for post in site.events -%}
  {%- if post.time -%}
        {%- assign events = events | push: post -%}
        {%- capture post_id -%}{{ post.id | split: '/' | last }}{%- endcapture -%}
        {%- assign event_ids = event_ids | push: post_id -%}
  {%- endif -%}
{%- endfor -%}
{%- for complement in site.data.event_complements -%}
    {%- for post_id in complement.complements -%}
        {%- if event_ids contains post_id -%}
            {%- assign events = events | push: complement -%}
            {%- break -%}
        {%- endif -%}
    {%- endfor -%}
{%- endfor -%}
{%- for post in events -%}
  {% include events/event.js onclick=include.onclick %}{% if forloop.last %}{% else %},{% endif %}
{%- endfor -%}
