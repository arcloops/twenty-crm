# Phase 5 runbook — Auth, email, files (UAT)

Human-only. This repo cannot create Google Cloud, Azure, Brevo, or Cloudflare
R2 resources. Create them in those dashboards, then paste values into Railway
**uat**. Do not commit secrets.

Names and redirect **paths** come from
`packages/twenty-server/.env.example` and
`packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`.

| Host | URL |
|---|---|
| Front (login UI) | `https://crm-staging.arcloops.io` |
| API (OAuth callbacks) | `https://<twenty-server-public-host>` — same placeholder as `SERVER_URL` in [`uat.env.example`](./uat.env.example) |

Fill-in template: [`uat-integrations.env.example`](./uat-integrations.env.example).

There is no `MS_TENANT_ID`, `GMAIL_CONNECTED_ACCOUNT_*`, `SMTP_HOST`,
`FRONT_BASE_URL`, `AWS_ACCESS_KEY_ID`, or `LLM_CHAT_MODEL`.

---

## Where to paste in Railway

Project **arcloops-crm** → environment **uat**.

1. Prefer **Shared Variables** so `twenty-server` and `twenty-worker` both see
   the keys. Front does not need OAuth, SMTP, or R2 secrets.
2. If you only set service-level vars, paste on **both** `twenty-server` and
   `twenty-worker`.
3. Replace every `<twenty-server-public-host>` with the live API host (Railway
   `*.up.railway.app` or `crm-api-staging.arcloops.io` if you CNAME it).
4. Redeploy **twenty-server** and **twenty-worker** after saving.

`FRONTEND_URL=https://crm-staging.arcloops.io` and `SERVER_URL` must already
match those hosts (Phase 2). OAuth redirects are on the **API** host, not the
front host.

---

## 1. Google OAuth — sign-in

Twenty sign-in uses `AUTH_GOOGLE_*` and callback path **`/auth/google/redirect`**.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or pick a project (UAT naming is enough, e.g. `arcloops-crm-uat`).
3. **APIs & Services → OAuth consent screen**
   - User type: External (or Internal if you have Google Workspace).
   - App name / support email: Arcloops CRM UAT.
   - Authorized domains: `arcloops.io` if the form asks.
   - Scopes for sign-in: `email`, `profile` (and `openid` if offered).
   - If the app is in **Testing**, add every UAT tester under **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - Name: e.g. `twenty-uat-google-signin`.
   - Authorized JavaScript origins:
     - `https://crm-staging.arcloops.io`
     - `https://<twenty-server-public-host>`
   - Authorized redirect URI (exact path from `.env.example`):
     - `https://<twenty-server-public-host>/auth/google/redirect`
5. Copy **Client ID** and **Client secret**.

Paste in Railway **uat**:

| Google Cloud field | Railway variable |
|---|---|
| Client ID | `AUTH_GOOGLE_CLIENT_ID` |
| Client secret | `AUTH_GOOGLE_CLIENT_SECRET` |

Also set:

```env
AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_CALLBACK_URL=https://<twenty-server-public-host>/auth/google/redirect
```

---

## 2. Google OAuth — Gmail / Calendar APIs (separate client)

Gmail connect uses **`/auth/google-apis/get-access-token`**. Create a **second**
OAuth client (Gmail scopes). This server still has only one
`AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` pair — both sign-in and
Gmail read those two variables. There is no `GMAIL_CONNECTED_ACCOUNT_*`.

**You must add both redirect URIs to the client whose credentials you paste.**

