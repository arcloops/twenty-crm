# Phase 7 status — n8n and Teams

Config and importable workflows only. **Not done:** live n8n on Railway,
Teams Incoming Webhooks, or secrets. Those need your Microsoft 365 and
Railway accounts. Nothing was committed.

`TEAMS_*` and `TWENTY_CRM_API_KEY` are **not** Twenty core env vars. They
belong on the n8n service (or the Phase 6 SDK app). n8n is **not** in
`deploy/railway/twenty-*/railway.toml`.

## Files created

| Path | Role |
|---|---|
| [`deploy/n8n/README.md`](../deploy/n8n/README.md) | Separate Railway n8n service, DB `n8n`, domain, env vars |
| [`deploy/n8n/env.example`](../deploy/n8n/env.example) | Placeholders only — no real keys or webhook hosts |
| [`deploy/n8n/workflows/README.md`](../deploy/n8n/workflows/README.md) | Twenty webhook URLs, node graphs, Adaptive Card shape |
| [`deploy/n8n/workflows/twenty-contact-created.json`](../deploy/n8n/workflows/twenty-contact-created.json) | `person.created` → Brevo list (placeholder) |
| [`deploy/n8n/workflows/twenty-deal-updated.json`](../deploy/n8n/workflows/twenty-deal-updated.json) | `opportunity.updated` + Proposal Sent → Teams card |
| [`deploy/n8n/workflows/stripe-payment-succeeded.json`](../deploy/n8n/workflows/stripe-payment-succeeded.json) | Stripe → GraphQL Won + Teams |
| [`deploy/n8n/workflows/cal-com-booking.json`](../deploy/n8n/workflows/cal-com-booking.json) | Cal.com → Twenty note on matched person |
| [`deploy/n8n/workflows/tally-warm-contact.json`](../deploy/n8n/workflows/tally-warm-contact.json) | Tally → person + opportunity `WARM_CONTACT` |
| [`deploy/n8n/workflows/twenty-training-certified.json`](../deploy/n8n/workflows/twenty-training-certified.json) | Certified → cert portal + note |

## Twenty webhooks to register

Settings → Webhooks (UAT workspace), after n8n is reachable:

```
https://n8n.arcloops.io/webhook/twenty-contact-created
https://n8n.arcloops.io/webhook/twenty-deal-updated
https://n8n.arcloops.io/webhook/twenty-training-certified
```

| URL | Operations |
|---|---|
| `…/twenty-contact-created` | `person.created` |
| `…/twenty-deal-updated` | `opportunity.updated` |
| `…/twenty-training-certified` | `trainingDelivery.updated` (needs Phase 6 app) |

Vendor webhooks (not Twenty):

```
https://n8n.arcloops.io/webhook/stripe-payment-succeeded
https://n8n.arcloops.io/webhook/cal-com-booking
https://n8n.arcloops.io/webhook/tally
```

Put `opportunityId` on Stripe PaymentIntent metadata. Until Opportunity
stages are renamed in Settings, set `TWENTY_INBOUND_STAGE=NEW` and
`TWENTY_WON_STAGE=CUSTOMER`. After rename: `WARM_CONTACT` / `WON`.

## Remaining human steps

1. **Teams Incoming Webhooks** — `#bd-pipeline`, `#engineering`, `#general`
   → Connectors → Incoming Webhook → name `Arcloops CRM`. Copy URLs.
2. **Railway n8n** — empty service (do not attach this repo) or n8n Cloud.
   Image `n8nio/n8n`. Domain `n8n.arcloops.io`. DNS CNAME.
3. **Postgres database `n8n`** — `CREATE DATABASE n8n;` on the UAT instance
   (or a dedicated Postgres). Do not use Twenty’s default DB.
4. **Paste secrets** on the n8n service from
   [`deploy/n8n/env.example`](../deploy/n8n/env.example):
   `N8N_ENCRYPTION_KEY`, `DB_POSTGRESDB_*`, `TWENTY_CRM_API_URL` (server
   origin), `TWENTY_CRM_API_KEY` (Settings → APIs), `TEAMS_BD_WEBHOOK_URL`,
   Brevo / Stripe / cert portal placeholders as you enable each flow.
5. **Import workflows** — n8n ⋯ → Import from File → activate one at a time.
6. **Register Twenty webhooks** — three URLs above, matching operations.
7. **Smoke test** — Proposal Sent → Teams card; one external event
   (Stripe test or Tally) writes back into Twenty.

Phase 7 exit (from the deployment plan): one Twenty → Teams flow and one
external → Twenty flow.
