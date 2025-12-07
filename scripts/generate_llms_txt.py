#!/usr/bin/env python3
"""
Generate llms.txt file from Jekyll site build output.

This script walks through the _site directory, extracts content from HTML pages,
and generates an llms.txt file with organized sections and summaries.
"""

import sys
import yaml
import re
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict


class HTMLTextExtractor(HTMLParser):
    """Extract text content from HTML, ignoring nav, footer, and script elements."""

    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.title = None
        self.in_title = False
        self.in_skip = False
        self.skip_tags = {'nav', 'footer', 'script', 'style', 'noscript', 'header'}

    def handle_starttag(self, tag, _attrs):
        if tag == 'title':
            self.in_title = True
        elif tag in self.skip_tags:
            self.in_skip = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag in self.skip_tags:
            self.in_skip = False

    def handle_data(self, data):
        if self.in_title and not self.title:
            self.title = data.strip()
        elif not self.in_skip and not self.in_title:
            text = data.strip()
            if text:
                self.text_parts.append(text)

    def get_text(self):
        """Get extracted text content."""
        return ' '.join(self.text_parts)

    def get_title(self):
        """Get page title."""
        return self.title or "Untitled"


def load_config(repo_root):
    """Load Jekyll configuration."""
    config_path = repo_root / '_config.yml'
    if not config_path.exists():
        raise FileNotFoundError(f"Could not find _config.yml at {config_path}")

    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    return config


def extract_page_info(html_path):
    """Extract title and text content from an HTML file."""
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        parser = HTMLTextExtractor()
        parser.feed(content)

        title = parser.get_title()
        text = parser.get_text()

        # Clean up text: remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        return title, text
    except Exception as e:
        print(f"Warning: Error extracting content from {html_path}: {e}", file=sys.stderr)
        return None, None


def truncate_text(text, max_chars=300):
    """Truncate text to a reasonable summary length."""
    if len(text) <= max_chars:
        return text

    # Try to truncate at a sentence boundary
    truncated = text[:max_chars]
    last_period = truncated.rfind('.')
    last_exclaim = truncated.rfind('!')
    last_question = truncated.rfind('?')

    last_sentence = max(last_period, last_exclaim, last_question)

    if last_sentence > max_chars * 0.6:  # At least 60% of target length
        return text[:last_sentence + 1]
    else:
        # Just cut at word boundary
        last_space = truncated.rfind(' ')
        if last_space > 0:
            return truncated[:last_space] + '...'
        return truncated + '...'


def should_ignore_file(rel_path):
    """Determine if a file should be ignored."""
    ignore_patterns = [
        'feed.xml', 'atom.xml', 'sitemap.xml',
        'robots.txt', '404.html',
        '/assets/', '/css/', '/js/', '/img/', '/images/',
    ]

    path_str = str(rel_path)

    for pattern in ignore_patterns:
        if pattern in path_str:
            return True

    # Ignore index files that are just redirects or utility pages
    if '404' in path_str:
        return True

    return False


def get_section_name(rel_path):
    """Determine section name from URL path."""
    parts = rel_path.parts

    # Root level files
    if len(parts) == 1 or (len(parts) == 2 and parts[1] == 'index.html'):
        return "Root"

    # Use first path segment as section name
    section = parts[0] if parts else "Root"

    # Capitalize and clean up section name
    section = section.replace('-', ' ').replace('_', ' ').title()

    return section


def build_canonical_url(base_url, baseurl, rel_path):
    """Build the canonical URL for a page."""
    # Remove index.html from path
    path_str = str(rel_path)
    if path_str.endswith('index.html'):
        path_str = path_str[:-10]  # Remove 'index.html'
    elif path_str.endswith('.html'):
        path_str = path_str[:-5]  # Remove '.html'

    # Ensure trailing slash for directories
    if not path_str or path_str.endswith('/'):
        pass
    else:
        path_str += '/'

    # Combine base URL and path
    full_url = base_url.rstrip('/')
    if baseurl:
        full_url += '/' + baseurl.strip('/')

    if path_str:
        full_url += '/' + path_str.lstrip('/')
    else:
        full_url += '/'

    return full_url


def generate_llms_txt(repo_root):
    """Generate llms.txt from the built Jekyll site."""
    # Check for _site directory
    site_dir = repo_root / '_site'
    if not site_dir.exists():
        print(f"Error: _site directory not found at {site_dir}", file=sys.stderr)
        print("Please run 'bundle exec jekyll build' first.", file=sys.stderr)
        sys.exit(1)

    # Load configuration
    config = load_config(repo_root)
    base_url = config.get('url', 'https://us-rse.org')
    baseurl = config.get('baseurl', '')

    # Collect pages by section
    sections = defaultdict(list)

    # Walk through _site directory
    for html_file in site_dir.rglob('*.html'):
        rel_path = html_file.relative_to(site_dir)

        # Skip ignored files
        if should_ignore_file(rel_path):
            continue

        # Extract page information
        title, text = extract_page_info(html_file)
        if not title or not text:
            continue

        # Build canonical URL
        url = build_canonical_url(base_url, baseurl, rel_path)

        # Get section
        section = get_section_name(rel_path)

        # Truncate description
        description = truncate_text(text, max_chars=250)

        # Store page info
        sections[section].append({
            'title': title,
            'url': url,
            'description': description,
            'path': rel_path  # For sorting
        })

    # Generate llms.txt content
    output_lines = []

    # Sort sections: Root first, then alphabetically
    sorted_sections = sorted(sections.keys(), key=lambda x: (x != "Root", x))

    for section in sorted_sections:
        pages = sections[section]

        # Sort pages within section by path
        pages.sort(key=lambda p: str(p['path']))

        # Add section header
        output_lines.append(f"## {section}")

        # Add pages
        for page in pages:
            output_lines.append(f"- [{page['title']}]({page['url']}): {page['description']}")

        # Add blank line between sections
        output_lines.append("")

    # Write to llms.txt
    output_path = repo_root / 'llms.txt'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))

    print(f"Successfully generated llms.txt with {sum(len(pages) for pages in sections.values())} pages across {len(sections)} sections.")
    print(f"Output written to: {output_path}")


def main():
    """Main entry point."""
    # Determine repo root (script is in scripts/ directory)
    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent

    generate_llms_txt(repo_root)


if __name__ == '__main__':
    main()
