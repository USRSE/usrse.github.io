---
title: Building and Running Containers on HPC Systems - A (not at all) Comprehensive Talk
subtitle: US-RSE Education & Training Seminar Series
expires: 2024-05-10
event_date: "May 10, 2024"
layout: event
duration: 120
repeated: false
category: education-training
time:
    - - start: 2024-05-10T17:00:00Z
        end: 2024-05-10T19:00:00Z
---

## US-RSE Education & Training Seminar Series

US-RSE periodically presents technical talks and tutorials related to Education & Training for RSEs.

## Event

The next technical talk of the US-RSE Education & Training Seminar Series will feature Subil Abraham who will speak about "Building and running containers on HPC systems - a (not at all) comprehensive talk."
This event will take place **Friday, May 10th at 1-3 PM ET, 12-2 PM CT, 11-1 PM MT, 10 AM - 12 PM PT**

*Abstract*: The use of containers on a typical HPC system is a little different from running it on your personal computer or in something like Kubernetes. You want it to be up and running in a way similar to the typical applications that are built on HPC systems and run via a scheduler, and still perform as good as the bare metal applications. Your users might need to be able to build their container images on your HPC system (on your login nodes or build nodes without root privileges) so that they are being built on the same environment as the typical applications, and especially important if your HPC system has an uncommon microarchitecture like ARM or PowerPC. Getting the performance needed for MPI enabled applications would mean hunting for your system’s MPI libraries and binding them into your container so that the application can link to it. And that’s just a few of the factors to consider. In this talk I’ll go over what we do to solve these and other problems on the HPC systems at ORNL and what lessons we learned in the process that can apply to your efforts to use containers at your HPC center.

*Learning Objectives*: 
1. Learn how containers work on an HPC system and how to support them
1. Learn the particularities of integrating containers with the native libraries and devices on an HPC system without losing performance

*Intended Audience*: Engineers looking to support containers at their HPC center, and users looking into using containers in their HPC work.


Attendees are expected to follow the [US-RSE Code of Conduct](https://us-rse.org/about/code-of-conduct/).

### Biography

Subil Abraham is an HPC Engineer in the Oak Ridge Leadership Computing Facility in the Oak Ridge National Laboratory. He spends half his time solving problems for scientists who contact the OLCF help desk with issues they have on the supercomputers, the other half testing containers and advocating for container functionality on the various systems the OLCF supports, and the third half is spent doing various other odd work in user training and user advocacy while being bad at math.

### Note

More information about this event can be found on [the flyer](https://drive.google.com/file/d/1_fEsaha4ged7TxWJGWmVYYy0d3DB_j7O).

### Registration

You can [register on Zoom](https://mit.zoom.us/meeting/register/tJAqcuuuqD4oGdBu6MCy5MQv8JUC6tMA2nL_) for this technical talk.
