---
layout: page
permalink: /governance/
subtitle: The US-RSE Association Governance
menubar: about
---

<div id="governance" style="display:none"></div>

<br><br>

<p>This document is served from <a href="https://github.com/USRSE/documents/blob/master/governance.md" target="_blank">USRSE/documents</a> on GitHub. You can make contributions or suggestions for changes there.

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script src="{{ site.baseurl }}/assets/js/showdown.min.js"></script>

<script>
$(document).ready(function(){

    url = "https://raw.githubusercontent.com/USRSE/documents/master/governance.md"
    $.get(url, function(data) {

        var converter = new showdown.Converter(),
                 html = converter.makeHtml(data);

        $('#governance').html(html)
        $('#governance').show();
    });

});
</script>
