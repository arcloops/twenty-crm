# Phase 4 status — CI and branch protection

Workflows are in the repo. Secrets, Railway project ID, and branch protection
are **not** applied from this pass (needs a repo admin and tokens that must
not be committed).

Do **not** require Twenty’s existing checks (`CI Front`, `CI Server`,
`CD deploy main`). Those stay as-is and may fail on this fork (custom runners
and `twentyhq/twenty-infra` secrets).

## Workflow paths

| File | Trigger | Job (required-check name) |
|---|---|---|
| [`.github/workflows/arcloops-ci.yaml`](../.github/workflows/arcloops-ci.yaml) | `pull_request` → `staging`, `main` | **`arcloops-ci`** |
| [`.github/workflows/arcloops-deploy.yaml`](../.github/workflows/arcloops-deploy.yaml) | `push` → `staging`, `main` | `arcloops-deploy` |

Unchanged Twenty workflows (do not overwrite):

- `.github/workflows/ci-front.yaml`
- `.github/workflows/ci-server.yaml`
- `.github/workflows/cd-deploy-main.yaml` — still fires on `main`; expect it
  to fail here (dispatches `twentyhq/twenty-infra`). Ignore it.

## What CI does

Lean gate only. Yarn 4 + Nx + Node 24 (via [`.github/actions/yarn-install`](../.github/actions/yarn-install/action.yaml),
which runs `yarn --immutable --check-cache`).

1. Fetch local `main` (needed because `lint:diff-with-main` is `main...HEAD`).
2. `npx nx lint:diff-with-main twenty-server`
3. `npx nx lint:diff-with-main twenty-front`
4. `npx nx build twenty-shared` then `typecheck` on both packages.

A no-op PR with no `src/**/*.ts(x)` vs `main` should lint as “No changed files.”
Typecheck still runs the full package (minutes, not the full Twenty Storybook /
integration suite).

## What deploy does

`staging` → Railway environment **`uat`**.  
`main` → Railway environment **`production`**.

From the repo root, for each of `twenty-server`, `twenty-worker`, `twenty-front`:

```bash
railway up --service <name> --environment <uat|production> --detach
# plus --project <id> when vars.RAILWAY_PROJECT_ID is set
```

CLI is pinned to `@railway/cli@5.45.10`. Build/start stay on the Railway
service (see [`deploy/railway/README.md`](../deploy/railway/README.md)); this
workflow only uploads and kicks the deploy.

If `secrets.RAILWAY_TOKEN` is missing on `staging` or `main`, the job **fails
with an error** (does not skip).

Use a **workspace or account token** in `RAILWAY_TOKEN` so one secret can
target both `uat` and `production`. An environment-scoped project token only
works for the environment it was created in.

## Required GitHub configuration

### Secrets and variables

GitHub → repo `arcloops/twenty-crm` → **Settings** → **Secrets and variables**
→ **Actions**:

| Name | Type | Value |
|---|---|---|
| `RAILWAY_TOKEN` | Repository **secret** | Railway token (Account → Tokens, or workspace token). Do not invent or commit it. |
| `RAILWAY_PROJECT_ID` | Repository **variable** | Project ID from the Railway dashboard for `arcloops-crm`. Needed for workspace/account tokens. |

Do not add a token value to git. The workflow only references
`${{ secrets.RAILWAY_TOKEN }}`.

### Branch protection on `main` (admin only)

Protection **cannot** be applied without admin on this repo. Do not use `gh`
for this unless you are that admin. After the first `arcloops-ci` run exists
(so the check name is searchable):

**Rulesets (current UI)**

1. **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch
   ruleset**.
2. Name: `Protect main`. Enforcement: **Active**.
3. Target branches → **Include** → `main`.
4. Enable **Require a pull request before merging** (direct pushes to `main`
   blocked).
5. Enable **Require status checks to pass**.
6. Add required check: **`arcloops-ci`** (job name, not the workflow title).
7. Do **not** add Twenty jobs (`ci-front-status-check`,
   `ci-server-status-check`, `CD deploy main`, …).
8. Save. If you are not an admin, GitHub will refuse the save.

**Classic branch protection (same intent)**

1. **Settings** → **Branches** → **Add classic branch protection rule**.
2. Branch name pattern: `main`.
3. Check **Require a pull request before merging**.
4. Check **Require status checks to pass before merging**.
5. Search and add **`arcloops-ci`**.
6. Save.

`staging` is not required by the plan. Protect it the same way if you want
UAT merges gated too.

## Remaining human steps

- [ ] Commit and push these workflows (this pass does not commit).
- [ ] Push local `staging` if it is not on `origin` yet (deploy only runs on
      GitHub `push`).
- [ ] Add `RAILWAY_TOKEN` (secret) and `RAILWAY_PROJECT_ID` (variable).
- [ ] Confirm Railway project `arcloops-crm` has environments **uat** and
      **production**, each with services named exactly `twenty-server`,
      `twenty-worker`, `twenty-front`.
- [ ] Open a no-op PR into `staging` or `main` and confirm **`arcloops-ci`**
      is green.
- [ ] After `arcloops-ci` has run once: apply **main** protection (admin).
- [ ] Merge to `staging` and confirm UAT services get a new Railway deploy.
- [ ] Ignore failures from Twenty’s `cd-deploy-main` / heavy CI on this fork.

**Exit (not met until the human steps land):** a no-op PR goes green; merge
to `staging` updates UAT; `main` requires a PR and `arcloops-ci`.
