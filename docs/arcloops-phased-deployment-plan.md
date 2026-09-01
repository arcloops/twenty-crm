# Arcloops CRM — Phased Deployment Plan

> August 2026 · Source of truth for *how* to deploy this fork.
> Product intent (Teams, n8n, Training Delivery, pipeline) still lives in
> [`Twenty CRM Deployment.md`](./Twenty%20CRM%20Deployment.md).
> **Do not run commands from that older doc.** Use this plan instead.

### Phase 0–2 status (executed locally)

Done:

- Clone unshallowed (~14,923 commits)
- `upstream` remote added
- Node **24.20.0** via Homebrew `node@24` (do not use brew `node` 26.x — Twenty is `^24.5.0`)
- Yarn 4.13.0 (`corepack yarn`, or [`scripts/bin/yarn`](../scripts/bin/yarn) on PATH)
- Local `staging` branch (not pushed)
- Gitignored server/front `.env`; `yarn install` succeeded
- Server built; UAT Postgres schemas created and instance migrations applied
- Railway UAT templates in [`deploy/railway/`](../deploy/railway/)

Still in progress / you still do:

1. Workspace seed may still be running against Railway (slow over the public proxy). After it finishes: `yarn start` (put `scripts/bin` and `node@24` on PATH). Export `NODE_TLS_REJECT_UNAUTHORIZED=0` if Railway TLS still fails.
2. Persist PATH: `export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:$PATH"` in `~/.zshrc` so new shells stay on Node 24.
3. Railway dashboard: three app services + [`deploy/railway/uat.env.example`](../deploy/railway/uat.env.example). Use a **new** UAT `APP_SECRET`. Config-only — no CLI deploy in this pass.

---

## Current snapshot (this clone)

| Item | State |
|---|---|
| GitHub | `origin` → `arcloops/twenty-crm`; `upstream` → `twentyhq/twenty` |
| Clone | Full history (`shallow` = false) |
| Branch | Local `staging` (from `main`; not pushed) |
| Toolchain | Yarn 4.13.0; Node **24.20.0** (`node@24`, not brew `node` 26) |
| Local `.env` | Present (gitignored). Points at UAT public Postgres + Redis |
| `node_modules` | Installed |
| Railway app services | Config files only — create services in the dashboard |

This repo is **Yarn 4 + Nx + Node 24**, not pnpm + Node 20.

---

## Principles

1. **Never edit core packages** (`twenty-server`, `twenty-front`, `twenty-sdk`) unless a branding file has no other hook. Custom CRM objects and jobs live in a Twenty **app** (SDK), not in core.
2. **One Postgres + one Redis per environment.** Local, UAT, and production never share a database. `npx nx database:reset twenty-server` wipes the DB it points at.
3. **Neon and Upstash are optional.** Railway managed Postgres + Redis replace them. Skip Neon/Upstash unless you later want a disposable laptop DB outside Railway.
4. **Laptop cannot use Railway private hostnames.** `*.railway.internal` and `${{Postgres.DATABASE_URL}}` work only between Railway services. From your Mac, use the dashboard **public / TCP-proxy** URL.
5. **n8n is a separate service**, not a target in this monorepo. Same Railway *Postgres instance* is fine; n8n must use its own database name (not Twenty’s `default`).
6. **Verify file paths against this tree** before any branding copy script. The older doc’s `ThemeLight.ts` and logo paths are stale.

---

## Target architecture

```
GitHub  arcloops/twenty-crm
  origin    → git@github.com:arcloops/twenty-crm.git
  upstream  → https://github.com/twentyhq/twenty.git

  feature/*  → PR (optional Railway preview)
  staging    → UAT    crm-staging.arcloops.io
  main       → prod   crm.arcloops.io

Railway project: arcloops-crm
  Environments: uat | production   (each has its own Postgres + Redis)

  Per environment:
    twenty-server   NestJS API          PORT 3000
    twenty-worker   same build, worker  node dist/queue-worker/queue-worker
    twenty-front    static SPA          serve packages/twenty-front/build
    postgres        Railway managed
    redis           Railway managed

n8n (separate Railway service or n8n Cloud)
  n8n.arcloops.io
  Twenty webhooks → n8n → Brevo / Twilio / Stripe / Teams / Cal.com
  External webhooks → n8n → Twenty REST / GraphQL
```

MS Teams Incoming Webhooks replace Slack. No Slack tokens.

---

## Phase 0 — Git and toolchain

**Goal:** Full history, both remotes, Yarn 4, Node 24.5+.

