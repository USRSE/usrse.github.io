
# Update counts will retrieve counts via a csv, and then update the yaml file
# https://docs.google.com/spreadsheets/d/1FTnl8ucFKYtiS2xhNiK8VwXeE5BuBDCzL_k9SbqyG6A/edit#gid=1109363929
# requests is required
# Copyright @vsoch, 2019

import os
import csv
from datetime import datetime, timedelta
import requests
import shutil
import sys
import tempfile

here = os.path.dirname(os.path.abspath(__file__))

def get_filepath():
    '''load the counts file.
    '''
    filepath = os.path.join(os.path.dirname(here), '_data', 'memberCounts.csv')

    # Exit on error if we cannot find file
    if not os.path.exists(filepath):
        print("Cannot find %s" % filepath)

    return filepath

def read_rows(filepath, newline='', delim=','):
    '''read in the data rows of a csv file.
    '''
    # Read in the entire membership counts
    with open(filepath, newline=newline) as infile:
        reader = csv.reader(infile, delimiter=delim)
        data = [row for row in reader]
    return data

    
def main():
    '''a small helper to update the _data/memberCounts.csv file.
    '''
    # We will read through file, and write entry for current month.
    filepath = get_filepath()

    # A csv download for just the worksheet with summary counts
    sheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBn_kgBH8WoFmqdRJYdw8GrmfvjbdWIMYCk-yxelaE8aUO3J0rY19_wPOI9HHW0U0tc5Bg19uApPzx/pub?gid=1109363929&single=true&output=csv"
 
    # Ensure the response is okay
    response = requests.get(sheet)
    if response.status_code != 200:
        print('Error with getting sheet, response code %s: %s' %(response.status_code, response.reason))
        sys.exit(1)

    # Split lines by all sorts of fugly carriage returns
    lines = response.text.split('\r\n')

    # Get the value for last month: this month minus 3 days (to be safe)
    target_month = (datetime.now() - timedelta(days=3)).strftime('%B') # August
    previous_month = (datetime.now() - timedelta(days=50)).strftime('%B') # July
    year = datetime.now().strftime('%Y')

    # If we are at December, we need to subtract one from the year
    if target_month == "December":
        year = (datetime.now() - timedelta(days=3)).strftime('%Y') # previous year

    # By July 2021 we'll need to drag the equation to extend it, alert user
    count = None
    target = "%s %s" %(target_month, year)
    for line in csv.reader(lines, quotechar='"', delimiter=',',
                           quoting=csv.QUOTE_ALL, skipinitialspace=True):
        if target == line[0]:
            print('Found target: %s' % target)
            count = line[1]
            total = line[2]
            break        

    # The count wasn't found!
    if not count:
        print('Could not find count for target %s, check RSE Response Spreadsheet' % target)
        sys.exit(1)

    # Finally, update data file
    _, tmpfile = tempfile.mkstemp(prefix='membershipCounts-', suffix=".csv")

    # [['August, 2019', '22', '168']...]
    data = read_rows(filepath)

    # The last row must be the previous month year, unless December, then it's next year
    if previous_month == "December":
        last_row = "%s %s" %(previous_month, int(year)-1)
    else:
        last_row = "%s %s" %(previous_month, year)

    if data[-1][0] != last_row:
        print("Last month should be %s, but found %s. The file is already updated." %(last_row, data[-1][0]))
        sys.exit(0)

    # Add the new count
    data.append(['%s %s' % (target_month, year), count, total])

    # Write the new file
    with open(tmpfile, 'w', newline='') as outfile:
        writer = csv.writer(outfile, delimiter=',') 
        [writer.writerow(row) for row in data]

    # Copy finished file - will need to be added in pull request (GitHub actions)
    shutil.copyfile(tmpfile, filepath)  

if __name__ == '__main__':
    main()
