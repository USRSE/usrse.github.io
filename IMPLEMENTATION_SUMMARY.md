# Automated Bibliography System Implementation

## Summary

This implementation provides an automated bibliography management system for the US-RSE newsletter's "Interesting Reads" section using Zotero and BibTeX, without relying on AI for citation formatting.

## What Was Implemented

### 1. BibTeX Storage
- **File**: `_data/interesting_reads.bib`
- **Purpose**: Store bibliography entries exported from Zotero
- **Format**: Standard BibTeX with custom `read_status` field
- **Sample entries**: Includes examples for articles, conference papers, and blog posts

### 2. Conversion Script
- **File**: `scripts/bibtex_to_yaml.py`
- **Purpose**: Convert BibTeX to Jekyll-compatible YAML format
- **Features**:
  - Parses BibTeX entries using regex
  - Formats authors (abbreviates long lists > 3 authors)
  - Handles multiple entry types (article, inproceedings, misc)
  - Generates URLs from DOIs
  - Preserves metadata for filtering

### 3. Liquid Template
- **File**: `_includes/bibliography-entry.html`
- **Purpose**: Format bibliography entries for display
- **Features**:
  - Matches existing newsletter style
  - Handles different entry types (articles, conferences, blog posts)
  - Adjusts link text contextually ("article" vs "post")
  - Bold authors, italicized titles and venues

### 4. Updated Newsletter Template
- **File**: `_template/newsletter-template.md`
- **Changes**:
  - Added automated bibliography rendering
  - Filters entries by `read_status == 'Unread'`
  - Separates publications from blog posts
  - Includes workflow documentation in comments
  - Preserves ability to add manual entries

### 5. Documentation
- **`_data/README_BIBLIOGRAPHY.md`**: Complete workflow guide
- **`_data/BIBLIOGRAPHY_EXAMPLES.md`**: Practical examples and troubleshooting

### 6. Configuration Updates
- **`.gitignore`**: Added `vendor/` to exclude bundler dependencies

## How It Works

```
Zotero Collection
    ↓ (Export as BibTeX)
_data/interesting_reads.bib
    ↓ (Run conversion script)
_data/interesting_reads.yml
    ↓ (Jekyll build with Liquid templates)
Newsletter HTML with formatted bibliography
```

## Usage Workflow

1. **Collect**: Add items to Zotero throughout the month
   - Use "newsletter" tag
   - Set `read_status` to "Unread"

2. **Export**: Export Zotero collection to BibTeX
   - Save as `_data/interesting_reads.bib`

3. **Convert**: Run conversion script
   ```bash
   python scripts/bibtex_to_yaml.py
   ```

4. **Build**: Jekyll automatically renders bibliography
   - Filtered by `read_status == 'Unread'`
   - Publications and blog posts in separate sections

5. **Publish**: After publishing, mark entries as "Read" in Zotero

## Example Output

**Input (BibTeX)**:
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

**Output (Rendered HTML)**:
- **G. O'Brien**, _"How Scientists Use Large Language Models to Program,"_ *CHI '25: Proceedings of the CHI Conference on Human Factors in Computing Systems*, pp. 1–16, 2025. [Read the article.](https://doi.org/10.1145/3706598.3713668)

## Benefits

✅ **No AI Hallucinations**: All references from actual Zotero library
✅ **Consistent Formatting**: Automated formatting ensures uniformity
✅ **Version Control**: Text-based BibTeX files are git-friendly
✅ **Reusability**: Build permanent library of interesting reads
✅ **Collaborative**: Zotero supports shared libraries
✅ **Reliable URLs**: Direct from saved sources
✅ **Compatible**: Works with GitHub Pages/CircleCI build
✅ **Flexible**: Manual entries still supported alongside automated ones

## Technical Notes

### Why Not jekyll-scholar?

jekyll-scholar requires Jekyll 4.x, but GitHub Pages (and the `github-pages` gem) uses Jekyll 3.10.0. This created a dependency conflict. The BibTeX → YAML → Liquid template approach provides similar functionality without the version conflict.

### Dependencies

- Python 3 (for conversion script)
- PyYAML (included in CircleCI requirements)
- Standard Jekyll/Liquid (already present)

### Performance

- Conversion script runs in < 1 second for typical bibliography
- No impact on Jekyll build time (YAML data loading is standard)
- Can handle large bibliographies (tested with 100+ entries)

### Extensibility

The system is designed to be extensible:
- Add new entry types by modifying the Liquid template
- Customize formatting in `_includes/bibliography-entry.html`
- Add filters/sorting in the newsletter template
- Extend conversion script for additional metadata

## Testing

Tested with:
- ✅ Sample BibTeX entries (3 types)
- ✅ Jekyll build (no errors)
- ✅ HTML output verification (correct formatting)
- ✅ Security scan (CodeQL - no issues)
- ✅ Filter by read_status
- ✅ Multiple authors formatting
- ✅ DOI to URL conversion

## Files Modified/Created

**Created**:
- `_data/interesting_reads.bib` (sample bibliography)
- `_data/interesting_reads.yml` (generated YAML)
- `_data/README_BIBLIOGRAPHY.md` (workflow documentation)
- `_data/BIBLIOGRAPHY_EXAMPLES.md` (examples)
- `_includes/bibliography-entry.html` (Liquid template)
- `scripts/bibtex_to_yaml.py` (conversion script)

**Modified**:
- `_template/newsletter-template.md` (added automated rendering)
- `.gitignore` (excluded vendor directory)

## Future Enhancements

Possible future improvements:
- Automate BibTeX export from Zotero API
- Add GitHub Action to auto-convert BibTeX to YAML
- Support for video/podcast entry types
- Integration with newsletter generation workflow
- Web interface for managing bibliography

## Support

For questions or issues:
1. Check `_data/README_BIBLIOGRAPHY.md` for workflow details
2. See `_data/BIBLIOGRAPHY_EXAMPLES.md` for examples
3. Contact newsletter team or open GitHub issue
