# Check only the URLs added by a pull request to the given files.
#
# The job data files collect many links that go stale as postings are taken
# down. Those are handled by the nightly clean-expired-jobs workflow, so a PR
# that adds a job should only be checked against the URLs it adds.
#
# Usage: python scripts/check_added_urls.py <base-ref> <file> [<file> ...]

import os
import subprocess
import sys
import tempfile

from urlchecker.core.fileproc import collect_links_from_file
from urlchecker.core.urlproc import UrlCheckResult

here = os.path.dirname(os.path.abspath(__file__))

# Shared with the other URL checks; see the comments in that file
EXCLUDE_FILE = os.path.join(
    os.path.dirname(here), ".github", "urlchecker", "exclude-patterns.txt"
)


def read_exclude_patterns(filepath=EXCLUDE_FILE):
    """
    read URL patterns to skip, one per line, ignoring blank lines and comments.
    """
    with open(filepath, "r") as fd:
        lines = [line.strip() for line in fd]
    return [line for line in lines if line and not line.startswith("#")]


def git_diff(base_ref, files):
    """
    return the diff of files since the merge base with base_ref.
    """
    return subprocess.run(
        ["git", "diff", "-U0", "--no-color", "%s...HEAD" % base_ref, "--"] + files,
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def added_lines(diff):
    """
    return the lines a unified diff adds.
    """
    return [
        line[1:]
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    ]


def added_urls(diff):
    """
    extract URLs from a diff's added lines, using urlchecker's own URL parsing.
    """
    with tempfile.NamedTemporaryFile("w", suffix=".txt") as tmp:
        tmp.write("\n".join(added_lines(diff)))
        tmp.flush()
        return sorted(collect_links_from_file(tmp.name))


def main():
    if len(sys.argv) < 3:
        sys.exit("Usage: %s <base-ref> <file> [<file> ...]" % sys.argv[0])
    base_ref, files = sys.argv[1], sys.argv[2:]

    urls = added_urls(git_diff(base_ref, files))
    print("Found %s added URLs in %s" % (len(urls), ", ".join(files)))
    if not urls:
        return

    checker = UrlCheckResult(exclude_patterns=read_exclude_patterns())
    checker.check_urls(urls=urls, retry_count=3, timeout=10)

    for url in checker.excluded:
        print("EXCLUDED %s" % url)
    if checker.failed:
        print("\n%s added URLs failed:" % len(checker.failed))
        for url in checker.failed:
            print("  %s" % url)
        sys.exit(1)
    print("All added URLs passed.")


if __name__ == "__main__":
    main()
