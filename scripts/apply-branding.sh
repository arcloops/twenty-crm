#!/usr/bin/env bash
# Re-apply Arcloops branding onto verified twenty-front paths only.
# Run from anywhere; resolves the repo root from this script's location.
# After every: git merge upstream/main

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

THEME_ASSETS="packages/arcloops-theme/assets"
FRONT="packages/twenty-front"

echo "Applying Arcloops branding overrides..."

copy_if_dest_exists() {
  local source_path="$1"
  local dest_path="$2"

  if [[ ! -f "${source_path}" ]]; then
    echo "skip: source missing  ${source_path}"
    return 0
  fi

  if [[ ! -e "${dest_path}" ]]; then
    echo "skip: dest missing    ${dest_path}"
    return 0
  fi

  cp "${source_path}" "${dest_path}"
  echo "copied ${source_path} -> ${dest_path}"
}

# Verified on this tree (2026-08-31):
#   public/images/integrations/twenty-logo.svg exists
#   src/assets/images/logo/twenty-logo.svg does not exist
#   public/favicon.ico and public/favicon.svg do not exist
#   public/images/icons/android|ios PNGs referenced by index.html are absent
copy_if_dest_exists \
  "${THEME_ASSETS}/twenty-logo.svg" \
  "${FRONT}/public/images/integrations/twenty-logo.svg"

copy_if_dest_exists \
  "${THEME_ASSETS}/twenty-logo.svg" \
  "${FRONT}/src/assets/images/logo/twenty-logo.svg"

copy_if_dest_exists \
  "${THEME_ASSETS}/favicon.svg" \
  "${FRONT}/public/favicon.svg"

INDEX_HTML="${FRONT}/index.html"

if [[ -f "${INDEX_HTML}" ]]; then
  python3 - "${INDEX_HTML}" <<'PY'
from pathlib import Path
import sys

index_html_path = Path(sys.argv[1])
contents = index_html_path.read_text()
updated = contents
updated = updated.replace("<title>Twenty</title>", "<title>Arcloops CRM</title>")
updated = updated.replace(
    'property="og:title" content="Twenty"',
    'property="og:title" content="Arcloops CRM"',
)
updated = updated.replace(
    'name="twitter:title" content="Twenty"',
    'name="twitter:title" content="Arcloops CRM"',
)
if updated == contents:
    print(f"unchanged {index_html_path} (title already applied or markup shifted)")
else:
    index_html_path.write_text(updated)
    print(f"updated title in {index_html_path}")
PY
else
  echo "skip: dest missing    ${INDEX_HTML}"
fi

echo "Branding overrides applied."
echo "Tokens stay in packages/arcloops-theme/src/arcloops-tokens.css (not copied into core)."
echo "Workspace name/logo still need Settings → General (human step)."
