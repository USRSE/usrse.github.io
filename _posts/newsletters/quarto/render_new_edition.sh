#!/bin/bash
set -euo pipefail

preproc_nb=Newsletter_Preproc.qmd
preproc_html=Newsletter_Preproc.html
newsletter_template=template.qmd
params_file=params.yml
data_dir=_data/newsletter
intermediate_md=intermediate.md  # intermediate file (rendered quarto output without jekyll frontmatter)

# run helper
quarto render $preproc_nb --to html --output $preproc_html

# render quarto to template
quarto render $newsletter_template --metadata-file $params_file -o "$intermediate_md"
# convert Interesting Reads bib to yaml
pandoc $data_dir/articles.bib -s -f biblatex -t gfm > $data_dir/articles.yml         
pandoc $data_dir/blogs.bib -s -f biblatex -t gfm > $data_dir/blogs.yml         
pandoc $data_dir/media.bib -s -f biblatex -t gfm > $data_dir/media.yml         

# copy yaml frontmatter into rendered quarto output
article=$(mktemp)

{
  echo "---"
  cat $params_file
  echo "---"
  sed '1,4d' "$intermediate_md"
} > "$article"

release_date=$(awk '/^date:/ {print $2; exit}' "$params_file")
mv "$article" "../${release_date}-newsletter.md"
rm "$intermediate_md"
