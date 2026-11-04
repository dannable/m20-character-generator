#!/usr/bin/env bash
# Download faction emblems into app/public/emblems/ from a list you maintain.
# Run it on a machine that can reach the images (the Claude sandbox cannot).
#   tools/fetch-emblems.sh            # reads tools/emblem-urls.txt
# Each non-comment line:  <slug> <image URL>
# The file extension comes from the URL (png, webp, svg, jpg). A file here beats the
# built-in placeholder SVG of the same name, because .svg is tried first: delete the placeholder
# when you replace it with a .png, e.g.  rm app/public/emblems/virtual-adepts.svg
set -euo pipefail
cd "$(dirname "$0")/.."
LIST="${1:-tools/emblem-urls.txt}"
OUT="app/public/emblems"
mkdir -p "$OUT"
while read -r slug url _; do
  [[ -z "${slug:-}" || "$slug" == \#* ]] && continue
  path="${url%%\?*}"; path="${path%/revision/*}"; ext="${path##*.}"; ext="$(echo "$ext" | tr 'A-Z' 'a-z')"
  case "$ext" in svg|png|webp) ;; jpg|jpeg) ext=jpg ;; *) ext=png ;; esac
  echo "-> $slug.$ext"
  curl -fsSL "$url" -o "$OUT/$slug.$ext"
  # the page tries svg first, so remove the placeholder that this file replaces
  [[ "$ext" != svg && -f "$OUT/$slug.svg" ]] && rm "$OUT/$slug.svg" && echo "   removed placeholder $slug.svg"
done < "$LIST"
