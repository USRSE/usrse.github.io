#!/bin/bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir"

preproc_nb="Newsletter_Preproc.qmd"
preproc_html="Newsletter_Preproc.html"
newsletter_template="template.qmd"
params_file="params.yml"
data_dir="_data/newsletter"
intermediate_md="intermediate.md"

for command_name in quarto pandoc awk sed rg; do
  command -v "$command_name" >/dev/null || {
    echo "Required command not found: $command_name" >&2
    exit 1
  }
done

for input_file in "$preproc_nb" "$newsletter_template" "$params_file" \
  "_data/newsletter-events-opportunities.yml" \
  "$data_dir/Newsletter_Content_Triage.csv" \
  "$data_dir/articles.bib" "$data_dir/blogs.bib" "$data_dir/media.bib"; do
  test -s "$input_file" || {
    echo "Required input is missing or empty: $input_file" >&2
    exit 1
  }
done

test -d .. || {
  echo "The parent Jekyll posts directory is missing." >&2
  exit 1
}

cleanup() {
  rm -f "$intermediate_md"
}
trap cleanup EXIT

# run helper
quarto render "$preproc_nb" --no-cache --to html --output "$preproc_html"

# convert Interesting Reads bib to yaml
pandoc "$data_dir/articles.bib" -s -f biblatex -t gfm > "$data_dir/articles.yml"
pandoc "$data_dir/blogs.bib" -s -f biblatex -t gfm > "$data_dir/blogs.yml"
pandoc "$data_dir/media.bib" -s -f biblatex -t gfm > "$data_dir/media.yml"

for staged_file in "$data_dir/events-opportunities.yml" \
  "$data_dir/articles.yml" "$data_dir/blogs.yml" "$data_dir/media.yml"; do
  test -s "$staged_file" || {
    echo "Expected staged artifact is missing or empty: $staged_file" >&2
    exit 1
  }
done

# render quarto to template
quarto render "$newsletter_template" --no-cache --metadata-file "$params_file" --output "$intermediate_md"
test -s "$intermediate_md"

# Stop before emission if the final Markdown handoff still contains a
# long visible URL label. The audit also reports fixed-width elements for
# narrow-viewport review without treating them as automatic failures.
./diagnose_newsletter_layout.sh "$intermediate_md" "$data_dir/events-opportunities.yml"

# copy yaml frontmatter into rendered quarto output
article=$(mktemp)

{
  echo "---"
  cat "$params_file"
  echo "---"
  sed '1,4d' "$intermediate_md"
} > "$article"

release_date=$(awk '/^date:/ {print $2; exit}' "$params_file")
test -n "$release_date"
mv "$article" "../${release_date}-newsletter.md"
test -s "../${release_date}-newsletter.md"
