# Turn the urlchecker results CSV into a markdown report of broken URLs,
# grouped by file. Used by .github/workflows/url-health.yaml to fill in the
# broken-links tracking issue.
#
# Usage: python scripts/broken_links_report.py <results.csv> <report.md>
#            [--recheck] [--previous <old-report.md>] [--new <new-urls.md>]
#
# Prints the number of broken URLs. With --recheck, failed URLs are checked
# again one at a time and dropped if they pass, since checks from CI servers
# fail intermittently. With --previous, writes the URLs that are broken now but
# were not in the previous report to the --new file.

import argparse
import contextlib
import csv
import datetime
import os
import re
import sys
from collections import defaultdict

# GitHub rejects issue bodies over 65536 characters
MAX_LENGTH = 60000

GITHUB = "https://github.com"

URL_LINE = re.compile(r"^- <(\S+)>$")


def repo_path(filename):
    """
    return a path relative to the repository root. The urlchecker action runs
    in a container with the repository at /github/workspace.
    """
    filename = re.sub(r"^/github/workspace/", "", filename)
    return os.path.normpath(filename)


def read_failures(csv_path):
    """
    return {filename: [urls]} for every failed URL in a urlchecker results CSV.
    """
    failures = defaultdict(set)
    with open(csv_path, newline="") as fd:
        rows = list(csv.DictReader(fd))
    # An empty result almost always means a misconfigured file exclude
    # matched every file, not a site with no URLs
    if not any(row["RESULT"] == "passed" for row in rows):
        raise SystemExit("No URLs passed the check; check the exclude lists.")
    for row in rows:
        if row["RESULT"] == "failed":
            failures[repo_path(row["FILENAME"])].add(row["URL"])
    return {name: sorted(urls) for name, urls in sorted(failures.items())}


def file_link(filename, repo, ref):
    if not repo:
        return "`%s`" % filename
    # Built from parts so the URL checker doesn't read a template as a URL
    url = "/".join([GITHUB, repo, "blob", ref, filename])
    return "[`%s`](%s)" % (filename, url)


def render(failures, repo=None, ref="main", run_url=None, today=None):
    """
    render failures as a markdown report.
    """
    today = today or datetime.date.today().isoformat()
    count = len({url for urls in failures.values() for url in urls})
    lines = [
        "The weekly URL check found **%s broken URLs** in %s files (last checked %s)."
        % (count, len(failures), today),
        "",
        "To fix one, update or remove the link, or replace it with an archived copy "
        "from https://web.archive.org. If a link works in a browser but fails the "
        "checker, add a pattern to `.github/urlchecker/exclude-patterns.txt` with a "
        "comment saying why.",
        "",
        "This issue is updated by the URL health workflow and closed automatically "
        "when no broken URLs are found.",
    ]
    if run_url:
        lines.append("Latest run: %s" % run_url)

    body = "\n".join(lines)
    for filename, urls in failures.items():
        section = "\n\n### %s\n\n%s" % (
            file_link(filename, repo, ref),
            "\n".join("- <%s>" % url for url in urls),
        )
        if len(body) + len(section) > MAX_LENGTH:
            body += "\n\n_Report truncated; see the latest run for the full list._"
            break
        body += section
    return body + "\n"


def still_failing(url):
    """
    check a URL again, slowly, with urlchecker. Returns True if it still fails.
    """
    from urlchecker.core.urlproc import UrlCheckResult

    checker = UrlCheckResult(print_all=False)
    # urlchecker prints results; keep stdout for the count the workflow reads
    with contextlib.redirect_stdout(sys.stderr):
        checker.check_urls(urls=[url], retry_count=3, timeout=30)
    return bool(checker.failed)


def recheck(failures, check=still_failing):
    """
    drop URLs from failures that pass a second check.
    """
    failing = {url for urls in failures.values() for url in urls}
    failing = {url for url in sorted(failing) if check(url)}
    rechecked = {}
    for filename, urls in failures.items():
        urls = [url for url in urls if url in failing]
        if urls:
            rechecked[filename] = urls
    return rechecked


def urls_in_report(text):
    """
    return the set of URLs listed in a report rendered by render().
    """
    return {m.group(1) for m in map(URL_LINE.match, text.splitlines()) if m}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv")
    parser.add_argument("report")
    parser.add_argument(
        "--recheck", action="store_true", help="check failed URLs again"
    )
    parser.add_argument("--previous", help="previous report, to find new failures")
    parser.add_argument("--new", help="file to write newly broken URLs to")
    args = parser.parse_args()

    failures = read_failures(args.csv)
    if args.recheck:
        failures = recheck(failures)
    server = os.environ.get("GITHUB_SERVER_URL", GITHUB)
    repo = os.environ.get("GITHUB_REPOSITORY")
    run_id = os.environ.get("GITHUB_RUN_ID")
    run_url = "%s/%s/actions/runs/%s" % (server, repo, run_id) if run_id else None

    with open(args.report, "w") as fd:
        fd.write(render(failures, repo=repo, run_url=run_url))

    if args.previous and args.new:
        with open(args.previous) as fd:
            before = urls_in_report(fd.read())
        new = sorted({u for urls in failures.values() for u in urls} - before)
        with open(args.new, "w") as fd:
            fd.write("".join("- <%s>\n" % url for url in new))

    print(sum(len(urls) for urls in failures.values()))


if __name__ == "__main__":
    main()
