#!/bin/bash
set -euo pipefail

qmd_file="$1"    # input quarto template
file_in="$2"     # intermediate template file from quarto render (markdown without yaml frontmatter)
file_out="$3"   # final output file (markdown post with yaml frontmatter)
yaml_file="$4"  # newsletter parameters

# render quarto to template
quarto render "$qmd_file" --metadata-file "$yaml_file"

# convert Interesting Reads bib to yaml
pandoc _data/newsletter_bib.bib -s -f biblatex -t markdown > _data/newsletter_bib_yml.yml         

# copy yaml frontmatter into rendered quarto output
tmp=$(mktemp)

{
  echo "---"
  cat "$yaml_file"
  echo "---"
  sed '1,4d' "$file_in"
} > "$tmp"

mv "$tmp" "$file_out"