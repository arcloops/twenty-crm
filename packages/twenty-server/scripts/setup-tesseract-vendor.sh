#!/usr/bin/env bash
# Download English Tesseract language data for offline OCR (gitignored).
# Package itself comes from npm (`tesseract.js` in package.json).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LANG_DIR="$ROOT/vendor/tesseract-lang"

mkdir -p "$LANG_DIR"
curl -fsSL -o "$LANG_DIR/eng.traineddata.gz" \
  'https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata.gz'

echo "language data ready at $LANG_DIR"