```bash
# Full history (required before any upstream sync)
git fetch --unshallow origin

git remote add upstream https://github.com/twentyhq/twenty.git
git remote -v
# origin    git@github.com:arcloops/twenty-crm.git
# upstream  https://github.com/twentyhq/twenty.git

# Node ^24.5.0, then:
corepack enable
corepack prepare yarn@4.13.0 --activate
yarn --version   # 4.13.0
```

Do **not** install pnpm for this repo. Do **not** merge `upstream/main` yet.

**Branching (from here on):**

```
main      production   crm.arcloops.io
staging   UAT          crm-staging.arcloops.io
feature/* PRs
upstream-sync-*   review branch for Twenty upstream only
```

Own work: `feature/*` → PR into `staging` → promote to `main`.

**Exit:** `git remote -v` shows both remotes; `yarn --version` is 4.x; Node is 24.5+.

---

## Phase 1 — Local CRM running

**Goal:** Log into Twenty on `http://localhost:3001` from this laptop.

### 1.1 Databases

Pick **one**. Do not use the live UAT database for local resets.

| Option | When to use |
|---|---|
| **A — Railway “dev” Postgres + Redis** (recommended if you want zero Docker and no Neon) | Extra Railway databases you are happy to wipe. Paste **public** URLs into local `.env`. |
| **B — Local Docker / native Postgres + Redis** | Official Twenty path. `bash packages/twenty-utils/setup-dev-env.sh` works only if Docker or local PG 16 + Redis exist. |
| **C — Neon + Upstash** | Only if you refuse Docker *and* do not want Railway DBs on the laptop. Not required. |

Do **not** point local `.env` at the UAT environment’s Postgres if a UAT site is (or will be) using it.

### 1.2 Install and env

```bash
yarn install

cp packages/twenty-server/.env.example packages/twenty-server/.env
cp packages/twenty-front/.env.example  packages/twenty-front/.env
```

In `packages/twenty-server/.env` keep the example defaults except:

```env
PG_DATABASE_URL=<public railway / local / neon url>
REDIS_URL=<public railway / local / upstash rediss url>
APP_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
```

Leave `FRONTEND_URL=http://localhost:3001` and `SIGN_IN_PREFILLED=true`.

Front `.env` already has `REACT_APP_SERVER_BASE_URL=http://localhost:3000`. Do not add `VITE_SERVER_BASE_URL` or `FRONT_BASE_URL` — those names are not used here.

### 1.3 Migrate and start

```bash
npx nx database:reset twenty-server
yarn start
```

Open `http://localhost:3001` → **Continue with Email** → use the prefilled credentials.

**Exit:** You can sign in and see the default workspace. GraphQL is at `http://localhost:3000/api/graphql`.

Skip `setup-dev-env.sh` if you chose cloud/Railway DBs (option A or C).

---

## Phase 2 — Railway UAT

**Goal:** A running UAT stack at `crm-staging.arcloops.io` with **its own** Postgres and Redis.

Do this only after Phase 1 works. You can add Railway Postgres/Redis earlier for Phase 1 option A; the **app services** wait until local login works.

### 2.1 Project and environment

```bash
npm install -g @railway/cli
railway login
railway init    # project: arcloops-crm
```

In the Railway dashboard:

1. Create environment **uat** (and later **production**).
2. In **uat**: New → Database → PostgreSQL; New → Database → Redis.
3. Create **three app services** (do not put n8n in this repo’s build):

| Service | Build (from repo root) | Start |
|---|---|---|
| `twenty-server` | `yarn install --immutable && yarn nx build twenty-server` | `node packages/twenty-server/dist/main` |
| `twenty-worker` | same as server | `node packages/twenty-server/dist/queue-worker/queue-worker` |
| `twenty-front` | `yarn install --immutable && yarn nx build twenty-front` | `npx serve@latest packages/twenty-front/build -s -l 3001` |

Front output directory is **`build`**, not `dist`.

Do **not** commit the older doc’s multi-`[[services]]` `railway.toml` as if Railway will honor it for this monorepo. Configure each service in the dashboard (or one `railway.toml` **per service** if you split config later).

### 2.2 UAT env vars (shared, then override per service)

```env
NODE_ENV=production
APP_SECRET=<new random, not the local one>
FRONTEND_URL=https://crm-staging.arcloops.io
SERVER_URL=https://<twenty-server public host>
PG_DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
SIGN_IN_PREFILLED=false
STORAGE_TYPE=local
EMAIL_DRIVER=LOGGER
LOG_LEVELS=error,warn
```

