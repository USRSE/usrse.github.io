---
layout: wide
title: Calendar
description: Calendar of US-RSE Events
permalink: /calendar/
---

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/3.1.0/fullcalendar.css" />
<style>
#calendar {
	width: 100%;
	margin: 0 auto;
}
</style>

<div id='calendar'></div>

<script src='https://code.jquery.com/jquery-1.11.2.min.js'></script>
<script src='https://code.jquery.com/ui/1.11.2/jquery-ui.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/2.2.6/fullcalendar.min.js'></script>

<script>
$(document).ready(function() {

var defaultEvents = [

{% for event in site.events %} {% if event.event_start != nil %}{
{% if event.repeated == true %}
    id: 111,
    title: '{{ event.title }}',
    start: '{{ event.event_start }}',
    end: '{{ event.event_end }}',
    className: 'scheduler_basic_event',
    {% if event.day_of_week %}dow: [{{ event.day_of_week }}],{% endif %}
    url: "{{ site.url }}{{ event.url }}",
    location: "{{ event.location }}",
    repeat: 1,
{% else %}
    title: '{{ event.title }}',
    start: '{{ event.event_start | date_to_xmlschema }}',
    end: '{{ event.event_end | date_to_xmlschema }}',
    className: 'scheduler_basic_event',
    url: "{{ site.url }}{{ event.url }}",
    location: "{{ event.location }}"
{% endif %} },{% endif %}
{% endfor %}

/* Examples
  {
    // Just an event
    title: 'Long Event',
    start: '2017-02-07',
    end: '2017-02-10',
    className: 'scheduler_basic_event'
  },
  {
    // Custom repeating event
    id: 999,
    title: 'Repeating Event',
    start: '2017-02-09T16:00:00',
    className: 'scheduler_basic_event'
  },
  {   
    // Monthly event
    id: 111,
    title: 'Meeting',
    start: '2000-01-01T00:00:00',
    className: 'scheduler_basic_event',
    repeat: 1
  },
  {
    // Annual avent
    id: 222,
    title: 'Birthday Party',
    start: '2017-02-04T07:00:00',
    description: 'This is a cool event',
    className: 'scheduler_basic_event',
    repeat: 2
  },
  {
    // Weekday event
    title: 'Click for Google',
    url: 'http://google.com/',
    start: '2017-02-28',
    className: 'scheduler_basic_event',
    dow: [1,5]
  }*/
];

// Monthly repeat flag is 1
var REPEAT_MONTHLY = 1;
// Yearly repeat flag is 2
var REPEAT_YEARLY = 2;
    
$('#calendar').fullCalendar({
  header: {
		left: 'prev,next today',
		center: 'title',
		right: 'month,agendaWeek,agendaDay'
	},
  editable: true,
	eventSources: [defaultEvents],

  dayRender: function(date, cell) {
    // Get all events
    var events = $('#calendar').fullCalendar('clientEvents').length ? $('#calendar').fullCalendar('clientEvents') : defaultEvents;
		// Start of a day timestamp
    var dateTimestamp = date.hour(0).minutes(0);
    var recurringEvents = new Array();    
    var monthlyEvents = events.filter(function (event) {
      return event.repeat === REPEAT_MONTHLY &&
        event.id &&
        moment(event.start).hour(0).minutes(0).diff(dateTimestamp, 'months', true) % 1 == 0
    });
    
    // find all events with monthly repeating flag, having id, repeating at that day few years ago  
    var yearlyEvents = events.filter(function (event) {
      return event.repeat === REPEAT_YEARLY &&
        event.id &&
        moment(event.start).hour(0).minutes(0).diff(dateTimestamp, 'years', true) % 1 == 0
    });

    recurringEvents = monthlyEvents.concat(yearlyEvents);

    $.each(recurringEvents, function(key, event) {
      var timeStart = moment(event.start);

      // Refetching event fields for event rendering 
      var eventData = {
        id: event.id,
        allDay: event.allDay,
        title: event.title,
        dow: event.daysOfWeek,
        description: event.description,
        start: date.hour(timeStart.hour()).minutes(timeStart.minutes()).format("YYYY-MM-DD"),
        end: event.end ? event.end.format("YYYY-MM-DD") : "",
        url: event.url,
        className: 'scheduler_basic_event',
        repeat: event.repeat
      };
			
      // Removing events to avoid duplication
      $('#calendar').fullCalendar( 'removeEvents', function (event) {
          return eventData.id === event.id &&
          moment(event.start).isSame(date, 'day');      
      });
      // Render event
      $('#calendar').fullCalendar('renderEvent', eventData, true);

    });

  }
});

});

</script>
