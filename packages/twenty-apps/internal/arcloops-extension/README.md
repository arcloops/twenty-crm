# Arcloops

Twenty application for Arcloops CRM objects and jobs. Hand-scaffolded from
[`examples/hello-world`](../../examples/hello-world) (do not run
`create-twenty-app` here — it expects Docker).

`twenty-sdk` / `twenty-client-sdk` are pinned to **2.31.0** (same as other
internal apps). If `yarn twenty` fails against this workspace, bump to the
version that matches the running server (`packages/twenty-sdk` is 2.38.0).

## Getting Started

From this directory, install the app toolchain, then authenticate to a
workspace:

```bash
yarn install

yarn twenty remote:add --api-url http://localhost:2020 --as local
```

For UAT later, add a second remote (human step — needs a workspace API key,
not committed):

```bash
yarn twenty remote:add --api-url https://<twenty-server public host> --as uat
yarn twenty remote:use uat
```

Then start development mode to sync the app and watch for changes:

```bash
yarn twenty dev
```

Open the Twenty instance and go to **Settings → Applications** to see
**Arcloops**.

## Available Commands

Run `yarn twenty help` to list all available commands. Common commands:

```bash
# Remotes & Authentication
yarn twenty remote:add --api-url http://localhost:2020 --as local
yarn twenty remote:status
yarn twenty remote:use
yarn twenty remote:list
yarn twenty remote:remove <name>

# Application
yarn twenty dev
yarn twenty dev:add
yarn twenty dev:function:logs
yarn twenty dev:function:exec
yarn twenty app:uninstall
```

Publish to a workspace registry (human — do not run against a live
workspace without an API token):

```bash
yarn twenty app:publish --private
# or: npx twenty app:publish --private
```

Then install from the registry if `dev` was not used:

```bash
yarn twenty app:install
```

## App env (Settings → Applications, or process env)

| Variable | Purpose |
|---|---|
| `CERTIFICATE_PORTAL_API_URL` | Certificate portal base URL (e.g. `https://certs.arcloops.io/api`) |
| `CERTIFICATE_PORTAL_API_KEY` | Bearer token |
| `TEAMS_BD_WEBHOOK_URL` | Teams Incoming Webhook for `#bd-pipeline` |

Missing env does **not** crash a logic function. Handlers return
`{ success: false, error: "…" }`.

## Logic functions

- **syncCertificate** — `trainingDelivery.updated` when `status` changes, plus
  `POST /sync-certificate`. POSTs to
  `${CERTIFICATE_PORTAL_API_URL}/cohorts` with
  `Authorization: Bearer ${CERTIFICATE_PORTAL_API_KEY}` only when status is
  `CERTIFIED`.
- **staleDealAlert** — cron `0 9 * * 1-5` (09:00 weekdays) and
  `POST /stale-deal-alert`. Queries **opportunities** (Twenty’s deal object)
  with no activity for 14+ days, excluding stages `WON` / `LOST` / `Won` /
  `Lost`, and posts an Adaptive Card via `src/lib/teams.ts`.

Cron **is** supported in the current SDK (`cronTriggerSettings`). The HTTP
route is there so n8n or `yarn twenty dev:function:exec` can fire the same
job without waiting for the weekday schedule.

## Pipeline stages (human, in the UI)

Not defined in this app. In the UAT workspace:

**Settings → Data model → Opportunity → Stage** (or the Opportunities
kanban settings), set stages to:

Warm Contact → Meeting Booked → Discovery → Proposal Sent → Negotiation →
Won / Lost

`staleDealAlert` treats `WON`, `LOST`, `CUSTOMER`, and those labels as
closed (Twenty default won-state is `CUSTOMER` until you rename stages).

See [`docs/workspace-setup.md`](../../../../docs/workspace-setup.md).

## Admin roles (human, in the UI)

**Settings → Roles / Members**:

- Swajan, Imdad, Saad — **admin**
- BD hires — **member**

## Company relation

`FieldType.RELATION` is supported. Training Delivery has a many-to-one
`clientCompany` field targeting the standard Company object, plus the inverse
one-to-many `trainingDeliveries` on Company.