Map Railway’s `DATABASE_URL` onto Twenty’s **`PG_DATABASE_URL`**. After first deploy, run Twenty’s production DB init on the **server** service (from Twenty’s scripts):

```bash
# on the server service / after first successful build
yarn nx run twenty-server:database:init:prod
```

(Exact Railway one-off command: `railway run` against `twenty-server`, or a release command on that service. Do this once per new environment.)

### 2.3 Domain

- Attach `crm-staging.arcloops.io` to **twenty-front**.
- Point API/auth callbacks at the **server** public URL (or a `crm-api-staging.arcloops.io` CNAME if you add one).
- DNS: CNAME to the Railway service host.

**Exit:** UAT URL loads, you can create/sign in to a workspace, worker is running (jobs do not sit forever in Redis).

---

## Phase 3 — Branding (after UAT works)

**Goal:** Arcloops name, logo, and colours without painting the whole of `twenty-front`.

1. Prefer **workspace settings** (workspace name + logo) — no core edits.
2. If you still need chrome/favicon/title:
   - Find the **current** files in this tree first. `ThemeLight.ts` does **not** exist.
   - Title is `packages/twenty-front/index.html` (`<title>Twenty</title>`).
   - Logos are referenced as `/images/integrations/twenty-logo.svg` and similar — confirm before copying.
3. Keep source assets in something like `packages/arcloops-theme/` and list every core file you touch in `ARCLOOPS_OVERRIDES.md`.
4. Only then write `scripts/apply-branding.sh` against those **verified** paths.

Authority Blue `#0A66C2` and Growth Green `#2DB012` are the intended tokens. Do not apply the older doc’s `ThemeLight.patch.ts` blindly.

**Exit:** UAT shows Arcloops name/logo. `ARCLOOPS_OVERRIDES.md` lists every core file actually changed.

---

## Phase 4 — CI and branch protection

**Goal:** PRs into `staging` / `main` fail on lint/typecheck; deploys are explicit.

This repo has no Railway deploy workflow today. Do **not** paste the older `pnpm tsc && railway up` workflow.

Suggested shape:

1. On `pull_request` to `staging` / `main`: `yarn install --immutable`, then `npx nx lint:diff-with-main twenty-server` and `twenty-front`, plus package typecheck.
2. On `push` to `staging` / `main`: deploy the three Railway services for that environment (`RAILWAY_TOKEN` in GitHub Secrets).
3. Branch protection on `main`: PRs required, checks must pass.

**Exit:** A no-op PR goes green; merge to `staging` updates UAT.

---

## Phase 5 — Auth, email, files (UAT first)

**Goal:** Real sign-in, mail, and uploads on UAT. Copy the same keys to prod in Phase 8 with prod URLs.

Use names from `packages/twenty-server/.env.example` / `config-variables.ts`:

| Need | Variables (this repo) |
|---|---|
| Google sign-in | `AUTH_GOOGLE_ENABLED=true`, `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`, `AUTH_GOOGLE_CALLBACK_URL=https://<server>/auth/google/redirect` |
| Gmail / Google APIs | `MESSAGING_PROVIDER_GMAIL_ENABLED`, `AUTH_GOOGLE_APIS_CALLBACK_URL=https://<server>/auth/google-apis/get-access-token` (separate OAuth client with Gmail scopes) |
| Microsoft | `AUTH_MICROSOFT_ENABLED`, `AUTH_MICROSOFT_CLIENT_ID`, `AUTH_MICROSOFT_CLIENT_SECRET`, `AUTH_MICROSOFT_CALLBACK_URL=https://<server>/auth/microsoft/redirect`, `AUTH_MICROSOFT_APIS_CALLBACK_URL=…/auth/microsoft-apis/get-access-token` |
| Brevo SMTP | `EMAIL_DRIVER=smtp`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD` |
| Cloudflare R2 | `STORAGE_TYPE=s3`, `STORAGE_S3_REGION=auto`, `STORAGE_S3_NAME`, `STORAGE_S3_ENDPOINT`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` (optional; use `AI_MODELS_DEFAULT_*` if you pin models) |

There is no `MS_TENANT_ID`, `GMAIL_CONNECTED_ACCOUNT_*`, `SMTP_HOST`, `FRONT_BASE_URL`, `AWS_ACCESS_KEY_ID`, or `LLM_CHAT_MODEL` in this server config.

**Exit:** Google (or Microsoft) login works on UAT; a test email sends; a file upload lands in R2.

---

## Phase 6 — Arcloops Twenty app (SDK)

