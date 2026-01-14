#!/usr/bin/env python3
"""
Convert BibTeX bibliography file to YAML format for Jekyll consumption.
This script reads a BibTeX file and converts it to a structured YAML format
that can be used with Liquid templates in Jekyll.

Usage:
    python scripts/bibtex_to_yaml.py

Input: _data/interesting_reads.bib
Output: _data/interesting_reads.yml
"""

import os
import sys
import yaml
import re
from typing import Dict, List, Any


def parse_bibtex_file(filepath: str) -> List[Dict[str, Any]]:
    """
    Parse a BibTeX file and return a list of entry dictionaries.
    
    Args:
        filepath: Path to the BibTeX file
        
    Returns:
        List of dictionaries, each representing a bibliography entry
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    entries = []
    
    # Regular expression to match BibTeX entries
    entry_pattern = r'@(\w+)\{([^,]+),\s*((?:[^{}]|\{[^{}]*\})*)\}'
    
    for match in re.finditer(entry_pattern, content, re.DOTALL):
        entry_type = match.group(1)
        cite_key = match.group(2)
        fields_str = match.group(3)
        
        entry = {
            'type': entry_type,
            'key': cite_key
        }
        
        # Parse fields
        field_pattern = r'(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}|(\w+)\s*=\s*"([^"]*)"'
        
        for field_match in re.finditer(field_pattern, fields_str):
            if field_match.group(1):  # Braces format
                field_name = field_match.group(1)
                field_value = field_match.group(2)
            else:  # Quotes format
                field_name = field_match.group(3)
                field_value = field_match.group(4)
            
            # Clean up the value
            field_value = field_value.strip()
            # Remove extra spaces
            field_value = re.sub(r'\s+', ' ', field_value)
            
            entry[field_name.lower()] = field_value
        
        entries.append(entry)
    
    return entries


def format_authors(authors_str: str) -> str:
    """
    Format author string for display.
    BibTeX uses 'and' to separate authors.
    
    Args:
        authors_str: Raw author string from BibTeX
        
    Returns:
        Formatted author string
    """
    # Split by 'and' and clean up
    authors = [a.strip() for a in authors_str.split(' and ')]
    
    # Format authors with last name abbreviation for long lists
    if len(authors) > 3:
        # Show first 3 authors and abbreviate rest
        formatted_authors = authors[:3]
        remaining = len(authors) - 3
        return ', '.join(formatted_authors) + f', et al. ({remaining} more)'
    else:
        return ', '.join(authors)


def format_entry_for_newsletter(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a BibTeX entry for newsletter display.
    
    Args:
        entry: Dictionary representing a BibTeX entry
        
    Returns:
        Formatted dictionary ready for YAML output
    """
    formatted = {
        'key': entry.get('key', ''),
        'type': entry.get('type', 'article'),
        'title': entry.get('title', 'Untitled'),
        'authors': format_authors(entry.get('author', 'Unknown')),
        'authors_raw': entry.get('author', 'Unknown'),
        'year': entry.get('year', ''),
        'read_status': entry.get('read_status', 'Unread'),
    }
    
    # Add type-specific fields
    if entry['type'] == 'article':
        formatted['journal'] = entry.get('journal', '')
        formatted['volume'] = entry.get('volume', '')
        formatted['number'] = entry.get('number', '')
        formatted['pages'] = entry.get('pages', '')
    elif entry['type'] == 'inproceedings' or entry['type'] == 'conference':
        formatted['booktitle'] = entry.get('booktitle', '')
        formatted['pages'] = entry.get('pages', '')
    elif entry['type'] == 'misc':
        formatted['howpublished'] = entry.get('howpublished', '')
        if 'month' in entry:
            formatted['month'] = entry['month']
        if 'day' in entry:
            formatted['day'] = entry['day']
    
    # Add DOI or URL
    if 'doi' in entry:
        formatted['doi'] = entry['doi']
        formatted['url'] = f"https://doi.org/{entry['doi']}"
    elif 'url' in entry:
        formatted['url'] = entry['url']
    
    # Add keywords if present
    if 'keywords' in entry:
        formatted['keywords'] = [k.strip() for k in entry['keywords'].split(',')]
    
    return formatted


def main():
    """Main function to convert BibTeX to YAML."""
    here = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(here)
    
    input_file = os.path.join(repo_root, '_data', 'interesting_reads.bib')
    output_file = os.path.join(repo_root, '_data', 'interesting_reads.yml')
    
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"Reading BibTeX file: {input_file}")
    entries = parse_bibtex_file(input_file)
    
    print(f"Found {len(entries)} entries")
    
    # Format entries for newsletter
    formatted_entries = [format_entry_for_newsletter(entry) for entry in entries]
    
    # Write to YAML file
    print(f"Writing YAML file: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(formatted_entries, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    print("Conversion complete!")
    print(f"Output: {output_file}")


if __name__ == '__main__':
    main()
