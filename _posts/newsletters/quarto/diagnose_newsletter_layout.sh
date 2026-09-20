#!/bin/bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir"

intermediate_md=${1:-intermediate.md}
events_yaml=${2:-_data/newsletter/events-opportunities.yml}

for input_file in "$intermediate_md" "$events_yaml"; do
  test -s "$input_file" || {
    echo "Layout audit input is missing or empty: $input_file" >&2
    exit 1
  }
done

status=0

echo "Newsletter layout audit"
echo "  rendered source: $intermediate_md"
echo "  event data:      $events_yaml"

if rg -n --pcre2 '\[(?:https?://)[^\]]{80,}\]\(https?://' \
  "$intermediate_md" "$events_yaml"; then
  echo "ERROR: a long URL is still exposed as visible link text." >&2
  status=1
else
  echo "OK: no long URL is exposed as visible link text."
fi

echo
echo "Potential fixed-width or preformatted elements:"
if rg -n --pcre2 '<(?:iframe|video|pre|table)\b|style=.*(?:width|min-width)\s*:' \
  "$intermediate_md"; then
  echo "Review these elements at narrow viewport widths."
else
  echo "None found in the rendered source."
fi

echo
echo "Long source lines (inspection only):"
if awk 'length($0) > 240 { print FNR ":" length($0) ":" $0 }' \
  "$intermediate_md" "$events_yaml"; then
  true
fi

exit "$status"
