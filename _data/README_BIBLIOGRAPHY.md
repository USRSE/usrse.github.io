# Automated Bibliography System for US-RSE Newsletter

This directory contains the automated bibliography system for managing "Interesting Reads" in the US-RSE newsletter using Zotero and BibTeX.

## Overview

The system allows newsletter editors to:
1. Collect interesting articles, blog posts, and videos in Zotero throughout the month
2. Tag items with reading status using the Zotero read status plugin
3. Export to BibTeX format
4. Automatically format entries in the newsletter

## Workflow

### 1. Setup Zotero

1. Install Zotero: https://www.zotero.org/
2. (Optional) Install the Zotero read status plugin: https://github.com/Dominic-DallOsto/zotero-reading-list
   - This plugin adds a `read_status` field to track whether an item has been published
   - Mark items as "Unread" when they should appear in the next newsletter
   - Mark items as "Read" after they've been published

### 2. Collect Items in Zotero

Throughout the month, add interesting media to your Zotero library:

- **Research Papers**: Use the "Journal Article" or "Conference Paper" type
- **Blog Posts**: Use the "Web Page" or "Blog Post" type  
- **Videos/Podcasts**: Use the "Video Recording" or "Podcast" type

**Important**: Add a `newsletter` tag to all items that should be included in the newsletter.

### 3. Set Reading Status

Using the read status plugin (or manually via Extra field):
- New items for the upcoming newsletter: Set to `Unread`
- Previously published items: Set to `Read`

If not using the plugin, add this to the "Extra" field:
```
read_status: Unread
```

### 4. Export Bibliography

When ready to publish:

1. In Zotero, select your newsletter collection
2. Right-click → Export Collection
3. Format: **BibTeX**
4. Save as: `_data/interesting_reads.bib`
5. Make sure to export with the following options:
   - ☑ Export Notes
   - ☑ Keep updated (optional, for ongoing sync)

### 5. Convert to YAML

Run the conversion script:

```bash
python scripts/bibtex_to_yaml.py
```

This converts `_data/interesting_reads.bib` → `_data/interesting_reads.yml`

### 6. Build and Preview

Build the site to see the formatted bibliography:

```bash
bundle exec jekyll serve
```

Navigate to the newsletter page to preview the "Interesting Reads" section.

## BibTeX Entry Types

The system supports the following entry types:

### Journal Articles

```bibtex
@article{key2025,
  author = {Last, First and Other, Author},
  title = {Article Title},
  journal = {Journal Name},
  volume = {24},
  number = {5},
  pages = {123--145},
  year = {2025},
  doi = {10.1234/example},
  read_status = {Unread},
  keywords = {newsletter}
}
```

### Conference Proceedings

```bibtex
@inproceedings{key2025,
  author = {Last, First},
  title = {Paper Title},
  booktitle = {Conference Name 2025},
  pages = {1--10},
  year = {2025},
  doi = {10.1234/example},
  read_status = {Unread},
  keywords = {newsletter}
}
```

### Blog Posts and Web Content

```bibtex
@misc{key2025,
  author = {Last, First},
  title = {Blog Post Title},
  howpublished = {Medium},
  year = {2025},
  month = {May},
  day = {15},
  url = {https://example.com/post},
  read_status = {Unread},
  keywords = {newsletter, blog}
}
```

## Required Fields

- `author`: Author name(s), separated by "and"
- `title`: Title of the work
- `year`: Publication year
- `read_status`: Either "Unread" or "Read"
- `keywords`: Should include "newsletter" tag

For articles: `journal`, `volume`, `number`, `pages`
For conference papers: `booktitle`, `pages`
For web content: `howpublished`, `url`

## Output Format

The system automatically formats entries to match the newsletter style:

**Example output:**
- **G. O'Brien**, _"How Scientists Use Large Language Models to Program,"_ *CHI '25: Proceedings of the CHI Conference on Human Factors in Computing Systems*, pp. 1–16, 2025. [Read the article.](https://doi.org/10.1145/3706598.3713668)

## Filtering

The newsletter template automatically filters entries by:
- `read_status == "Unread"` - Only show items not yet published
- Entry type - Publications vs. blog posts are separated into different sections

## Manual Entries

You can still add manual entries directly to the newsletter markdown file if needed. The automated system and manual entries can coexist.

## Troubleshooting

### BibTeX parse errors

If the conversion script fails:
1. Check that your BibTeX file is valid
2. Ensure all required fields are present
3. Check for special characters that need escaping

### Entries not appearing

Make sure:
1. `read_status = {Unread}` is set correctly
2. `keywords = {newsletter}` tag is present (optional but recommended)
3. The YAML file was regenerated after updating the BibTeX file

### Formatting issues

The formatting is controlled by `_includes/bibliography-entry.html`. You can customize this file to adjust the output format.

## Files

- `_data/interesting_reads.bib` - BibTeX source file (exported from Zotero)
- `_data/interesting_reads.yml` - Generated YAML file (don't edit manually)
- `scripts/bibtex_to_yaml.py` - Conversion script
- `_includes/bibliography-entry.html` - Liquid template for formatting entries
- `_template/newsletter-template.md` - Newsletter template with automated bibliography

## Benefits of This System

1. **No AI Hallucinations**: All references come from your actual Zotero library
2. **Consistent Formatting**: Automated formatting ensures consistency across newsletters
3. **Version Control**: BibTeX files are text-based and git-friendly
4. **Reusability**: Build a permanent library of interesting reads over time
5. **Collaborative**: Zotero supports shared libraries for team curation
6. **Reliable URLs**: Direct from your saved sources, not generated by AI

## Support

For issues or questions, please contact the newsletter team or open an issue on GitHub.
