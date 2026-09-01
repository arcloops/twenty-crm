# Railway setup (Arcloops CRM)

Config-only. Do not run `railway init` / `railway up` from this repo until you
choose to. Create the project and services in the Railway dashboard.

Railway’s Config-as-code (`railway.toml`) is deprecated for **new** services
(hard cutoff 2026-12-01). Prefer pasting the build/start commands below into
each service’s Settings. The `railway.toml` files remain as the command source
of truth if you can still attach a config path.

Do not add n8n as a service in this monorepo.

## 1. Project and environment

1. Create project `arcloops-crm` (or use the existing one).
2. Create environment **uat** (production later, with its own Postgres + Redis).
3. In **uat**: New → Database → PostgreSQL; New → Database → Redis.

Local laptop `.env` currently points at the UAT **public** URLs.  
`npx nx database:reset twenty-server` will wipe that same Postgres.

## 2. Three app services

Create empty services from the **repo root** (Root Directory = `.`).

| Service | Config file (if Config-as-code still works) | Build | Start |
|---|---|---|---|
| `twenty-server` | [`twenty-server/railway.toml`](./twenty-server/railway.toml) | `yarn install --immutable && yarn nx build twenty-server` | `NODE_PORT=${PORT:-3000} node packages/twenty-server/dist/main` |
| `twenty-worker` | [`twenty-worker/railway.toml`](./twenty-worker/railway.toml) | same as server | `node packages/twenty-server/dist/queue-worker/queue-worker` |
| `twenty-front` | [`twenty-front/railway.toml`](./twenty-front/railway.toml) | `yarn install --immutable && yarn nx build twenty-front` | `npx serve@latest packages/twenty-front/build -s -l ${PORT:-3001}` |

If Config-as-code is available: Settings → Config-as-code → set the path to
that service’s `railway.toml` (absolute from repo root, e.g.
`/deploy/railway/twenty-server/railway.toml`).

Healthcheck for server: **`/healthz`** (not `/health`).  
Front output directory is **`build`**, not `dist`.

Twenty listens on **`NODE_PORT`**, not Railway’s `PORT`. The start
commands above map `NODE_PORT=${PORT:-3000}` and serve on `${PORT:-3001}`.
Paste those exact start strings in the dashboard. Set
`NIXPACKS_NODE_VERSION=24` (see the env examples) — Twenty is `^24.5.0`.

## 3. Environment variables

Copy keys from [`uat.env.example`](./uat.env.example).

- Map Railway `DATABASE_URL` onto Twenty’s **`PG_DATABASE_URL`**.
- Generate a **new** `APP_SECRET` for UAT. Do not reuse the local one.
- Set `REACT_APP_SERVER_BASE_URL` on **twenty-front** to the public server URL
  (Vite inlines it at build time).
- `FRONTEND_URL` / `SERVER_URL` must match the public UAT hosts.
- Auth / SMTP / R2: [`PHASE-5-RUNBOOK.md`](./PHASE-5-RUNBOOK.md) and
  [`uat-integrations.env.example`](./uat-integrations.env.example).
- n8n is a **separate** service: [`../n8n/README.md`](../n8n/README.md).
- Workspace stages and admins: [`../../docs/workspace-setup.md`](../../docs/workspace-setup.md).

## 4. Domain

- Attach `crm-staging.arcloops.io` to **twenty-front**.
- Use the twenty-server public host (or `crm-api-staging.arcloops.io`) for
  `SERVER_URL` and later OAuth callbacks.
- DNS: CNAME to the Railway service host.

## 5. First-time database init

After the first successful **twenty-server** build, run once per environment
(Railway one-off / `railway run` against `twenty-server`):

```bash
yarn nx run twenty-server:database:init:prod
```

Do not run this against production until the Production section below.

## 6. Confirm UAT

- Front loads at `https://crm-staging.arcloops.io`
- You can create or sign in to a workspace
- Worker is running (jobs do not sit forever in Redis)

## Production

Templates only. Production is **not** live. Do this in the Railway dashboard
(and DNS) when you are ready — do not run the Railway CLI from this pass.

Production is a **new environment** with its own data. Never reuse UAT
`APP_SECRET`, Postgres, Redis, or other secrets.

### 1. New environment and databases

1. In project `arcloops-crm`, create environment **production**.
2. In **production** only: New → Database → PostgreSQL; New → Database → Redis.
   These must be new instances — do not attach the UAT databases.

### 2. Same three app services

Create `twenty-server`, `twenty-worker`, and `twenty-front` in **production**
with the same Root Directory, build, and start commands as UAT (section 2).
Healthcheck for server remains **`/healthz`**. Front output is **`build`**.

### 3. New secrets and env vars

Copy keys from [`production.env.example`](./production.env.example).

- Generate a **new** `APP_SECRET`. Do not reuse UAT or local.
- `PG_DATABASE_URL` / `REDIS_URL` must resolve to the **production** Postgres
  and Redis (`${{Postgres.DATABASE_URL}}` / `${{Redis.REDIS_URL}}` in this env).
- `FRONTEND_URL=https://crm.arcloops.io`
- `SERVER_URL` = the production twenty-server public host (placeholder until
  the service has a URL).
- `SIGN_IN_PREFILLED=false`, `NODE_ENV=production`.
- Set `REACT_APP_SERVER_BASE_URL` on **twenty-front** to the prod server URL.
- When copying Phase 5 integrations: new OAuth clients (or new redirect URIs)
  on the prod API host; **prod** Brevo / R2 / API keys. Do not paste UAT
  secrets.

### 4. Domain

- Attach `crm.arcloops.io` to **twenty-front**.
- DNS: CNAME `crm.arcloops.io` to the Railway front service host.
- Point `SERVER_URL` and OAuth callbacks at the production API host (or
  `crm-api.arcloops.io` if you add that CNAME).
- n8n: `n8n.arcloops.io`, or a separate prod n8n if you split environments.

### 5. First-time database init

After the first successful **twenty-server** build in **production**, run
**once** (Railway one-off against that production `twenty-server`):

```bash
yarn nx run twenty-server:database:init:prod
```

Do not point this command at the UAT database.

### 6. App, webhooks, and people

1. Publish the Arcloops SDK app to the **production** workspace
   (`npx twenty app:publish` or the current CLI in that app’s README).
2. Recreate Twenty webhooks in **prod**, pointing at **prod** n8n (not UAT),
   e.g. contact-created, deal-updated, training-certified.
3. Invite **Swajan**, **Imdad**, and **Saad** as **admin**; BD hires as
   **member**.

### 7. Confirm production (human)

- Front loads at `https://crm.arcloops.io`
- Prod login, email, and file upload work
- One Teams notification from a prod webhook
- Training Delivery is installed on the prod workspace
