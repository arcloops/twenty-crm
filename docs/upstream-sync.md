# Monthly upstream sync

Stay mergeable with [`twentyhq/twenty`](https://github.com/twentyhq/twenty)
without surprise core conflicts. Custom CRM work belongs in the Arcloops SDK
app; the only core files you re-touch after a merge are those listed in
[`ARCLOOPS_OVERRIDES.md`](../ARCLOOPS_OVERRIDES.md).

Do **not** merge `upstream/main` into `staging` or `main` directly. Use the
script, review on a dated branch, then PR.

## Calendar reminder (copy-paste)

```
Title:    Arcloops CRM — monthly Twenty upstream sync
When:     first Monday of each month, 30 minutes
Repo:     arcloops/twenty-crm (origin) ← twentyhq/twenty (upstream)

Do:
  1. Clean tree on staging (or the branch you are promoting from).
  2. ./scripts/upstream-sync.sh --fetch-only
     Review: git log HEAD..upstream/main --oneline
  3. When you decide to merge (human call, not automatic):
       ./scripts/upstream-sync.sh
     or, already on upstream-sync-YYYY-MM:
       git merge --no-edit upstream/main
  4. ./scripts/apply-branding.sh
  5. Re-check only paths in ARCLOOPS_OVERRIDES.md
  6. yarn install && yarn start — smoke-test login
  7. PR: feature/upstream-sync → staging → main
```

Set this as a recurring event. Monthly keeps the diff small. Skipping several
months makes the merge painful.

## Script

[`scripts/upstream-sync.sh`](../scripts/upstream-sync.sh) (executable):

1. Checks `origin` contains `arcloops/twenty-crm` and `upstream` contains
   `twentyhq/twenty`.
2. Refuses if the clone is still shallow (`git fetch --unshallow origin`).
3. Aborts if this is not a git repo or the working tree is dirty.
4. `git fetch upstream`.
5. Creates or checks out `upstream-sync-YYYY-MM`.
6. Merges `upstream/main`, unless you pass `--fetch-only`.

`--fetch-only` is the safe path when you are not ready to merge: fetch +
branch + printed next steps. The default is fetch + branch + merge. The first
real merge is still a human decision — creating the branch is not approval.

```bash
# inspect only
./scripts/upstream-sync.sh --fetch-only

# fetch, branch, merge (tree must be clean)
./scripts/upstream-sync.sh
```

## PR path

```
feature/upstream-sync  →  staging  →  main
         review              UAT         prod
    crm preview         crm-staging   crm.arcloops.io
```

1. Push the monthly branch. You can keep the dated name
   (`upstream-sync-YYYY-MM`) or push it as `feature/upstream-sync`:

   ```bash
   git push -u origin HEAD:feature/upstream-sync
   ```

2. Open a PR **into `staging`**. Review the upstream delta and branding
   restore there. Merge to `staging` updates UAT
   (`crm-staging.arcloops.io`).

3. After UAT looks right, open a PR **`staging` → `main`**. That is
   production (`crm.arcloops.io`).

Never push `upstream/main` straight onto `main`.

## Conflict strategy

If custom work stayed in the SDK app, conflicts should be limited to the
override list.

| Path | After merge |
|---|---|
| Files in [`ARCLOOPS_OVERRIDES.md`](../ARCLOOPS_OVERRIDES.md) | Expected. Re-run `./scripts/apply-branding.sh`, then re-read the list. Keep Arcloops title / logo; do not take Twenty’s chrome back. |
| `packages/arcloops-theme/` | Ours. Keep. |
| `packages/twenty-apps/internal/arcloops-extension/` | Ours. Keep. |
| `deploy/`, `docs/` (Arcloops) | Ours. Keep. |
| Anything else in `twenty-server` / `twenty-front` / `twenty-sdk` | Unexpected. Stop. Do not “fix” core to match Arcloops — move the change into the SDK app or add a real override to `ARCLOOPS_OVERRIDES.md`. |

Current override list (Phase 3, verified 2026-08-31):

- `packages/twenty-front/index.html` — title / og / twitter → Arcloops CRM
- `packages/twenty-front/public/images/integrations/twenty-logo.svg` — mark

Do **not** resurrect stale paths (`ThemeLight.ts`,
`src/assets/images/logo/`, `public/favicon.*`) if they still do not exist.

## After the merge (local)

```bash
./scripts/apply-branding.sh
yarn install
yarn start
```

Smoke-test: sign in, workspace name/logo, one record list. Then PR as above.
