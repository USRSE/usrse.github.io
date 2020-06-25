---
layout: page
title: Code of Conduct
permalink: /code-of-conduct/
subtitle: The US-RSE Association Code of Conduct.
---

<div id="code-of-conduct" style="display:none"></div>

<br><br>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script src="{{ site.baseurl }}/assets/js/showdown.min.js"></script>

<script>
$(document).ready(function(){

    url = "https://raw.githubusercontent.com/USRSE/documents/master/code-of-conduct.md"
    $.get(url, function(data) {

        var converter = new showdown.Converter(),
                 html = converter.makeHtml(data);

        $('#code-of-conduct').html(html)
        $('#code-of-conduct').show();
    });

});
</script>
