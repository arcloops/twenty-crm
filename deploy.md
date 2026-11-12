# Arcloops CRM — small-team deploy & cost guide

Audience: **8–10 light users**. ~95% of Railway spend is **memory**. Usage volume is not the bill — **always-on Nest RSS + oversized limits** are.

Live API: `https://crm-api.arcloops.io` · SPA: `https://crm.arcloops.io`

---

## 1. Memory breakdown (do this in Railway)

For each service, record **memory limit** vs **avg / peak RSS** (Metrics → Memory):

| Service | Role | Typical small-team target |
|---------|------|---------------------------|
| **server** (API) | Nest + SPA + (optional) queues | **768 MB** limit after `RUN_WORKERS_IN_SERVER=true` |
| **worker** | Second Nest | **Delete** when using in-server workers |
| **Postgres** | DB | **512 MB** (tune if storage/CPU need more) |
| **Redis** | BullMQ + cache | **128–192 MB** with `maxmemory` |

**Checklist**

1. [ ] Note current limits for server / worker / Postgres / Redis.
2. [ ] Note peak RSS over 24h.
3. [ ] Confirm no extra services (website, docs, ClickHouse, Grafana, companion).
4. [ ] After Google-only + in-server workers, lower limits to peak + ~20% headroom.
5. [ ] Set `NODE_OPTIONS=--max-old-space-size=512` on the Node service so V8 cannot inflate toward a fat limit.

If worker limit is 1–2 Gi and RSS is ~500 Mi, you are paying for unused memory 24/7.

---

## 2. Google-only auth & sync

**Product decision:** Google signup/login + Gmail/Calendar. No Microsoft.

| Variable | Value |
|----------|--------|
| `AUTH_GOOGLE_ENABLED` | `true` |
| `MESSAGING_PROVIDER_GMAIL_ENABLED` | `true` |
| `CALENDAR_PROVIDER_GOOGLE_ENABLED` | `true` |
| `AUTH_MICROSOFT_ENABLED` | `false` |
| `MESSAGING_PROVIDER_MICROSOFT_ENABLED` | `false` |
| `CALENDAR_PROVIDER_MICROSOFT_ENABLED` | `false` |
| `IS_IMAP_SMTP_CALDAV_ENABLED` | `false` (unless you need IMAP) |
| `AUTH_PASSWORD_ENABLED` | `false` (or `true` only as emergency fallback) |
| `IS_BILLING_ENABLED` / `ANALYTICS_ENABLED` / AI chat | `false` |

Prod uses **config-in-DB** (`isConfigVariablesInDbEnabled: true`). Set the same flags in:

1. Railway env (source for boot / env-only vars), and  
2. Admin → Settings → Configuration Variables (DB-backed toggles),

then **restart** the API.

**After flip**

1. Settings → Accounts: disconnect leftover **Microsoft** connected accounts.
2. Clear stale BullMQ repeatable jobs (old crons survive env changes):

```bash
# From a host that can reach Redis (Railway Redis URL):
redis-cli -u "$REDIS_URL" --scan --pattern 'bull:cron-queue:repeat:*' | while read -r key; do redis-cli -u "$REDIS_URL" DEL "$key"; done
```

Or run: `bash packages/twenty-docker/scripts/clear-stale-bullmq-repeatables.sh "$REDIS_URL"`

3. Re-register crons by restarting the server (entrypoint runs `cron:register:all` unless disabled).
4. Verify `GET https://crm-api.arcloops.io/client-config`:
   - `authProviders.google: true`, `microsoft: false`
   - `isGoogleMessagingEnabled` / `isGoogleCalendarEnabled: true`
   - Microsoft messaging/calendar: `false`

Template: [`packages/twenty-docker/arcloops.env.example`](packages/twenty-docker/arcloops.env.example)

---

## 3. Small-team topology (biggest structural save)

**Before (expensive):** API Nest + Worker Nest + Postgres + Redis  
**After (recommended):** **1× Nest** (`RUN_WORKERS_IN_SERVER=true`) + Postgres + Redis + S3

