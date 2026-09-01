#!/usr/bin/env bash
# Monthly sync from twentyhq/twenty (upstream) into this Arcloops fork.
# Default: fetch + create upstream-sync-YYYY-MM + merge upstream/main.
# --fetch-only: fetch + create the branch + print next steps (no merge).
# Does not push, commit, or apply branding.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

ORIGIN_SLUG="arcloops/twenty-crm"
UPSTREAM_SLUG="twentyhq/twenty"
FETCH_ONLY=0
SYNC_BRANCH="upstream-sync-$(date +%Y-%m)"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--fetch-only] [--help]

Fetch twentyhq/twenty, create ${SYNC_BRANCH}, and merge upstream/main.

  --fetch-only   Fetch and create the branch only. Skip the merge.
                 Use this when you are not ready to merge yet.

Aborts if this is not a git repo, the working tree is dirty, a remote is
missing or unexpected, or the clone is still shallow.

After a successful run, re-apply branding and open a PR:
  feature/upstream-sync → staging → main
EOF
}

for argument in "$@"; do
  case "${argument}" in
    --fetch-only)
      FETCH_ONLY=1
      ;;
    --help | -h)
      usage
      exit 0
      ;;
    *)
      echo "Refuse: unknown argument '${argument}'."
      usage
      exit 1
      ;;
  esac
done

print_next_steps() {
  local merge_done="$1"

  echo ""
  echo "Next steps"
  echo "----------"
  if [[ "${merge_done}" != "yes" ]]; then
    echo "  0. Review incoming commits, then merge when you decide:"
    echo "       git merge --no-edit upstream/main"
    echo "     The first real merge is a human decision. Do not treat"
    echo "     creating this branch as approval to merge."
  fi

  if [[ -x "${ROOT}/scripts/apply-branding.sh" ]]; then
    echo "  1. ./scripts/apply-branding.sh"
  elif [[ -f "${ROOT}/scripts/apply-branding.sh" ]]; then
    echo "  1. bash scripts/apply-branding.sh"
  else
    echo "  1. Re-apply branding (scripts/apply-branding.sh is not in this tree)"
  fi

  if [[ -f "${ROOT}/ARCLOOPS_OVERRIDES.md" ]]; then
    echo "  2. Restore or re-check only files listed in ARCLOOPS_OVERRIDES.md"
  else
    echo "  2. Restore or re-check only files listed in ARCLOOPS_OVERRIDES.md"
    echo "     (file not present yet — branding Phase 3 owns that list)"
  fi

  echo "  3. yarn install"
  echo "  4. yarn start — smoke-test login locally"
  echo "  5. Push and open PR: feature/upstream-sync → staging → main"
  echo ""
  echo "See docs/upstream-sync.md"
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Refuse: ${ROOT} is not a git repository."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refuse: working tree is dirty. Commit or stash first."
  git status -sb
  exit 1
fi

require_remote() {
  local remote_name="$1"
  local expected_slug="$2"

  if ! git remote get-url "${remote_name}" >/dev/null 2>&1; then
    echo "Refuse: missing remote '${remote_name}'."
    echo "  git remote add ${remote_name} <url-containing-${expected_slug}>"
    exit 1
  fi

  local remote_url
  remote_url="$(git remote get-url "${remote_name}")"
  if [[ "${remote_url}" != *"${expected_slug}"* ]]; then
    echo "Refuse: remote '${remote_name}' is ${remote_url}"
    echo "  Expected a URL containing ${expected_slug}"
    exit 1
  fi

  echo "remote ${remote_name}: ${remote_url}"
}

require_remote origin "${ORIGIN_SLUG}"
require_remote upstream "${UPSTREAM_SLUG}"

if [[ "$(git rev-parse --is-shallow-repository)" == "true" ]]; then
  echo "Refuse: this clone is still shallow. Full history is required before sync."
  echo "  git fetch --unshallow origin"
  exit 1
fi

echo "Fetching upstream..."
git fetch upstream

if ! git rev-parse --verify --quiet upstream/main >/dev/null; then
  echo "Refuse: upstream/main is missing after fetch."
  exit 1
fi

incoming_count="$(git rev-list --count HEAD..upstream/main)"
echo ""
echo "${incoming_count} commit(s) on upstream/main not in HEAD:"
if [[ "${incoming_count}" -gt 0 ]]; then
  git log --oneline HEAD..upstream/main
else
  echo "  (already up to date)"
fi
echo ""

if git show-ref --verify --quiet "refs/heads/${SYNC_BRANCH}"; then
  echo "Checking out existing branch ${SYNC_BRANCH}"
  git checkout "${SYNC_BRANCH}"
else
  echo "Creating branch ${SYNC_BRANCH}"
  git checkout -b "${SYNC_BRANCH}"
fi

if [[ "${FETCH_ONLY}" -eq 1 ]]; then
  echo "Merge skipped (--fetch-only)."
  print_next_steps "no"
  exit 0
fi

echo "Merging upstream/main into ${SYNC_BRANCH}..."
if ! git merge --no-edit upstream/main; then
  echo ""
  echo "Merge stopped with conflicts."
  echo "Resolve only files listed in ARCLOOPS_OVERRIDES.md for branding."
  echo "Custom work should live in the SDK app, not in core packages."
  echo "Then: git add … && git commit"
  print_next_steps "yes"
  exit 1
fi

echo "Merge of upstream/main completed on ${SYNC_BRANCH}."
print_next_steps "yes"
