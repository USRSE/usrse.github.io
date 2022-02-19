#!/usr/bin/env python3

# This script does the following.
# 1. Reads in a current and changed yaml file
# 2. Finds repeated jobs
# 3. Exists on error if there are repeated

import argparse
import os
import json
import sys
import yaml
from github import Github


def read_yaml(filename):
    with open(filename, "r") as stream:
        content = yaml.load(stream, Loader=yaml.FullLoader)
    return content


def read_json(filename):
    with open(filename, "r") as fd:
        content = json.loads(fd.read())
    return content


def post_comment(repeated):
    gh = Github(os.getenv("GITHUB_TOKEN"))
    events_path = os.getenv("GITHUB_EVENT_PATH")
    if not events_path:
        sys.exit(
            "Oh no! 😲️ It looks like some of these jobs have been added before!\n This won't fail the pull request, but just double check to make sure you didn't mean to update an older entry. %s"
            % json.dumps(repeated, indent=4)
        )

    event = read_json(events_path)
    branch_label = event["pull_request"]["head"]["label"]  # author:branch
    branch_name = branch_label.split(":")[-1]
    repo = gh.get_repo(event["repository"]["full_name"])
    prs = repo.get_pulls(state="open", sort="created", head=branch_label)
    pr = prs[0]

    pr_info = {"pull_id": pr.number, "branch_name": branch_name}
    new_comment = (
        "Oh no! 😲️ It looks like some of these jobs have been added before!\n\n```json\n%s\n```\n\n This won't fail the pull request, but just double check to make sure you didn't mean to update an older entry."
        % json.dumps(repeated, indent=4)
    )
    pr.create_issue_comment(new_comment)


def get_parser():
    parser = argparse.ArgumentParser(description="Repeated Jobs Checker")

    description = "Find repeated jobs"
    subparsers = parser.add_subparsers(
        help="actions",
        title="actions",
        description=description,
        dest="command",
    )

    check = subparsers.add_parser("check", help="check for repeats")
    check.add_argument("jobfile", help="the jobs.yaml file")
    return parser


def main():
    parser = get_parser()

    def help(return_code=0):
        parser.print_help()
        sys.exit(return_code)

    # If an error occurs while parsing the arguments, the interpreter will exit with value 2
    args, extra = parser.parse_known_args()
    if not args.command:
        help()

    filename = args.jobfile
    if not os.path.exists(filename):
        sys.exit(f"{filename} does not exist.")

    jobs = read_yaml(filename)

    seen = set()
    repeated = []
    for job in jobs:
        if job["url"] in seen:

            # Dates won't json serialize
            del job["expires"]
            del job["posted"]
            repeated.append(job)
        else:
            seen.add(job["url"])

    if repeated:
        print("Found repeated jobs! 😲️")
        post_comment(repeated)
    else:
        print("WoohoO! No repeats! 😁️")


if __name__ == "__main__":
    main()
