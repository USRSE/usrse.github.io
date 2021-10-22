{%- assign occurrence_name = "" -%}
{%- for occurrence in post.time -%}
{%- if forloop.index > 1 -%}
  {%- capture occurrence_name %} (occurrence #{{ forloop.index }}){% endcapture -%}
{%- endif -%}
{%- assign is_last = forloop.last -%}
{%- for time in occurrence -%}
{
  title  : "{{ post.title }}{{ occurrence_name }}{% unless forloop.first %} (continued){% endunless %}",
  {%- if include.onclick == 'tag' %}
  {%- if post.id %}
  url    : "#{{ post.id | split: '/' | last }}",
  {%- endif %}
  {%- else %}
  {%- if post.url %}
  url    : "{{ post.url | relative_url }}",
  {%- endif %}
  {%- endif %}
  {% if post.repeated %}
  {% if post.rrule %}
  rrule: "{% for line in post.rrule %}{{ line }}{% if forloop.last %}{% else %}\n{% endif %}{% endfor %}",
  {% else %}
  rrule: {
    {% if post.frequency %}freq: '{{ post.frequency }}',{% endif %}
    {% if post.interval %}interval: '{{ post.interval }}',{% endif %}
    {% if post.bymonthday %}bymonthday: [{% for d in post.bymonthday %}"{{ d }}"{% if forloop.last %}{% else %},{% endif %}{% endfor %}],{% endif %}
    {% if post.bymonth %}bymonth: [{% for wd in post.bymonth %}"{{ wd }}"{% if forloop.last %}{% else %},{% endif %}{% endfor %}],{% endif %}
    {% if post.byweekno %}byweekno: [{% for wd in post.byweekno %}"{{ wd }}"{% if forloop.last %}{% else %},{% endif %}{% endfor %}],{% endif %}
    {% if post.byweekday %}byweekday: [{% for wd in post.byweekday %}"{{ wd }}"{% if forloop.last %}{% else %},{% endif %}{% endfor %}],{% endif %}
    until: '{{ post.until }}',
    dtstart: '{{ post.date_start }}', // required
  },{% endif %}
  {% endif %}
  allDay : {% if post.all_day %}true{% else %}false{% endif %},
  category : "{{ post.category }}",
  color  : "#474747",
  classNames: ["usrse-event"],
  {% unless time.end %}// {% endunless %}end    : '{{ time.end | date_to_xmlschema }}',
  start  : '{{ time.start | date_to_xmlschema }}'
}{% unless forloop.last and is_last %},{% endunless %}
{%- endfor -%}
{%- endfor -%}
