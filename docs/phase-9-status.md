# Phase 9 status — Monthly upstream sync

**State: tooling only. The first real merge of `upstream/main` is still a
human decision.**

This pass added the monthly sync script and runbook. Nobody has merged
`twentyhq/twenty` into this working tree. Creating `scripts/upstream-sync.sh`
is not permission to merge. Use `--fetch-only` until you choose to.

## Script path

[`scripts/upstream-sync.sh`](../scripts/upstream-sync.sh) — executable.

Default: check remotes → refuse if shallow / dirty / not a git repo → fetch
upstream → create `upstream-sync-YYYY-MM` → merge `upstream/main`.

`--fetch-only`: same, but stop before the merge and print next steps.

After a merge (when a human runs it): `./scripts/apply-branding.sh` if it
exists; re-check only [`ARCLOOPS_OVERRIDES.md`](../ARCLOOPS_OVERRIDES.md);
`yarn install`; smoke test; PR to staging.

Runbook: [`docs/upstream-sync.md`](./upstream-sync.md).

## What this pass added

| File | Role |
|---|---|
| [`scripts/upstream-sync.sh`](../scripts/upstream-sync.sh) | Monthly fetch / branch / optional merge. Does not push or apply branding. |
| [`docs/upstream-sync.md`](./upstream-sync.md) | Calendar reminder text, PR path, conflict strategy. |
| This file | Status. First merge is still yours. |

This pass did **not**:

- Merge `upstream/main`
- Unshallow or change remotes (`origin` = `arcloops/twenty-crm`,
  `upstream` = `twentyhq/twenty`; clone is already full history)
- Create a calendar event
- Open an `upstream-sync-*` PR

## Remaining human steps

- [ ] Paste the reminder from [`docs/upstream-sync.md`](./upstream-sync.md)
      into a monthly calendar event
- [ ] Decide when to take the first merge (not automatic)
- [ ] Clean tree, then `./scripts/upstream-sync.sh --fetch-only` and read
      `git log HEAD..upstream/main`
- [ ] When you choose to: `./scripts/upstream-sync.sh` (or merge on the
      dated branch)
- [ ] `./scripts/apply-branding.sh` and re-check
      [`ARCLOOPS_OVERRIDES.md`](../ARCLOOPS_OVERRIDES.md)
- [ ] `yarn install` and `yarn start` — smoke-test login
- [ ] PR: `feature/upstream-sync` → `staging` → `main`

**Exit (not met):** a monthly calendar reminder exists, and the first
`upstream-sync-*` PR has gone through staging.
