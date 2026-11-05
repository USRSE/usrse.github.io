#!/usr/bin/env python

# Offline tests for the URL check scripts: scripts/check_added_urls.py and
# scripts/broken_links_report.py. Requires urlchecker (pip install urlchecker).

import os
import sys
import tempfile
import unittest

here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(here), "scripts"))

import broken_links_report as report  # noqa: E402
import check_added_urls as added  # noqa: E402

print("############################################################# test_url_checks")

DIFF = """diff --git a/_data/jobs.yml b/_data/jobs.yml
index 1111111..2222222 100644
--- a/_data/jobs.yml
+++ b/_data/jobs.yml
@@ -1,0 +2,5 @@
+- expires: 2026-12-31
+  location: Somewhere
+  name: New Job
+  posted: 2026-10-01
+  url: https://example.edu/jobs/123
@@ -40 +45 @@
-  url: https://example.edu/old-job
+  url: https://example.edu/updated-job
"""

CSV = """URL,RESULT,FILENAME
https://example.com/dead,failed,./_posts/a.md
https://example.com/dead,failed,/github/workspace/pages/b.md
https://example.com/also-dead,failed,./_posts/a.md
https://example.com/ok,passed,./_posts/a.md
https://zoom.us/j/1,excluded,./_events/c.md
"""


class TestCheckAddedUrls(unittest.TestCase):
    def test_added_lines_ignores_headers_and_removals(self):
        lines = added.added_lines(DIFF)
        self.assertEqual(len(lines), 6)
        self.assertNotIn("++ b/_data/jobs.yml", lines)
        self.assertFalse(any("old-job" in line for line in lines))

    def test_added_urls(self):
        self.assertEqual(
            added.added_urls(DIFF),
            ["https://example.edu/jobs/123", "https://example.edu/updated-job"],
        )

    def test_no_added_urls(self):
        self.assertEqual(added.added_urls("-  url: https://example.edu/removed\n"), [])

    def test_exclude_patterns_file(self):
        patterns = added.read_exclude_patterns()
        self.assertTrue(patterns)
        for pattern in patterns:
            self.assertFalse(pattern.startswith("#"))
            self.assertEqual(pattern, pattern.strip())


class TestBrokenLinksReport(unittest.TestCase):
    def setUp(self):
        fd, self.csv = tempfile.mkstemp(suffix=".csv")
        with os.fdopen(fd, "w") as f:
            f.write(CSV)

    def tearDown(self):
        os.remove(self.csv)

    def test_read_failures_groups_by_file(self):
        self.assertEqual(
            report.read_failures(self.csv),
            {
                "_posts/a.md": [
                    "https://example.com/also-dead",
                    "https://example.com/dead",
                ],
                "pages/b.md": ["https://example.com/dead"],
            },
        )

    def test_read_failures_rejects_empty_results(self):
        # e.g. a file exclude that matches every path
        with open(self.csv, "w") as f:
            f.write("URL,RESULT,FILENAME\n")
        with self.assertRaises(SystemExit):
            report.read_failures(self.csv)

    def test_render(self):
        body = report.render(
            report.read_failures(self.csv), repo="USRSE/usrse.github.io", today="2026-10-05"
        )
        self.assertIn("**2 broken URLs** in 2 files (last checked 2026-10-05)", body)
        self.assertIn(
            "[`_posts/a.md`](https://github.com/USRSE/usrse.github.io/blob/main/_posts/a.md)",
            body,
        )
        self.assertNotIn("https://example.com/ok", body)
        self.assertNotIn("zoom.us", body)

    def test_recheck_drops_urls_that_pass(self):
        failures = report.read_failures(self.csv)
        rechecked = report.recheck(failures, check=lambda url: url.endswith("/dead"))
        self.assertEqual(
            rechecked,
            {
                "_posts/a.md": ["https://example.com/dead"],
                "pages/b.md": ["https://example.com/dead"],
            },
        )
        self.assertEqual(report.recheck(failures, check=lambda url: False), {})

    def test_urls_in_report_round_trip(self):
        failures = report.read_failures(self.csv)
        self.assertEqual(
            report.urls_in_report(report.render(failures)),
            {"https://example.com/dead", "https://example.com/also-dead"},
        )

    def test_render_truncates_long_reports(self):
        failures = {
            "file%04d.md" % i: ["https://example.com/%s/%d" % ("x" * 100, i)]
            for i in range(2000)
        }
        body = report.render(failures)
        self.assertLess(len(body), 65536)
        self.assertIn("Report truncated", body)

    def test_main_reports_new_urls(self):
        tmp = tempfile.mkdtemp()
        previous = os.path.join(tmp, "previous.md")
        with open(previous, "w") as f:
            f.write("- <https://example.com/dead>\n")
        out, new = os.path.join(tmp, "report.md"), os.path.join(tmp, "new.md")
        sys.argv = ["report", self.csv, out, "--previous", previous, "--new", new]
        report.main()
        with open(new) as f:
            self.assertEqual(f.read(), "- <https://example.com/also-dead>\n")


if __name__ == "__main__":
    unittest.main()
