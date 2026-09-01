# Phase 5 status — Auth, email, files

**State: templates and a human runbook only. UAT Google login, SMTP, and R2
are not configured.**

This pass added fill-in env templates and dashboard steps. Nobody created a
Google Cloud OAuth client, Azure app, Brevo SMTP key, or R2 bucket from this
repo. Do not treat these files as a working UAT integration.

Do **not** put real secrets in git. Paste them in Railway **uat** only.

## What this pass added

| File | Role |
|---|---|
| [`deploy/railway/uat-integrations.env.example`](../deploy/railway/uat-integrations.env.example) | Empty Phase 5 keys (`AUTH_GOOGLE_*`, `AUTH_MICROSOFT_*`, `EMAIL_SMTP_*`, `STORAGE_S3_*`, `ANTHROPIC_API_KEY`). Callback comments use `crm-staging.arcloops.io` and `<twenty-server-public-host>`. |
| [`deploy/railway/PHASE-5-RUNBOOK.md`](../deploy/railway/PHASE-5-RUNBOOK.md) | Step-by-step: two Google OAuth clients, Azure app, Brevo SMTP, R2, and which Railway variable each value maps to. Redirect paths match `.env.example`. |
| [`deploy/railway/uat.env.example`](../deploy/railway/uat.env.example) | Existing Phase 2 keys unchanged. Same Phase 5 keys appended, all commented. |
| This file | Status and remaining human steps. |

`docs/arcloops-phased-deployment-plan.md` was not edited.

## What a human must do before UAT works

Do these in Google Cloud, Azure, Brevo, Cloudflare, and Railway — not by
committing secrets here. Follow
[`deploy/railway/PHASE-5-RUNBOOK.md`](../deploy/railway/PHASE-5-RUNBOOK.md).

**Before Google (or Microsoft) login works**

- [ ] Know the live API host (`SERVER_URL` / `<twenty-server-public-host>`).
      Callbacks go to the **server**, not `crm-staging.arcloops.io`.
- [ ] Google Cloud: OAuth consent screen + Web client with
      `https://<twenty-server-public-host>/auth/google/redirect`
- [ ] Separate Google OAuth client (Gmail APIs enabled) with
      `https://<twenty-server-public-host>/auth/google-apis/get-access-token`.
      Paste that client’s ID/secret into `AUTH_GOOGLE_CLIENT_ID` /
      `AUTH_GOOGLE_CLIENT_SECRET` and keep **both** redirect URIs on it
      (this server has no second Google client-id variable).
- [ ] Add UAT testers on the consent screen while the app is in Testing.
- [ ] And/or Azure app with
      `/auth/microsoft/redirect` and
      `/auth/microsoft-apis/get-access-token`
- [ ] Paste `AUTH_GOOGLE_*` and/or `AUTH_MICROSOFT_*` into Railway **uat**
      (shared, or server + worker). Redeploy those services.
- [ ] Confirm sign-in on `https://crm-staging.arcloops.io`

**Before email works**

- [ ] Create a Brevo SMTP key; copy host / port / login / key from Brevo
- [ ] Verify the From address/domain in Brevo
- [ ] Set `EMAIL_DRIVER=smtp`, `EMAIL_FROM_*`, `EMAIL_SMTP_*` on UAT
- [ ] Redeploy server + worker; send a test invite or reset mail

**Before R2 uploads work**

- [ ] Create a UAT-only R2 bucket and API token
- [ ] Set `STORAGE_TYPE=s3`, `STORAGE_S3_REGION=auto`, `STORAGE_S3_NAME`,
      `STORAGE_S3_ENDPOINT`, `STORAGE_S3_ACCESS_KEY_ID`,
      `STORAGE_S3_SECRET_ACCESS_KEY`
- [ ] Redeploy server + worker; upload a file and confirm the object in R2

**Optional**

- [ ] `ANTHROPIC_API_KEY` (and `AI_MODELS_DEFAULT_*` only if you pin models)

**Exit (not met):** Google or Microsoft login works on UAT; a test email
sends; a file upload lands in R2.
