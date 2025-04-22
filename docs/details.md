Details on how the website works to supplement README.md


## Advanced Content Questions

### How do I update the map?

The [map](https://us-rse.org/usrse-map/) is generated programmatically from the US-RSE member list by a separate repository https://github.com/USRSE/usrse-map.  If you
have already [joined US-RSE](https://us-rse.org/join) and provided your location,
you should be represented on it. If you see any issues or errors with location
lookup (we use geolocation of a named location) please [open an issue](https://github.com/USRSE/usrse-map/issues).

### How do I add a page redirect?

We have a special header field that you can define if you want a page to redirect 
elsewhere. We do this by way of a meta tag, and we give the viewer 2 seconds
to see a message that they are being redirected.  To keep these pages
organized, we have them located in the `redirects` folder.  

Files in this folder should have the following format:

```yaml
---
layout: page
title: **PAGE TITLE**
permalink: **LINK TO BE REDIRECTED**
redirect: **ACTUAL LINK**
---
```

Example

```yaml
---
layout: page
title: US-RSE Community Building Workshop
permalink: /2020-april-workshop/
redirect: https://us-rse.org/first-community-workshop
---
```

The above says that the page titled "US-RSE Community Building Workshop" served
at permalink /2020-april-workshop will be redirected to 
https://us-rse.org/first-community-workshop.


### How do I embed a video?

If you have a YouTube video to embed, we have an include that will make it easy
to embed a full-width, fullscreen-enabled video! Simply do:

```
{% include youtube-embed.html url="https://www.youtube.com/embed/gP5UCfV3n-A"  title="Video Title" %}
```

where the url is the embed URL that is provided to you when you click to share
and then embed (note that "embed" is in the URL) and the title is a title of your
choosing. You are not required to include a title, and it will default to a generic
"YouTube video player."

### How do I add a "Last Modified:" date to a page?

All pages have the option to include a "last modified" date, which will default to the bottom
right of the page. This means to add a last modified date to a page, simply update the header as follows:

```yaml
set_last_modified: true
```

### How do I add an organizational member?

The organizational members page will automatically populate the bottom of the
page once you modify the `_data/org-members.yaml` file and add their logo image
to `assets/img/org-logos`.
The `_data/org-members.yaml` file has three arrays for each tier we have.
If the member is a "Basic" tier member, you would add them in the `basic:`
section.
Each entry takes the following variables:

`name`
: The full name of the member (used to fill the alt option of the img)

`url`
: The URL the organization wants their logo to redirect if clicked

`figure`
: The filename, with extension, of the image (do not include the path)

`acronym` (optional)
: An acronym of the member (if included, it will be part of the alt option of
  the img)

`date_joined` [format: `YYYY-MM-DD`]
: When the member joined/paid (used to order the logos in each tier)

`founding_member`
: Whether the member is a founding member (currently not used)

`tier`
: The tier they paid for (also the section the entry is in)

`contact` [format: `First Last <email@example.com>`]
: The main point of contact for the organization


Make sure you add each logo to `assets/img/org-logos` directory.
Generally, the images have been named with the following format
`logo-acronym-institution`, but this isn't strict.
There is a [form](https://forms.gle/xXREVtJB2z6Ux1rA7) for people to use to
provide the details above.