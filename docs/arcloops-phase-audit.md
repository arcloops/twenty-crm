# Arcloops phases 3–9 — audit (2026-08-31)

Repo templates and scaffolding for Phases 3–9 are in place. Nothing below
is a live Railway / Google / Teams / n8n deploy. Those stay human.

Command plan: [`arcloops-phased-deployment-plan.md`](./arcloops-phased-deployment-plan.md).
Workspace clicks: [`workspace-setup.md`](./workspace-setup.md).

## What each agent shipped

| Phase | Agent | In repo |
|---|---|---|
| 3 | [Phase 3 branding](065dd9c4-188c-4984-831b-9c540c96bdbd) | Theme package, title, logo SVG, `apply-branding.sh`, `ARCLOOPS_OVERRIDES.md` |
| 4 | [Phase 4 CI/CD](a5d14aa1-c88b-4ba3-af83-3eeadf904b2b) | `arcloops-ci.yaml`, `arcloops-deploy.yaml` (Twenty workflows untouched) |
| 5 | [Phase 5 auth email storage](d04e758a-34ce-4c04-9824-66751fd785d7) | `uat-integrations.env.example`, `PHASE-5-RUNBOOK.md` |
| 6 | [Phase 6 SDK extension](5808c237-833c-45a9-953d-ff35cd4fcd1c) | `packages/twenty-apps/internal/arcloops-extension` |
| 7 | [Phase 7 n8n Teams](3c59e4e9-f3ef-40a9-bb2d-2b7d298cd501) | `deploy/n8n/` + six workflows |
| 8 | [Phase 8 production templates](1f7453bb-7c10-4fef-af04-1e499702e1d2) | `production.env.example`, Railway Production section |
| 9 | [Phase 9 upstream sync](28bdc2bd-f04f-4dab-96b6-aec10257432e) | `scripts/upstream-sync.sh`, `docs/upstream-sync.md` |

## Gaps closed in this audit

| Gap | Fix |
|---|---|
| Railway healthcheck `PORT` vs Twenty `NODE_PORT` (default 3000) | Server start `NODE_PORT=${PORT:-3000} …`; front serve `-l ${PORT:-3001}` |
| Production env missing Phase 5 keys | Commented OAuth / SMTP / R2 block on `production.env.example` |
| SDK pin 2.13.0 vs this tree (sdk 2.38 / sibling apps 2.31) | `twenty-sdk` / `twenty-client-sdk` **2.31.0** |
| `staleDealAlert` ignored Twenty default won-state `CUSTOMER` | `src/constants/opportunity-stages.ts` |
| No Training Delivery record page | Fields widget view + Home/Timeline layout |
| n8n Tally/Stripe hard-coded `WARM_CONTACT` / `WON` before Settings rename | `TWENTY_INBOUND_STAGE` / `TWENTY_WON_STAGE` |
| No single Settings runbook for stages + admins | [`workspace-setup.md`](./workspace-setup.md) |
| `apply-branding.sh` would copy SVG onto `.ico` if that dest appeared | ico copy removed |
| CI `git fetch origin main:main` can refuse a non-ff update | `+refs/heads/main:refs/heads/main` |

## Still human (cannot finish from this repo)

| Phase | Remaining |
|---|---|
| 0–2 | Persist Node 24 PATH; Railway **uat** services + `crm-staging.arcloops.io`; dedicated local DB (laptop `.env` still uses UAT public URLs) |
| 3 | Settings workspace name/logo; official brand SVGs; UAT visual check |
| 4 | Push workflows; `RAILWAY_TOKEN` + `RAILWAY_PROJECT_ID`; protect `main` (require `arcloops-ci` only) |
| 5 | Google/Azure apps, Brevo, R2 — paste into Railway uat |
| 6 | `yarn twenty` publish/install; prove one logic function |
| 7 | Teams Incoming Webhooks; Railway n8n + DB `n8n`; import workflows; register Twenty webhooks |
| 8 | New prod env, DBs, secrets, `crm.arcloops.io`, `database:init:prod` |
| 9 | Calendar reminder; first `upstream-sync-*` merge when you choose |

## Do not treat as done

- UAT or prod URL is live
- Google login / email / R2
- Training Delivery installed on a workspace
- A Teams card from a real webhook
- `upstream/main` merged