1. Same Google Cloud project (or a dedicated APIs project).
2. Enable APIs:
   - [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
   - [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
   - [People API](https://console.cloud.google.com/apis/library/people.googleapis.com)
3. **Credentials → Create credentials → OAuth client ID** (Web application).
   - Name: e.g. `twenty-uat-google-apis`.
   - Authorized JavaScript origins: same two origins as sign-in.
   - Authorized redirect URI:
     - `https://<twenty-server-public-host>/auth/google-apis/get-access-token`
   - Also add the sign-in URI on **this** client if this is the pair you will
     paste:
     - `https://<twenty-server-public-host>/auth/google/redirect`
4. Consent screen: add Gmail/Calendar scopes Twenty requests
   (`gmail.readonly`, `gmail.send`, `gmail.compose`, `calendar.events`,
   `profile.emails.read`, plus `email` / `profile`). Keep testers listed while
   the app is in Testing.
5. If you keep two clients, paste **this** client’s ID/secret into
   `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` (and keep both
   redirect URIs on it). The unused sign-in-only client can be deleted.

Paste / set in Railway **uat**:

```env
MESSAGING_PROVIDER_GMAIL_ENABLED=true
AUTH_GOOGLE_APIS_CALLBACK_URL=https://<twenty-server-public-host>/auth/google-apis/get-access-token
```

Optional: `CALENDAR_PROVIDER_GOOGLE_ENABLED=true` for Calendar sync.

---

## 3. Microsoft Azure app

Twenty uses `AUTH_MICROSOFT_*`. Callback paths from `.env.example`:
**`/auth/microsoft/redirect`** and **`/auth/microsoft-apis/get-access-token`**.
There is no `MS_TENANT_ID`.

1. Open [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID →
   App registrations → New registration**.
2. Name: e.g. `arcloops-crm-uat`.
3. Supported account types: pick the accounts you will actually sign in
   (single tenant vs any Microsoft account).
4. Redirect URI → platform **Web**:
   - `https://<twenty-server-public-host>/auth/microsoft/redirect`
5. After create: **Authentication → Add a platform / redirect URI** and add:
   - `https://<twenty-server-public-host>/auth/microsoft-apis/get-access-token`
6. **Certificates & secrets → New client secret**. Copy the **Value** once.
7. **Overview**: copy **Application (client) ID**. Do not create a Twenty env
   var for Directory (tenant) ID.
8. **API permissions → Add a permission → Microsoft Graph → Delegated**:
   - `openid`, `email`, `profile`, `offline_access`, `User.Read`
   - `Mail.ReadWrite`, `Mail.Send` (or `Mail.Read` if receive-only)
   - `Calendars.ReadWrite` (or `Calendars.Read` if sync-only)
   Grant admin consent if your tenant requires it.

Users who connect Outlook/Calendar need a Microsoft 365 licence.

Paste in Railway **uat**:

| Azure field | Railway variable |
|---|---|
| Application (client) ID | `AUTH_MICROSOFT_CLIENT_ID` |
| Client secret Value | `AUTH_MICROSOFT_CLIENT_SECRET` |

```env
AUTH_MICROSOFT_ENABLED=true
AUTH_MICROSOFT_CALLBACK_URL=https://<twenty-server-public-host>/auth/microsoft/redirect
AUTH_MICROSOFT_APIS_CALLBACK_URL=https://<twenty-server-public-host>/auth/microsoft-apis/get-access-token
```

Optional: `MESSAGING_PROVIDER_MICROSOFT_ENABLED=true` and
`CALENDAR_PROVIDER_MICROSOFT_ENABLED=true`.

You can enable Google, Microsoft, or both. Phase 5 exit is met if **one** of
them logs in on UAT.

---

## 4. Brevo SMTP

Twenty mail uses `EMAIL_DRIVER` + `EMAIL_SMTP_*` + `EMAIL_FROM_*`.
Do not set `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD`.

1. Open the Brevo dashboard → SMTP / transactional settings (label varies).
2. Create or reveal an **SMTP key**.
3. Copy the host, port, login, and key **exactly as Brevo shows them**.
   Do not guess the hostname here.
4. Choose a verified sender (`EMAIL_FROM_ADDRESS`) that Brevo will accept
   (domain authentication in Brevo if you send from `@arcloops.io`).

Paste in Railway **uat**:

| Brevo field | Railway variable |
|---|---|
| SMTP host | `EMAIL_SMTP_HOST` |
| SMTP port | `EMAIL_SMTP_PORT` |
| SMTP login | `EMAIL_SMTP_USER` |
| SMTP key | `EMAIL_SMTP_PASSWORD` |

```env
EMAIL_DRIVER=smtp
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=
```

This **overrides** `EMAIL_DRIVER=LOGGER` from [`uat.env.example`](./uat.env.example).

---

## 5. Cloudflare R2

Twenty storage uses `STORAGE_TYPE` + `STORAGE_S3_*`.
Do not set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

1. Cloudflare dashboard → **R2 Object Storage**.
2. Create a bucket (UAT-only name, e.g. `arcloops-crm-uat`). Copy the bucket
   name into `STORAGE_S3_NAME`.
3. **Manage R2 API Tokens** → create a token with Object Read & Write on
   that bucket. Copy Access Key ID and Secret Access Key.
4. Copy the S3 API endpoint Cloudflare shows for the account/bucket
   (typically `https://<accountid>.r2.cloudflarestorage.com`). Paste into
   `STORAGE_S3_ENDPOINT`. Do not invent the account id.
5. CORS: allow origin `https://crm-staging.arcloops.io` if you later enable
   browser uploads via presigned URLs (`STORAGE_S3_PRESIGNED_URL_*` stays
   unused unless you turn it on).

Paste in Railway **uat**:

```env
STORAGE_TYPE=s3
STORAGE_S3_REGION=auto
STORAGE_S3_NAME=
STORAGE_S3_ENDPOINT=
STORAGE_S3_ACCESS_KEY_ID=
STORAGE_S3_SECRET_ACCESS_KEY=
```

This **overrides** `STORAGE_TYPE=local` from [`uat.env.example`](./uat.env.example).
Twenty casts `s3` to `S_3`.

---

## 6. Anthropic (optional)

```env
ANTHROPIC_API_KEY=
```

There is no `LLM_CHAT_MODEL`. To pin models after the key works, use
`AI_MODELS_DEFAULT_FAST`, `AI_MODELS_DEFAULT_SMART`,
`AI_MODELS_DEFAULT_RECOMMENDED`, `AI_MODELS_DEFAULT_DISABLED`.

---

## 7. Verify on UAT

After redeploy:

1. Open `https://crm-staging.arcloops.io` → Google (or Microsoft) sign-in.
   Redirect must land on `/auth/google/redirect` or `/auth/microsoft/redirect`
   on the **API** host, then back to the front workspace.
2. Trigger a mail Twenty sends (invite, password reset, or workspace email).
   Confirm it arrives from `EMAIL_FROM_ADDRESS`.
3. Upload a file on a record. Confirm an object appears in the R2 bucket.

Gmail/Outlook mailbox sync also needs the worker running and (later) Twenty’s
messaging/calendar cron commands if you use connected inboxes.

---

## Phase 8 reminder

Copy the **same variable names** to production with new secrets and prod
callback URLs (`crm.arcloops.io` + prod API host). Never reuse UAT
`APP_SECRET`, OAuth clients (or at least not UAT redirect URIs), Brevo keys,
or R2 tokens.
