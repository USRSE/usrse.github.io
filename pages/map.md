---
layout: page
title: USRSE Map
description: Where are the RSE groups and RSE blog authors on the map?
permalink: /map/
---

<style>
.page-heading {
    padding-bottom: 10px !important;
}
.container {
   max-width: 1440px;
}
</style>

<p style='text-align:center'>Where are the RSEs that participate in this community on the map?</p>

<div id="map-container" style="height:800px"></div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css"
      integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
      crossorigin=""/>

<script src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"
     integrity="sha512-GffPMF3RvMeYyc1LWMHtK8EbPv0iNZ8/oTtHPx9/cc2ILxQ+u905qIwdpULaqDkyBKgOaB57QTMg7ztg8Jm2Og=="
     crossorigin=""></script>

{% include map.html %}

<br/>
<br/>
Map made with [leafletjs](http://leafletjs.com), and [Open Streetmap](https://osm.org/), and idea from [DE-RSE](https://github.com/DE-RSE/www). Thank you!
