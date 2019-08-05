#!/usr/bin/env python

# Read in the events.yml file to validate each entry. Required are:
# - name: "PEARC19"
#  location: Chicago, IL
#  url: https://www.pearc19.pearc.org/
#  expires: 2019-08-01
#  description: Description of the event

import unittest
import requests
import yaml
import datetime
import os

here = os.path.dirname(os.path.abspath(__file__))

print("########################################################### test_events")

class TestEvents(unittest.TestCase):

    def setUp(self):
        self.events = os.path.join(os.path.dirname(here), '_data', 'events.yml')
       
    def test_loading_file(self):
        '''test loading of the yaml file
        '''
        print("Testing loading of the events.yml file")
        self.assertTrue(os.path.exists(self.events))
        with open(self.events, 'r') as stream:
            eventsdata = yaml.safe_load(stream)

    def test_content(self):
        '''validate required fields are provided
        '''
        print("validate required fields are provided")
        with open(self.events, 'r') as stream:
            events = yaml.safe_load(stream)

        requireds = ['name', 'location', 'url', 'expires', 'description']
        for entry in events:

            # All fields required and not null
            print("Testing %s" % entry)
            for field in requireds:
                print('Looking for %s' % field)
                self.assertTrue(field in entry)
                self.assertTrue(entry[field] not in ['', None])

            # Expires must be a valid YYYY-MM-DD
            self.assertTrue(isinstance(entry['expires'], datetime.date))

if __name__ == '__main__':
    unittest.main()
