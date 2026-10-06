#!/usr/bin/env bash
# Rebuild packages/twenty-server/vendor/tesseract.js + eng language data (gitignored).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor"
TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$VENDOR"
cd "$TMP"
for pkg in \
  tesseract.js@6.0.1 \
  tesseract.js-core@6.0.0 \
  bmp-js@0.1.0 \
  idb-keyval@6.2.0 \
  is-url@1.2.4 \
  node-fetch@2.6.9 \
  opencollective-postinstall@2.0.3 \
  regenerator-runtime@0.13.3 \
  wasm-feature-detect@1.2.11 \
  zlibjs@0.3.1 \
  whatwg-url@5.0.0 \
  webidl-conversions@3.0.1 \
  tr46@0.0.3
do
  npm pack "$pkg" --silent
done

rm -rf "$VENDOR/tesseract.js"
mkdir -p "$VENDOR/tesseract.js"
tar -xzf tesseract.js-6.0.1.tgz -C "$VENDOR/tesseract.js" --strip-components=1
NM="$VENDOR/tesseract.js/node_modules"
mkdir -p "$NM"
for pair in \
  tesseract.js-core-6.0.0.tgz:tesseract.js-core \
  bmp-js-0.1.0.tgz:bmp-js \
  idb-keyval-6.2.0.tgz:idb-keyval \
  is-url-1.2.4.tgz:is-url \
  node-fetch-2.6.9.tgz:node-fetch \
  opencollective-postinstall-2.0.3.tgz:opencollective-postinstall \
  regenerator-runtime-0.13.3.tgz:regenerator-runtime \
  wasm-feature-detect-1.2.11.tgz:wasm-feature-detect \
  zlibjs-0.3.1.tgz:zlibjs \
  whatwg-url-5.0.0.tgz:whatwg-url \
  webidl-conversions-3.0.1.tgz:webidl-conversions \
  tr46-0.0.3.tgz:tr46
do
  tgz="${pair%%:*}"
  name="${pair##*:}"
  mkdir -p "$NM/$name"
  tar -xzf "$tgz" -C "$NM/$name" --strip-components=1
done

node -e "
const fs=require('fs');
const path=process.argv[1];
const pkg=JSON.parse(fs.readFileSync(path,'utf8'));
pkg.dependencies={};
if (pkg.scripts) delete pkg.scripts.postinstall;
fs.writeFileSync(path, JSON.stringify(pkg,null,2)+'\n');
" "$VENDOR/tesseract.js/package.json"

# English traineddata for offline OCR (tesseract.js looks for .traineddata.gz)
LANG_DIR="$VENDOR/tesseract-lang"
mkdir -p "$LANG_DIR"
curl -fsSL -o "$LANG_DIR/eng.traineddata.gz" \
  'https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata.gz'

# Symlink from monorepo root node_modules when using portal
ROOT_NM="$(cd "$ROOT/../.." && pwd)/node_modules"
if [ -d "$ROOT_NM" ]; then
  rm -rf "$ROOT_NM/tesseract.js"
  ln -s "$VENDOR/tesseract.js" "$ROOT_NM/tesseract.js"
fi

echo "tesseract vendor ready at $VENDOR/tesseract.js"
echo "language data ready at $LANG_DIR"
