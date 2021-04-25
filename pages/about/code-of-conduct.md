---
layout: page
title: Code of Conduct
permalink: /code-of-conduct/
subtitle: The US-RSE Association Code of Conduct.
menubar: about
---

<div id="code-of-conduct" style="display:none"></div>

<br><br>

<p>This code of conduct is served from <a href="https://github.com/USRSE/documents/blob/master/code-of-conduct.md" target="_blank">USRSE/documents</a> on GitHub. You can
make contributions or suggestions for changes there.

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
