# n8n (separate Railway service)

n8n is the Arcloops integration hub: Twenty webhooks in, Brevo / Teams /
Stripe / Cal.com / Tally / cert portal out, and GraphQL/REST writes back
into Twenty.

This is **not** a target in the Twenty monorepo. Do not add n8n to
`deploy/railway/twenty-*/railway.toml`. Do not put `TEAMS_*` or
`TWENTY_CRM_API_KEY` on twenty-server / twenty-worker / twenty-front.

You cannot finish this phase from the repo alone. Incoming Webhooks need
a Microsoft 365 tenant; Railway n8n needs your Railway project.

## 1. Create the n8n database

Same Railway Postgres **instance** as UAT is fine. n8n must use its own
database name — never Twenty’s `default` / `railway` DB.

In the Railway Postgres query console (or `psql` on the **public** URL):

```sql
CREATE DATABASE n8n;
```

Or provision a dedicated Railway Postgres and point `DB_POSTGRESDB_*` at
that instance, still with `DB_POSTGRESDB_DATABASE=n8n`.

## 2. Create the Railway service

In the **uat** environment (production later, Phase 8):

1. New service → **Empty service** (do **not** connect `arcloops/twenty-crm`).
2. Settings → Source: Docker image `n8nio/n8n` (or n8n Cloud instead).
3. Custom domain: `n8n.arcloops.io` (CNAME to the Railway service host).
4. Listen port: **5678** (`N8N_PORT` / Railway `PORT`).

n8n Cloud is an acceptable substitute. Use the same webhook paths below
and paste the Cloud webhook host in Twenty instead of `n8n.arcloops.io`.

## 3. Environment variables (n8n service only)

Copy [`env.example`](./env.example). Generate secrets locally; never commit
real values.

```bash
# encryption key (required; losing it locks existing credentials)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Variable | Notes |
|---|---|
| `N8N_HOST` | `n8n.arcloops.io` (hostname only) |
| `N8N_PORT` | `5678` |
| `N8N_PROTOCOL` | `https` |
| `WEBHOOK_URL` | `https://n8n.arcloops.io/` (trailing slash) |
| `N8N_ENCRYPTION_KEY` | Random; store in a password manager |
| `N8N_SECURE_COOKIE` | `true` |
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` / `_PORT` / `_USER` / `_PASSWORD` | Railway Postgres (private host between services) |
| `DB_POSTGRESDB_DATABASE` | **`n8n`** |
| `TWENTY_CRM_API_URL` | Twenty **server** origin, no path (UAT example: `https://<twenty-server-public-host>`) |
| `TWENTY_CRM_API_KEY` | Twenty → Settings → APIs → New key. Placeholder only in git |
| `TWENTY_INBOUND_STAGE` | Tally new-deal stage. `WARM_CONTACT` after rename; `NEW` until then |
| `TWENTY_WON_STAGE` | Stripe won stage. `WON` after rename; `CUSTOMER` until then |
| `TEAMS_BD_WEBHOOK_URL` | Teams `#bd-pipeline` Incoming Webhook. Placeholder only |
| `TEAMS_ENGINEERING_WEBHOOK_URL` | `#engineering` (optional; unused by the starter workflows) |
| `TEAMS_GENERAL_WEBHOOK_URL` | `#general` (optional) |
| `BREVO_API_KEY` / `BREVO_CRM_LIST_ID` | Contact sync |
| `STRIPE_WEBHOOK_SECRET` | Verify Stripe if you add a signature check later |
| `CERTIFICATE_PORTAL_API_URL` / `CERTIFICATE_PORTAL_API_KEY` | Training certified |

`TWENTY_CRM_API_URL` is the API host (`/graphql` and `/rest/...`), not
`crm-staging.arcloops.io` (the SPA).

## 4. Import workflows

In the n8n editor: **⋯ → Import from File**. Files live in
[`workflows/`](./workflows/). Activate one flow at a time.

Production URLs (after DNS):

| Workflow | Method | Path |
|---|---|---|
| Contact created → Brevo | POST | `/webhook/twenty-contact-created` |
| Deal updated → Teams | POST | `/webhook/twenty-deal-updated` |
| Stripe payment → Twenty + Teams | POST | `/webhook/stripe-payment-succeeded` |
| Cal.com booking → Twenty note | POST | `/webhook/cal-com-booking` |
| Tally → Warm Contact | POST | `/webhook/tally` |
| Training certified → cert portal | POST | `/webhook/twenty-training-certified` |

Full URLs: `https://n8n.arcloops.io/webhook/<path>`.

## 5. Twenty webhooks to register

In the UAT workspace: **Settings → APIs & Webhooks → Webhooks** (or
**Settings → Webhooks**).

| Target URL | Operations |
|---|---|
| `https://n8n.arcloops.io/webhook/twenty-contact-created` | `person.created` |
| `https://n8n.arcloops.io/webhook/twenty-deal-updated` | `opportunity.updated` |
| `https://n8n.arcloops.io/webhook/twenty-training-certified` | `trainingDelivery.updated` |

`trainingDelivery` exists only after the Phase 6 Arcloops app is installed.

Twenty POSTs JSON `{ eventName, record, updatedFields, … }` and waits **5s**.
Workflows reply on receive (`responseMode: onReceived`).

Do not register Stripe / Cal.com / Tally in Twenty. Point those vendors at
the n8n paths in the table above.

## 6. Teams Incoming Webhooks

Per channel (no Azure bot, no Slack):

1. Teams → channel (`#bd-pipeline`, then `#engineering`, `#general`).
2. ⋯ → **Connectors** → **Incoming Webhook** → Configure.
3. Name: `Arcloops CRM`. Copy the URL.
4. Paste into the n8n service as `TEAMS_BD_WEBHOOK_URL` (and the other two).

Cards are Adaptive Card **title + FactSet** (same shape as the product doc).
Deal “Proposal Sent” and Stripe “Won” both POST to `$TEAMS_BD_WEBHOOK_URL`.

## 7. Smoke test (Phase 7 exit)

1. Create a person in Twenty → Brevo list gets the email (or the HTTP node
   returns 200 against the placeholder once `BREVO_*` is set).
2. Move an opportunity to **Proposal Sent** → Adaptive Card in `#bd-pipeline`.
3. POST a test Stripe `payment_intent.succeeded` (with
   `metadata.opportunityId`) → opportunity stage **Won** and a Teams card.

One Twenty → Teams path and one external → Twenty path is enough to exit
the phase. Wire the rest when those vendors are ready.
