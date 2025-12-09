# Read in jobs from the various jobs data files, find links that are
# both expired and not working, and remove them. Write to a new file.
# Copyright @vsoch, 2020

import os
import datetime
from datetime import timedelta
from urlchecker.core.urlproc import UrlCheckResult
import shutil
import tempfile
import yaml

here = os.path.dirname(os.path.abspath(__file__))


def get_filepath(filename):
    """
    load the jobs file.
    """
    filepath = os.path.join(os.path.dirname(here), "_data", filename)

    # Exit on error if we cannot find file
    if not os.path.exists(filepath):
        print("Cannot find %s" % filepath)

    return filepath


def read_jobs(filepath):
    """
    read in the jobs data.
    """
    with open(filepath, "r") as fd:
        data = yaml.load(fd.read(), Loader=yaml.SafeLoader)
    return data


def clean_jobs(file):
    """
    clean out expired job postings from a file
    """
    filepath = get_filepath(file)
    print("filepath is: %s" % filepath)

    # Read in the jobs
    jobs = read_jobs(filepath)

    # Keep a list to re-write to file
    keepers = []

    # Use the same urlchecker function for consistency
    now = datetime.date.today()

    print("Found %s jobs" % len(jobs))
    for job in jobs:

        # Do not keep expired jobs that haven't been updated in 60 days
        if job["expires"] < now:
            removal_date = job["expires"] + timedelta(days=60)
            if removal_date < now:
                print(
                    "Skipping %s, expired and hasn't been updated in 60 days."
                    % job["name"]
                )
                continue

        # We don't check urls that are not expired, the urlchecker action should
        # catch these and fail
        if job["expires"] > now:
            print("Skipping %s, expires in future." % job["name"])
            keepers.append(job)
            continue

        checker = UrlCheckResult()
        checker.check_urls(urls=[job["url"]], retry_count=3, timeout=5)

        # If the url passes, add to keepers
        if checker.passed:
            print("PASSED %s" % job["url"])
            keepers.append(job)
        else:
            print(
                "FAIL %s is expired and did not pass, not adding back to jobs."
                % job["url"]
            )

    # update the user
    print("%s jobs have passed." % len(keepers))

    # Finally, update data file
    _, tmpfile = tempfile.mkstemp(prefix="jobs-", suffix=".yml")

    # Write the new file
    with open(tmpfile, "w") as outfile:
        yaml.dump(keepers, outfile)

    # Copy finished file - will need to be added in pull request
    shutil.copyfile(tmpfile, filepath)


def main():
    """
    a small helper to update the jobs posting files.
    """
    clean_jobs("jobs.yml")
    clean_jobs("related-jobs.yml")
    clean_jobs("internships.yml")
    clean_jobs("freelance.yml")


if __name__ == "__main__":
    main()
