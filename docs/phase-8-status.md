# Phase 8 status — Production

**State: templates only. Production is not live.**

This pass added Railway production *templates* and a human checklist. Nobody
has created the Railway **production** environment, provisioned prod
Postgres/Redis, deployed the three services, or pointed DNS at
`crm.arcloops.io`. Do not treat this repo change as a go-live.

Do **not** reuse UAT `APP_SECRET`, database URLs, or other secrets. Generate
new values and new databases for production.

Do **not** run the Railway CLI or touch a live production stack from this
checklist until you choose to.

## What this pass added

| File | Role |
|---|---|
| [`deploy/railway/production.env.example`](../deploy/railway/production.env.example) | Prod shared-variable template (`FRONTEND_URL=https://crm.arcloops.io`, `SIGN_IN_PREFILLED=false`, `NODE_ENV=production`). Empty `APP_SECRET`; `SERVER_URL` is a placeholder. Phase 5 keys appended, commented, with prod callback hosts. |
| [`deploy/railway/README.md`](../deploy/railway/README.md) | Production section: new env, new DBs, same three services, new secrets, CNAME, one-off init, app + webhooks + admins. |
| This file | Status and remaining human steps. |

No Railway project was created or changed. No production secrets are in git.

## Remaining human steps

Do these in the Railway dashboard, DNS, and the prod workspace — not by
committing secrets here.

- [ ] Create Railway environment **production** in project `arcloops-crm`
- [ ] Provision **new** Postgres and **new** Redis in **production** (not UAT)
- [ ] Create `twenty-server`, `twenty-worker`, `twenty-front` in production
      (same build/start as UAT; see [`deploy/railway/README.md`](../deploy/railway/README.md))
- [ ] Paste keys from `production.env.example`; generate a **new** `APP_SECRET`
- [ ] Set `SERVER_URL` and front `REACT_APP_SERVER_BASE_URL` to the prod API host
- [ ] Use **prod** OAuth redirect URIs and **prod** Brevo / R2 / API keys
- [ ] CNAME `crm.arcloops.io` → Railway **twenty-front** host
- [ ] After first successful server build: one-off
      `yarn nx run twenty-server:database:init:prod` on **production**
      `twenty-server` (never against UAT)
- [ ] Publish the Arcloops SDK app to the **prod** workspace
- [ ] Recreate webhooks pointing at **prod** n8n (`n8n.arcloops.io` or a
      split prod n8n)
- [ ] Invite **Swajan**, **Imdad**, **Saad** as **admin**; BD hires as **member**
- [ ] Confirm: prod login, email, upload, one Teams notification, Training
      Delivery installed

**Exit (not met):** `https://crm.arcloops.io` is a working copy of the UAT
shape with its own secrets and data.
