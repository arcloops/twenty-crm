# Phase 6 status — Arcloops Twenty app

August 2026. Scaffold only. **Publish to UAT is still a human step.**

## What was created

Hand-scaffolded (no `create-twenty-app`) at
[`packages/twenty-apps/internal/arcloops-extension/`](../packages/twenty-apps/internal/arcloops-extension/),
copying `examples/hello-world` (`defineObject` / `defineLogicFunction` /
`defineApplication`, `universalIdentifier` on every object and field).
SDK pin is **2.31.0** (hello-world’s 2.13.0 would miss this workspace).

| Piece | Path |
|---|---|
| App config (`displayName: Arcloops`) | `src/application-config.ts` |
| Default function role | `src/roles/default-role.ts` |
| Training Delivery object | `src/objects/training-delivery.ts` |
| Company relation (MANY_TO_ONE + inverse) | `src/fields/client-company-on-training-delivery.ts`, `src/fields/training-deliveries-on-company.ts` |
| `syncCertificate` | `src/logic-functions/sync-certificate.ts` |
| `staleDealAlert` | `src/logic-functions/stale-deal-alert.ts` |
| Teams Adaptive Card helper | `src/lib/teams.ts` |
| List view + sidebar item | `src/views/training-deliveries.ts`, `src/navigation-menu-items/training-deliveries.ts` |
| Record page (fields + timeline) | `src/page-layouts/training-delivery.ts`, `src/views/training-delivery-record-page-fields.ts` |
| Stage constants | `src/constants/opportunity-stages.ts` |
| Operator README | `packages/twenty-apps/internal/arcloops-extension/README.md` |

### Training Delivery fields

`title` (Programme), `deliveryDate`, `participantCount`, `cohortId`,
`facilitator`, `status` SELECT (Planned / In Progress / Completed / Certified),
`clientCompany` RELATION to standard Company.

`FieldType.RELATION` is supported in the current SDK. No TEXT fallback.

### Logic functions

- **syncCertificate** — current SDK triggers: `databaseEventTriggerSettings`
  (`trainingDelivery.updated` on `status`) plus HTTP `POST /sync-certificate`.
  POSTs to `CERTIFICATE_PORTAL_API_URL/cohorts` with Bearer
  `CERTIFICATE_PORTAL_API_KEY`. Missing env returns
  `{ success: false, error }` — it does not throw.
- **staleDealAlert** — `cronTriggerSettings` `0 9 * * 1-5` (cron **is** in
  this SDK) plus HTTP `POST /stale-deal-alert` for n8n / manual exec.
  Posts to `TEAMS_BD_WEBHOOK_URL` via `postToTeams`.

Not used: old `defineFunction` + `trigger: 'RECORD_UPDATE'` / `'CRON'`.

## Still human

Publish to a live UAT workspace was **not** done (no API token in this
pass). Remaining:

1. `cd packages/twenty-apps/internal/arcloops-extension && yarn install`
2. `yarn twenty remote:add` for local and later UAT (workspace API key)
3. `yarn twenty dev` against local, or `yarn twenty app:publish --private`
   then `yarn twenty app:install` on UAT
4. Set app env: `CERTIFICATE_PORTAL_API_URL`,
   `CERTIFICATE_PORTAL_API_KEY`, `TEAMS_BD_WEBHOOK_URL`
5. Confirm **Settings → Applications** shows Arcloops and Training Delivery
6. Execute one logic function successfully
7. Opportunity stages in the UI: Warm Contact → Meeting Booked →
   Discovery → Proposal Sent → Negotiation → Won / Lost
8. Roles in the UI: Swajan, Imdad, Saad — admin; BD hires — member

Core packages (`twenty-server`, `twenty-front`, `twenty-sdk`) were not
edited.
