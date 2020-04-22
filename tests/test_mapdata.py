#!/usr/bin/env python

# Read in the map.yml file to validate each entry. Specifically:
# A name, url, and coord is required.
# optional fields are institution, image
# This test was removed April 2020 as the map is at github.com/USRSE/usrse-map

import unittest
import requests
import yaml
import os


here = os.path.dirname(os.path.abspath(__file__))

print("############################################################## test_map")

class TestMap(unittest.TestCase):

    def setUp(self):
        self.map = os.path.join(os.path.dirname(here), '_data', 'map.yml')
       
    def test_loading_file(self):
        '''test loading of the yaml file
        '''
        print("Testing loading of the map.yml file")
        self.assertTrue(os.path.exists(self.map))
        with open(self.map, 'r') as stream:
            mapdata = yaml.safe_load(stream)

    def test_content(self):
        '''validate required fields are provided
        '''
        print("validate required fields are provided")
        with open(self.map, 'r') as stream:
            mapdata = yaml.safe_load(stream)

        requireds = ['name', 'coords', 'url', 'type']
        for entry in mapdata:

            print("Testing %s" % entry)
            for required in requireds:
                print('Looking for %s' % required)
                self.assertTrue(required in entry)

            # Test that url is 200
            response = requests.head(entry['url'], headers={"User-Agent": "us-rse.org"})
            self.assertTrue(response.status_code in [200, 300])
 
            # Type must be group or person
            self.assertTrue(entry['type'] in ['group', 'person'])

            # Image must exist
            if 'image' in entry:
                response = requests.get(entry['image'])
                self.assertTrue(response.status_code == 200)

            # Coords must be length 2, and int
            self.assertTrue(len(entry['coords'])==2)
            for coord in entry['coords']:
                self.assertTrue(isinstance(coord, float))

if __name__ == '__main__':
    unittest.main()
