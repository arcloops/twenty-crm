# Railway apply checklist — Arcloops Google-only + small-team memory

## Preconditions

- [ ] GitHub source is `arcloops/twenty-crm` (not `twenty-crm-fork-backup`)
- [ ] Server builds `packages/twenty-docker/twenty/Dockerfile` from this repo
- [ ] `RUN_WORKERS_IN_SERVER` is in the deployed image (`app.module` change) — confirm logs show `BullMQ consumers run in this process`

Live `/client-config` before flip (expected problem state):

- `authProviders.microsoft: true`, `google: false`
- `isMicrosoftMessagingEnabled` / `isMicrosoftCalendarEnabled: true`
- `isGoogleMessagingEnabled` / `isGoogleCalendarEnabled: false`
- `isImapSmtpCaldavEnabled: true`

## On Railway dashboard

### Server service variables

Paste from `packages/twenty-docker/arcloops.env.example` (fill Google OAuth + secrets):

- `RUN_WORKERS_IN_SERVER=true` (env-only; Admin UI cannot enable this)
- `NODE_OPTIONS=--max-old-space-size=512`
- `WORKER_EXCLUDED_QUEUES=ai-queue,ai-stream-queue,campaign-queue,campaign-send-queue,campaign-engagement-queue,billing-queue`
- Google auth + Gmail + Calendar **on**
- Microsoft auth + messaging + calendar **off**
- `IS_IMAP_SMTP_CALDAV_ENABLED=false`
- Billing / analytics / onboarding AI **off**
- `AUTH_PASSWORD_ENABLED=true` until Google login is verified

Also set the same Google/Microsoft/IMAP toggles in **Admin → Configuration Variables** (DB-backed), then restart.

### Remove worker service

After server redeploy with `RUN_WORKERS_IN_SERVER=true` is healthy:

1. Delete or disable the dedicated **worker** Railway service.
2. Confirm only one Node service remains.

### Memory limits (after 24h of metrics)

| Service | Start limit |
|---------|-------------|
| server | 768 MB |
| Postgres | 512 MB |
| Redis | 192 MB |
| worker | gone |

Lower further if peak RSS + 20% is smaller.

### Redis repeatables

```bash
bash packages/twenty-docker/scripts/clear-stale-bullmq-repeatables.sh "$REDIS_URL"
```

Then restart the API once so `cron:register:all` runs.

### Verify

```bash
curl -s https://crm-api.arcloops.io/client-config | jq '{
  auth: .authProviders,
  googleMsg: .isGoogleMessagingEnabled,
  googleCal: .isGoogleCalendarEnabled,
  msMsg: .isMicrosoftMessagingEnabled,
  msCal: .isMicrosoftCalendarEnabled,
  imap: .isImapSmtpCaldavEnabled
}'
```

Expect: Google auth + messaging + calendar true; Microsoft auth + messaging + calendar false; IMAP false.

### Sleep policy

**Always-on tiny** (default). Do not sleep the worker/API if Google sync must stay current.
