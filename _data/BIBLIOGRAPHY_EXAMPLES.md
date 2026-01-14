# Example: Using the Automated Bibliography System

This file demonstrates how to use the automated bibliography system with real examples.

## Sample BibTeX Entries

Here are examples of properly formatted BibTeX entries for the newsletter:

### Journal Article (Published)

```bibtex
@article{dicosmo2025stop,
  title = {Stop treating code like an afterthought: Record, share and value it},
  author = {Di Cosmo, R. and Granger, S. and Hinsen, K. and Jullien, N. and Le Berre, D. and Louvet, V. and Maumet, C. and Maurice, C. and Monat, R. and Rougier, N. P.},
  journal = {Nature},
  volume = {646},
  number = {8084},
  pages = {284--286},
  year = {2025},
  doi = {10.1038/d41586-025-03196-0},
  read_status = {Read},
  keywords = {newsletter}
}
```

**Rendered output:**
- **Di Cosmo, R., Granger, S., Hinsen, K., et al. (7 more)**, _"Stop treating code like an afterthought: Record, share and value it,"_ *Nature*, Vol. 646, No. 8084, pp. 284–286, 2025. [Read the article.](https://doi.org/10.1038/d41586-025-03196-0)

### Conference Paper (Unpublished)

```bibtex
@inproceedings{obrien2025llm,
  title = {How Scientists Use Large Language Models to Program},
  author = {O'Brien, G.},
  booktitle = {CHI '25: Proceedings of the CHI Conference on Human Factors in Computing Systems},
  pages = {1--16},
  year = {2025},
  doi = {10.1145/3706598.3713668},
  read_status = {Unread},
  keywords = {newsletter}
}
```

**Rendered output:**
- **G. O'Brien**, _"How Scientists Use Large Language Models to Program,"_ *CHI '25: Proceedings of the CHI Conference on Human Factors in Computing Systems*, pp. 1–16, 2025. [Read the article.](https://doi.org/10.1145/3706598.3713668)

### Blog Post (Unpublished)

```bibtex
@misc{mittal2025cloud,
  title = {From Cloud Chaos to Developer Delight --- A Practical Guide to Building Your First Internal Developer Platform},
  author = {Mittal, A.},
  howpublished = {Medium},
  year = {2025},
  month = {May},
  day = {19},
  url = {https://medium.com/@akshaymittal_90606/from-cloud-chaos-to-developer-delight-a-practical-guide-to-building-your-first-internal-ff3d12834ad0},
  read_status = {Unread},
  keywords = {newsletter, blog}
}
```

**Rendered output:**
- **A. Mittal**, _"From Cloud Chaos to Developer Delight — A Practical Guide to Building Your First Internal Developer Platform,"_ Medium, May 19, 2025. [Read the post.](https://medium.com/@akshaymittal_90606/from-cloud-chaos-to-developer-delight-a-practical-guide-to-building-your-first-internal-ff3d12834ad0)

## Complete Workflow Example

### Step 1: Add Items to Zotero

1. Use the Zotero browser extension to capture articles
2. For DOI-based articles, Zotero will auto-populate most fields
3. For blog posts, manually create an entry as type "Web Page"

### Step 2: Tag and Mark Status

1. Add the `newsletter` tag to all items
2. Set `read_status` to `Unread` for new items
3. After publishing, change to `Read`

### Step 3: Export from Zotero

1. Select your newsletter collection
2. Right-click → Export Collection
3. Format: BibTeX
4. Save to `_data/interesting_reads.bib`

### Step 4: Convert and Build

```bash
# Convert BibTeX to YAML
python scripts/bibtex_to_yaml.py

# Preview the newsletter
bundle exec jekyll serve --future

# Or build for production
bundle exec jekyll build
```

### Step 5: Verify Output

Navigate to your newsletter page and verify that:
- Publications appear under "Recent Publications"
- Blog posts appear under "Blog Posts"
- Only "Unread" items are shown
- Formatting matches the expected style

## Tips and Best Practices

### Author Names

BibTeX uses specific formats for author names:
- `Last, First` - for single names
- Multiple authors separated by `and`
- The system will abbreviate long author lists (>3 authors)

### Title Formatting

- Use title case in BibTeX
- The system will preserve your capitalization
- Use triple dashes `---` for em-dashes in titles

### DOIs vs URLs

- Prefer DOIs when available - they're more stable
- The system automatically generates DOI URLs from the DOI field
- For content without DOIs (blog posts), use the `url` field

### Read Status Field

If not using the Zotero plugin, add to the Extra field:
```
read_status: Unread
```

Or directly in BibTeX export:
```bibtex
read_status = {Unread}
```

### Keywords

Add relevant keywords to help organize your library:
```bibtex
keywords = {newsletter, blog, software-engineering}
```

## Troubleshooting

### Entry Not Appearing

1. Check `read_status` is set to `Unread`
2. Verify the YAML was regenerated (`python scripts/bibtex_to_yaml.py`)
3. Check that Jekyll rebuilt the site

### Wrong Section

- Publications (articles, conference papers) go under "Recent Publications"
- Blog posts, web content (type `@misc`) go under "Blog Posts"
- Check the `type` field in the YAML output

### Formatting Issues

- Check for special characters in titles
- Verify author names follow BibTeX conventions
- Ensure page ranges use double dashes: `123--145`

## Integration with Existing Workflow

This system can coexist with manual entries:
- Automated entries from `interesting_reads.yml`
- Manual entries added directly in the newsletter markdown

Both will appear in the same section.
