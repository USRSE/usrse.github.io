# Count jobs by way of:
#   - cloning a repository to tmp
#   - finding all git changes for the _data/jobs.yml file
#   - checkout out each commit and creating a global record of all jobs
#   - printing to the screen
# Copyright @vsoch, 2020

import os
import yaml
import subprocess
import shlex
import sys
import shutil
import tempfile

here = os.path.dirname(os.path.abspath(__file__))


def get_filename_commits(filename):
    """Given a filename in a Git repository, get a list of commits for which
    the file was changed. We must be in the PWD of the repository.
    """
    cmd = shlex.split(f'git log --all --oneline --pretty=tformat:"%H" -- {filename}')

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Cut out early if not successful
    if result.returncode != 0:
        sys.exit(result.stderr.decode("utf-8"))

    commits = [c for c in result.stdout.decode("utf-8").split("\n") if c]
    print(f"Found {len(commits)} commits for {filename}")
    return commits


def checkout(commit):
    """checkout a particular commit. We should have the repository in the PWD"""
    cmd = shlex.split(f"git checkout {commit}")
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Cut out early if not successful
    if result.returncode != 0:
        sys.exit(result.stderr.decode("utf-8"))


def clone_repo(git_path, branch="main", dest=None):
    """
    Clone and name a git repository.

    Args:
        - git_path (str) : https path to git repository.
        - branch   (str) : name of the branch to use. Default="main"
        - dest     (str) : fullpath to clone repository to. Defaults to tmp.

    Returns:
        (str) base path of the cloned git repository.
    """
    if not dest:
        dest = tempfile.mkdtemp()
        shutil.rmtree(dest)

    result = subprocess.run(
        ["git", "clone", "-b", branch, git_path, dest],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    if result.returncode != 0:
        sys.exit("Issue with cloning branch %s of %s" % (branch, git_path))

    return dest


def delete_repo(base_path):
    """
    Delete repository.

    Args:
        - base_path (str) : base path of the cloned git repository.

    Returns:
        (str) message/ code describing whether the operation was successfully executed.
    """
    result = subprocess.run(
        ["rm", "-R", "-f", base_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    return result.returncode


def read_jobs(jobfile):
    """read in a jobs file, return list of jobs indexed by URL"""
    data = []
    if os.path.exists(jobfile):
        with open(jobfile, "r") as fd:
            data = yaml.load(fd.read(), Loader=yaml.SafeLoader)
    return data


def count_jobs(jobfile, related=True):
    """count the number of jobs in a job file across all commits
    and returns a list of jobs

    Args:
        - jobfile (str)  : the name of the file to process
        - related (bool) : boolean to add to data to indicate main or related

    Returns:
        (str) a YAML representation of all the unique jobs contained in the file
    """
    commits = get_filename_commits(jobfile)

    # Keep lookup dictionary of logs, keys are based on title and url
    jobs = []
    seen = []

    # For each commit, checkout and read in job data
    for commit in commits:
        checkout(commit)

        try:
            new_jobs = read_jobs(jobfile)
        except:
            print("There was a problem parsing jobs file for commit %s" % commit)
            continue

        # Check seen based on URL, double check for title
        for job in new_jobs:

            # Unique id is based on url and title
            uid = "%s-%s" % (job["url"], job["name"])
            if uid in seen:
                continue
            seen.append(uid)
            del job["expires"]
            job["related"] = related
            jobs.append(job)

    print(f"Found a total of {len(jobs)} unique jobs across {len(commits)} commits.")

    return jobs


def main():
    """
    A small helper to generate an all-time jobs count
    and optionally write to an output file.
    """
    repository = "https://github.com/USRSE/usrse.github.io"
    tmpdir = tempfile.mkdtemp(prefix="usrse-")

    print(f"Cloning repository {repository}")
    repo = clone_repo(repository, dest=tmpdir)

    # If user provided an output file, derive path before chdir
    outfile = None
    if len(sys.argv) > 1:
        outfile = os.path.abspath(sys.argv[1])

    # Change directory to the repo to get list of commits
    os.chdir(repo)

    jobs = [
        *count_jobs("_data/jobs.yml", False),
        *count_jobs("_data/related-jobs.yml", True),
    ]

    # If user provided an output file:
    if outfile and jobs:
        print(f"Saving to output file {outfile}")
        with open(outfile, "w") as fd:
            yaml.dump(jobs, fd)

    delete_repo(repo)


if __name__ == "__main__":
    main()
