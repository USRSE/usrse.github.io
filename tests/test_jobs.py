#!/usr/bin/env python

# Read in the jobs.yml file to validate each entry. Required are:
# - name: "Research Software Engineer"
#   location: Princeton, NJ
#   url: https://main-princeton.icims.com/jobs/
#   expires: 2019-07-01

import unittest
import requests
import yaml
import datetime
import os

here = os.path.dirname(os.path.abspath(__file__))

print("############################################################# test_jobs")

class TestJobs(unittest.TestCase):

    def setUp(self):
        self.jobs = os.path.join(os.path.dirname(here), '_data', 'jobs.yml')
       
    def test_loading_file(self):
        '''test loading of the yaml file
        '''
        print("Testing loading of the jobs.yml file")
        self.assertTrue(os.path.exists(self.jobs))
        with open(self.jobs, 'r') as stream:
            jobsdata = yaml.safe_load(stream)

    def test_content(self):
        '''validate required fields are provided
        '''
        print("validate required fields are provided")
        with open(self.jobs, 'r') as stream:
            jobs = yaml.safe_load(stream)

        requireds = ['name', 'location', 'url', 'expires']
        for entry in jobs:

            print("Testing %s" % entry)
            for required in requireds:
                print('Looking for %s' % required)
                self.assertTrue(required in entry)

            # Disabled for now, linkedin not reliably 200!
            # Test that url is 200
            # response = requests.head(entry['url'], headers={"User-Agent": "us-rse.org"})
            # self.assertTrue(response.status_code in [200, 300])
 
            # Location and name must not be null
            for field in ['location', 'name']:
                self.assertTrue(entry[field] not in ['', None])

            # Expires must be a valid YYYY-MM-DD
            self.assertTrue(isinstance(entry['expires'], datetime.date))

if __name__ == '__main__':
    unittest.main()