**Goal:** Custom objects and jobs as an installable app, not core patches.

```bash
# from outside the monorepo packages you will publish, or as its own folder
npx create-twenty-app@latest arcloops-extension
```

Treat it like `packages/twenty-apps/examples/hello-world`:

- `defineObject` / `defineLogicFunction` / `defineApplication` from `twenty-sdk/define`
- Every object and field needs a **`universalIdentifier`**
- Local sync: `yarn twenty remote:add` then `yarn twenty dev`
- Ship: `npx twenty app:publish` (or the current CLI equivalent in that app’s README)

Copy **hello-world**, not the older `defineFunction` + `trigger: 'RECORD_UPDATE'` / `'CRON'` snippets.

First ship (UAT workspace):

1. **Training Delivery** object (programme, date, participants, cohort, facilitator, status, relation to Company).
2. **Certificate sync** logic function when status becomes Certified → `CERTIFICATE_PORTAL_API_*`.
3. **Stale deal** weekday job → Teams Incoming Webhook (helper in the app, not a Twenty core env var).

Deal stages in the workspace (settings, not code):  
Warm Contact → Meeting Booked → Discovery → Proposal Sent → Negotiation → Won / Lost.

Roles: Swajan, Imdad, Saad — admin; BD hires — member.

**Exit:** App visible under Settings → Applications on UAT; Training Delivery exists; one logic function has been executed successfully.

---

## Phase 7 — n8n and Teams

**Goal:** Integrations go through n8n; Teams gets Adaptive Cards. Slack is unused.

1. Deploy n8n as its **own** Railway service (or n8n Cloud). Domain: `n8n.arcloops.io`.
2. Create Postgres database `n8n` on the UAT instance (or a dedicated n8n Postgres). Do not use Twenty’s `default` DB.
3. Teams: channel → Connectors → Incoming Webhook for `#bd-pipeline`, `#engineering`, `#general`. Store URLs in **n8n** (or the SDK app env), not as Twenty core config.
4. In Twenty UAT: Settings → Webhooks, e.g.
   - `https://n8n.arcloops.io/webhook/twenty-contact-created`
   - `https://n8n.arcloops.io/webhook/twenty-deal-updated`
   - `https://n8n.arcloops.io/webhook/twenty-training-certified`
5. Wire flows one at a time: contact → Brevo; deal Proposal Sent → Teams; Stripe won → Twenty + Teams; Cal.com → activity; Tally → contact; training certified → cert portal.

**Exit:** One webhook from Twenty produces a Teams card; one external webhook writes back into Twenty.

---

## Phase 8 — Production

**Goal:** `crm.arcloops.io` is a copy of the UAT shape with new secrets and its own data.

1. Railway environment **production**: new Postgres, new Redis, same three app services.
2. New `APP_SECRET`, new OAuth callback URLs, prod Brevo/R2/API keys. Never reuse UAT `APP_SECRET` or DB URLs.
3. Domains: `crm.arcloops.io` → front; server URL + OAuth redirects on the prod API host; `n8n.arcloops.io` or a prod n8n if you split.
4. Run `database:init:prod` once on prod.
5. Publish the Arcloops app to the **prod** workspace; recreate webhooks pointing at prod n8n.
6. Invite: Swajan / Imdad / Saad admin; BD hires member.

**Exit:** Prod login, email, upload, one Teams notification, Training Delivery installed.

---

## Phase 9 — Monthly upstream sync

**Goal:** Stay mergeable with `twentyhq/twenty` without surprise core conflicts.

```bash
git fetch --unshallow origin   # if still shallow
git fetch upstream
git log HEAD..upstream/main --oneline
git checkout -b upstream-sync-YYYY-MM
git merge upstream/main
# re-apply only files listed in ARCLOOPS_OVERRIDES.md
# yarn install && yarn start — smoke test locally
# PR → staging → then main
```

If custom work stayed in the SDK app, conflicts should be limited to the override list.

Set a monthly calendar reminder.

---

## Environment variable cheat sheet

Older doc name → **use this instead**

