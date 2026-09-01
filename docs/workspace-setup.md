# Workspace setup (human, in the UI)

Pipeline stages and people are **Settings**, not code. Do this on each
workspace (local → UAT → prod) after you can sign in.

## Empty workspace (no Apple / Tim seed)

Do **not** run `workspace:seed:dev` or the default
`npx nx database:reset twenty-server` (that configuration **seeds**).
Those create `tim@apple.dev` and Apple/YC demo records.

To wipe the DB in `packages/twenty-server/.env` and leave it empty:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0   # if the URL is Railway public TLS
npx nx database:reset twenty-server --configuration=no-seed
```

If Nx hangs on `generateBarrels`, run the same steps from `dist`:

```bash
cd packages/twenty-server
node dist/database/scripts/truncate-db.js
node dist/database/scripts/setup-db.js
node dist/command/command.js run-instance-commands --force --include-slow
node dist/command/command.js cache:flush
```

That wipes **whatever Postgres `.env` points at** (today: Railway UAT).
Do not do this against a DB you want to keep.

Then sign in on the UI (no prefilled Tim account):

1. Continue with Email
2. `swajan@arcloops.io` + a password you choose
3. Create workspace named **Arcloops**
4. Invite Imdad / Saad / BD from Settings → Members (no employee seed)

Local `.env` for this mode: `IS_MULTIWORKSPACE_ENABLED=false`,
`SIGN_IN_PREFILLED=false`, `AUTH_PASSWORD_ENABLED=true`,
`IS_EMAIL_VERIFICATION_REQUIRED=false`,
`IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=false`.

## Opportunity stages

Twenty ships these **values**: `NEW`, `SCREENING`, `MEETING`, `PROPOSAL`,
`CUSTOMER`.

Arcloops wants seven stages:

| Order | Label | Value to use |
|---|---|---|
| 1 | Warm Contact | `WARM_CONTACT` |
| 2 | Meeting Booked | `MEETING_BOOKED` |
| 3 | Discovery | `DISCOVERY` |
| 4 | Proposal Sent | `PROPOSAL_SENT` |
| 5 | Negotiation | `NEGOTIATION` |
| 6 | Won | `WON` |
| 7 | Lost | `LOST` |

**Settings → Data model → Opportunity → Stage** (or the Opportunities
kanban settings):

1. Rename `NEW` → Warm Contact (`WARM_CONTACT`) if the UI lets you edit
   the option value; otherwise add Warm Contact and migrate records.
2. Rename `MEETING` → Meeting Booked.
3. Add Discovery and Negotiation.
4. Rename `PROPOSAL` → Proposal Sent.
5. Split `CUSTOMER` into Won and Lost (or rename to Won and add Lost).
6. Delete unused default options (`SCREENING`) once no records use them.

Until this is done, n8n inbound/won writes should use Twenty defaults:

```env
TWENTY_INBOUND_STAGE=NEW
TWENTY_WON_STAGE=CUSTOMER
```

After the rename, switch those to `WARM_CONTACT` / `WON`
([`deploy/n8n/env.example`](../deploy/n8n/env.example)).

`staleDealAlert` treats `WON`, `LOST`, `CUSTOMER`, and their labels as
closed.

## Admins and members

**Settings → Members / Roles**:

- Swajan, Imdad, Saad — **admin**
- BD hires — **member**

## Branding (Phase 3)

**Settings → General**: workspace name `Arcloops` (or `Arcloops CRM`).
Upload [`packages/arcloops-theme/assets/arcloops-wordmark.svg`](../packages/arcloops-theme/assets/arcloops-wordmark.svg)
(or a real brand file). This drives the sidebar and tab favicon.

## Applications (Phase 6)

After `yarn twenty dev` or `app:publish` + `app:install`:

1. **Settings → Applications** shows **Arcloops**.
2. Set app env: `CERTIFICATE_PORTAL_API_URL`,
   `CERTIFICATE_PORTAL_API_KEY`, `TEAMS_BD_WEBHOOK_URL`.
3. Confirm Training Delivery is in the sidebar.

## Webhooks (Phase 7)

**Settings → Webhooks** (n8n must be reachable first):

```
https://n8n.arcloops.io/webhook/twenty-contact-created   → person.created
https://n8n.arcloops.io/webhook/twenty-deal-updated      → opportunity.updated
https://n8n.arcloops.io/webhook/twenty-training-certified → trainingDelivery.updated
```