| Setting | Value |
|---------|--------|
| `RUN_WORKERS_IN_SERVER` | `true` |
| Separate Railway **worker** service | **Removed** |
| `WORKER_EXCLUDED_QUEUES` | `ai-queue,ai-stream-queue,campaign-queue,campaign-send-queue,campaign-engagement-queue,billing-queue` |
| `NODE_OPTIONS` | `--max-old-space-size=512` |

**Do not** run `yarn worker:prod` at the same time — that doubles consumers and memory.

Compose reference: [`packages/twenty-docker/docker-compose.arcloops.yml`](packages/twenty-docker/docker-compose.arcloops.yml)

Code: when `RUN_WORKERS_IN_SERVER=true`, [`app.module.ts`](packages/twenty-server/src/app.module.ts) registers BullMQ explorers in the API process.

Tradeoff: sync jobs share CPU with GraphQL — fine at 8–10 users.

---

## 4. Right-size Railway limits

After the topology + Google flip stabilize (~1 day of metrics):

1. Set **server** memory limit ≈ peak RSS + 20% (start **768 MB**).
2. Set **Postgres** ≈ peak + headroom (start **512 MB**).
3. Set **Redis** ≈ peak + headroom (start **192 MB**); optionally `maxmemory 128mb` + `noeviction`.
4. **Delete worker** service if `RUN_WORKERS_IN_SERVER=true`.
5. Keep **1** replica for Node.

Re-check the invoice: memory line should drop in proportion to removed/shrunk services.

---

## 5. Sleep / uptime policy

| Policy | Memory $ | Google sync | Recommendation |
|--------|----------|-------------|----------------|
| **A — Always-on tiny** | Controlled by limits + 1 Node | Reliable | **Default for Arcloops** |
| **B — Business hours** | Lower nights/weekends | Catches up in the morning | Only if team accepts offline CRM off-hours |
| **C — Sleep on idle** | Lowest | Breaks / delays sync & OAuth while asleep | Not compatible with “need Google sync” |

**Chosen default: A — Always-on tiny.**

If you later choose B: schedule Railway to scale Node (and optionally Redis) to 0 outside business hours; expect no login/sync until wake. Do **not** sleep only Redis while Node is up.

---

## 6. Feature / package matrix

| Keep in prod | Do not deploy |
|--------------|---------------|
| `twenty-server` (with in-server workers) | `twenty-website` |
| Postgres, Redis, S3 | `twenty-docs` |
| `twenty-front` on `crm.arcloops.io` | Separate worker (when `RUN_WORKERS_IN_SERVER`) |
| `twenty-mobile` (EAS) | ClickHouse, companion, zapier runtime |

Build deps still needed: `twenty-shared`, `twenty-ui`, `twenty-emails`, `twenty-client-sdk`, …

---

## 7. Apply order (Railway)

0. Confirm Railway is connected to **`arcloops/twenty-crm`** (standalone, not the old fork backup) and builds `packages/twenty-docker/twenty/Dockerfile` from this repo. Upstream `twentycrm/twenty` images ignore `RUN_WORKERS_IN_SERVER`.
1. Add env from `arcloops.env.example` (Google secrets filled). Mirror Google/Microsoft/IMAP toggles in **Admin → Configuration Variables** (DB-backed).
2. Set `RUN_WORKERS_IN_SERVER=true` on **server**; redeploy **this** image.
3. Confirm health + Google login + Gmail connect (`GET /client-config`).
4. Remove **worker** service (do not run both).
5. Clear stale Redis repeatables; restart server once.
6. Lower memory limits to measured peaks.
7. Re-check `/client-config` and Railway memory $ after a few days.
8. After deploys look good, delete `arcloops/twenty-crm-fork-backup`.

---

## What will not cut memory cost

- Deleting unused monorepo packages that are not Railway services.
- Hoping 8–10 users alone reduces RAM.
- Leaving a 2 Gi worker “just in case.”