| Do not use | Use |
|---|---|
| `FRONT_BASE_URL` | `FRONTEND_URL` |
| `VITE_SERVER_BASE_URL` | `REACT_APP_SERVER_BASE_URL` |
| `LOG_LEVEL` | `LOG_LEVELS` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | `EMAIL_SMTP_HOST` / `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASSWORD` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `STORAGE_S3_ACCESS_KEY_ID` / `STORAGE_S3_SECRET_ACCESS_KEY` |
| `…/auth/google/callback` | `…/auth/google/redirect` |
| `MS_CLIENT_ID`, `MS_TENANT_ID`, `MS_CALLBACK_URL` | `AUTH_MICROSOFT_CLIENT_ID`, `AUTH_MICROSOFT_CALLBACK_URL` (`…/redirect`) |
| `GMAIL_CONNECTED_ACCOUNT_CLIENT_ID` | `MESSAGING_PROVIDER_GMAIL_ENABLED` + `AUTH_GOOGLE_APIS_CALLBACK_URL` |
| `LLM_CHAT_MODEL` / `LLM_CHAT_MODEL_DRIVER` | `ANTHROPIC_API_KEY` + `AI_MODELS_DEFAULT_*` |
| `MESSAGE_QUEUE_TYPE=bull-mq` | omit; set `REDIS_URL` |
| `pnpm …` | `yarn …` / `npx nx …` |
| `node …/dist/src/main.js` | `node packages/twenty-server/dist/main` |
| Front `dist` | `packages/twenty-front/build` |
| `npx twenty-sdk deploy` | `yarn twenty dev` / `npx twenty app:publish` |
| `defineFunction` + RECORD_UPDATE / CRON | `defineLogicFunction` + `universalIdentifier` (see hello-world) |

`TEAMS_*` and `TWENTY_CRM_API_KEY` are **not** Twenty core vars. Put them on n8n or in the SDK app.

---

## What not to take from `Twenty CRM Deployment.md`

| Older doc | This plan |
|---|---|
| pnpm, Node 20, `pnpm run dev` | Yarn 4, Node 24.5+, `yarn start` |
| Neon + Upstash required | Railway Postgres + Redis; Neon/Upstash optional |
| One `railway.toml` with n8n + all apps | Three Railway app services; n8n separate |
| `ThemeLight.ts` + listed logo paths | Verify current files; prefer workspace logo |
| Invented `.github/workflows/deploy.yml` (`pnpm tsc`) | Nx lint/typecheck + Railway per service |
| `packages/arcloops-extension` as a handmade core-adjacent package | `create-twenty-app` + current SDK |
| Shared DB for local and UAT | Forbidden |

Keep from the older doc: fork + monthly upstream, isolate custom work, Teams not Slack, n8n as integration hub, Training Delivery / cert portal / stale deals, pipeline stages, admin roster.

---

## Phase checklist

### Phase 0
- [x] `git fetch --unshallow origin`
- [x] `upstream` remote added
- [x] Node 24.20.0 (`brew install node@24`) and Yarn 4.13.x

### Phase 1
- [ ] Dedicated local/dev Postgres + Redis (laptop `.env` currently uses **UAT public** URLs)
- [x] `.env` files from examples (correct names)
- [x] `yarn install`
- [x] Instance schema migrated (workspace seed may still be running over Railway)
- [x] API on `http://localhost:3000` (`/healthz` 200); front on **3002** (3001 is another Next.js app)

### Phase 2
- [x] Service `railway.toml` + [`deploy/railway/README.md`](../deploy/railway/README.md) + `uat.env.example`
- [ ] Railway project + **uat** environment (dashboard)
- [ ] UAT Postgres + Redis (already created; do not share with a future disposable local DB)
- [ ] server / worker / front services start with paths in this plan
- [ ] `database:init:prod` once on UAT
- [ ] `crm-staging.arcloops.io` loads and accepts login

### Phase 3
- [ ] Workspace name/logo set
- [ ] Any core branding files listed in `ARCLOOPS_OVERRIDES.md`
- [ ] Paths verified against this tree (no stale `ThemeLight.ts`)

### Phase 4
- [ ] CI on PRs (lint + typecheck)
- [ ] Deploy on push to `staging` / `main`
- [ ] `main` branch protection

### Phase 5
- [ ] Google and/or Microsoft OAuth on UAT (correct redirect paths)
- [ ] Brevo SMTP verified
- [ ] R2 uploads working

### Phase 6
- [ ] `arcloops-extension` scaffolded with current SDK
- [ ] Training Delivery published to UAT
- [ ] One logic function proven
- [ ] Pipeline stages + admins

### Phase 7
- [ ] n8n on its own service + own DB
- [ ] Teams Incoming Webhooks
- [ ] One Twenty → Teams flow and one external → Twenty flow

### Phase 8
- [ ] Production env with new secrets and DBs
- [ ] `crm.arcloops.io` live
- [ ] App + webhooks installed on prod

### Phase 9
- [ ] Monthly calendar reminder
- [ ] First `upstream-sync-*` PR through staging
