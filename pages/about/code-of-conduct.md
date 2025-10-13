---
layout: page
title: Code of Conduct
permalink: /about/code-of-conduct/
subtitle: The US-RSE Association Code of Conduct.
menubar: about
set_last_modified: true
last_modified_repo: USRSE/documents
last_modified_path: code-of-conduct.md
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

<h2>Code of Conduct Committee</h2>

<p>
    The current Code of Conduct Committee consists of:
    <ul>
        <li> Ludovico Bianchi</li>
        <li> Suzanne Prentice</li>
        <li> J.C. Subida</li>
    </ul>
    You may reach any of them on the US-RSE slack individually or email <a href="mailto:coc@us-rse.org">coc@us-rse.org</a> in order to contact them.
</p>
