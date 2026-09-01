# Twenty CRM — Arcloops Deployment Guide
> Updated August 2026 · Stack: Railway (Nixpacks, no Docker) · GitHub · n8n · MS Teams

---

## Do You Need Docker?

**Short answer: No.**

| Component | Docker needed? | What to use instead |
|---|---|---|
| PostgreSQL | No | Railway managed PostgreSQL (direct URL) |
| Redis | No | Railway managed Redis (direct URL) |
| App (server/worker/front) | No | Railway Nixpacks — builds Node.js from source |
| Local dev databases | No | Neon (free cloud PostgreSQL) + Upstash (free cloud Redis) |
| n8n | No | Railway Nixpacks or n8n Cloud free tier |

Railway Nixpacks detects your Node.js/pnpm monorepo and builds it automatically — no
Dockerfile required. The managed database services give you direct connection strings.
You never touch Docker at all.

---

## Architecture

```
GitHub (arcloops/twenty-crm — forked from twentyhq/twenty)
│
│  Two remotes:
│  origin   → git@github.com:arcloops/twenty-crm.git   (your fork)
│  upstream → https://github.com/twentyhq/twenty.git   (Twenty's main repo)
│
├── feature/* ──→ Railway PR preview (auto URL per PR)
├── staging   ──→ crm-staging.arcloops.io (Railway staging env)
└── main      ──→ crm.arcloops.io (Railway production)
                        │
              Railway Project: arcloops-crm (Nixpacks — no Docker)
              ├── twenty-server   NestJS API · port 3000
              ├── twenty-worker   Background jobs
              ├── twenty-front    React SPA · port 3001
              ├── postgres        Railway managed (direct URL)
              ├── redis           Railway managed (direct URL)
              └── n8n             Nixpacks · n8n.arcloops.io

Integration layer (MS Teams instead of Slack):
    Twenty webhooks → n8n → Brevo / Twilio / Stripe / MS Teams / Cal.com
    External webhooks → n8n → Twenty REST/GraphQL API
```

---

## Part 1 — The Git Strategy

This is the most important section. Three things happen simultaneously on your fork:
your own changes, Arcloops branding, and ongoing updates from Twenty's main repo.
Here is exactly how they coexist without conflict.

### 1.1 The golden rule

**Never modify core packages directly.**

```
packages/twenty-server/   ← NEVER touch core files here
packages/twenty-front/    ← NEVER touch core files here (branding: see Part 7)
packages/twenty-sdk/      ← NEVER touch

packages/arcloops-extension/   ← YOUR custom SDK objects and functions
packages/arcloops-theme/       ← YOUR branding overrides (CSS, assets)
ARCLOOPS_OVERRIDES.md          ← Track every file you've changed in core
```

If your custom code only lives in `packages/arcloops-*` directories, upstream merges
are nearly always conflict-free. The only files you touch in core are a handful of
CSS/asset files for branding (tracked in `ARCLOOPS_OVERRIDES.md`).

### 1.2 Initial fork setup

```bash
# 1. Fork twentyhq/twenty on GitHub → arcloops/twenty-crm
# 2. Clone your fork
git clone git@github.com:arcloops/twenty-crm.git
cd twenty-crm

# 3. Add Twenty's main repo as upstream remote
git remote add upstream https://github.com/twentyhq/twenty.git

# Verify both remotes
git remote -v
# origin    git@github.com:arcloops/twenty-crm.git (fetch)
# origin    git@github.com:arcloops/twenty-crm.git (push)
# upstream  https://github.com/twentyhq/twenty.git (fetch)
# upstream  https://github.com/twentyhq/twenty.git (push)
```

### 1.3 Ongoing upstream sync (run monthly)

```bash
# Pull all new commits from Twenty's main repo
git fetch upstream

# See what changed before merging
git log HEAD..upstream/main --oneline

# Merge upstream into your main branch
git checkout main
git merge upstream/main

# Resolve any conflicts (rare if you follow the golden rule)
# Then push to your fork
git push origin main
```

Set a recurring monthly calendar reminder for this. Doing it monthly keeps merges
small and manageable. Skipping 6 months means painful diffs.

### 1.4 Branching strategy

```
main         → production  (crm.arcloops.io)      — auto-deploy via CI
staging      → staging     (crm-staging.arcloops.io)
feature/*    → PR preview  (auto Railway URL)
upstream-sync → temporary branch for upstream merge review
```

**Workflow for your own changes:**
```bash
git checkout -b feature/training-delivery-object
# make changes in packages/arcloops-extension/
git push origin feature/training-delivery-object
# open PR into staging → review → merge staging → merge to main
```

**Workflow for upstream sync:**
```bash
git checkout -b upstream-sync
git fetch upstream
git merge upstream/main
# resolve conflicts if any (see ARCLOOPS_OVERRIDES.md for branding files to re-check)
git push origin upstream-sync
# open PR for team to review what changed upstream → merge to main
```

---

## Part 2 — Local Dev Setup (No Docker)

### 2.1 Prerequisites

```bash
node --version    # must be 20+
pnpm --version    # must be 9+
# No Docker. No local database. Use cloud databases.
```

### 2.2 Cloud databases for local dev (free, no Docker)

**PostgreSQL — Neon (free tier):**
1. Go to neon.tech → create account → new project → name: `arcloops-crm-dev`
2. Copy the connection string:
   `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/twenty?sslmode=require`

**Redis — Upstash (free tier):**
1. Go to upstash.com → create account → new database → name: `arcloops-crm-dev`
2. Copy the Redis URL:
   `rediss://default:password@global-xxx.upstash.io:6379`

Note: `rediss://` (double s) = TLS-encrypted. Required for Upstash.

### 2.3 Install dependencies

```bash
git clone git@github.com:arcloops/twenty-crm.git
cd twenty-crm
pnpm install
```

### 2.4 Configure local environment

```bash
cp packages/twenty-server/.env.example packages/twenty-server/.env
cp packages/twenty-front/.env.example  packages/twenty-front/.env
```

Edit `packages/twenty-server/.env`:
```env
# Databases — cloud URLs, no local Docker
PG_DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/twenty?sslmode=require
REDIS_URL=rediss://default:password@global-xxx.upstash.io:6379

# App
APP_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
FRONT_BASE_URL=http://localhost:3001
NODE_ENV=development
STORAGE_TYPE=local
LOG_LEVEL=debug
```

Edit `packages/twenty-front/.env`:
```env
VITE_SERVER_BASE_URL=http://localhost:3000
```

### 2.5 Run database migrations

```bash
cd packages/twenty-server
pnpm run database:reset
cd ../..
```

### 2.6 Start the dev server

```bash
pnpm run dev
# twenty-front:  http://localhost:3001
# twenty-server: http://localhost:3000
# GraphQL:       http://localhost:3000/api/graphql
```

No Docker. No local database processes. The app connects directly to Neon and
Upstash over the network exactly as it does in production.

---

## Part 3 — Railway Deployment (No Docker — Nixpacks)

### 3.1 Install Railway CLI and create project

```bash
npm install -g @railway/cli
railway login
railway init      # project name: arcloops-crm
```

### 3.2 Add managed database services

In the Railway dashboard:
- New → Database → **PostgreSQL** → Railway provisions it, gives you `DATABASE_URL`
- New → Database → **Redis** → Railway provisions it, gives you `REDIS_URL`

These are direct connection strings — no Docker containers managed by you.

### 3.3 Configure Nixpacks — `railway.toml`

Create this in the repo root. No Dockerfile needed.

```toml
[build]
builder = "NIXPACKS"

[[services]]
name = "twenty-server"
rootDirectory = "."
buildCommand = "pnpm install --frozen-lockfile && pnpm --filter twenty-server build"
startCommand = "node packages/twenty-server/dist/src/main.js"
healthcheckPath = "/health"
healthcheckTimeout = 60

[[services]]
name = "twenty-worker"
rootDirectory = "."
buildCommand = "pnpm install --frozen-lockfile && pnpm --filter twenty-server build"
startCommand = "node packages/twenty-server/dist/src/queue-worker/queue-worker.js"

[[services]]
name = "twenty-front"
rootDirectory = "."
buildCommand = "pnpm install --frozen-lockfile && pnpm --filter twenty-front build"
startCommand = "npx serve@latest packages/twenty-front/dist -s -l 3001"

[[services]]
name = "n8n"
rootDirectory = "."
buildCommand = "npm install -g n8n"
startCommand = "n8n start"
```

### 3.4 Custom domains

In Railway dashboard, per service → Settings → Domain:

```
twenty-front   → crm.arcloops.io
n8n            → n8n.arcloops.io
```

Add CNAME records at your DNS provider:
```
crm.arcloops.io  CNAME  <project>.up.railway.app
n8n.arcloops.io  CNAME  <project>.up.railway.app
```

### 3.5 Enable PR preview environments

Railway dashboard → Project Settings → Preview Environments → Enable.
Every pull request gets an auto-generated URL. Deleted when the PR closes.

---

## Part 4 — Environment Variables (Full Reference)

Set in Railway → Project → **Shared Variables** so all services inherit them.
Override per-service where noted. Railway lets you reference other services using
`${{ServiceName.VARIABLE}}`.

### Core
```env
APP_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
FRONT_BASE_URL=https://crm.arcloops.io
NODE_ENV=production
LOG_LEVEL=info
```

### Databases
```env
PG_DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Google OAuth — Sign-in + Gmail sync
Create two separate OAuth apps in Google Cloud Console (different scopes).

```env
# Sign-in app
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
AUTH_GOOGLE_CALLBACK_URL=https://crm.arcloops.io/auth/google/callback

# Gmail two-way sync app (separate OAuth app, Gmail scopes)
GMAIL_CONNECTED_ACCOUNT_CLIENT_ID=
GMAIL_CONNECTED_ACCOUNT_CLIENT_SECRET=
```

### Microsoft 365 OAuth (for Outlook sync + Teams)
```env
# Azure AD app registration — scopes: Mail.Read, Mail.Send, Calendars.Read
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT_ID=
MS_CALLBACK_URL=https://crm.arcloops.io/auth/microsoft/callback

# MS Teams — Incoming Webhook URLs per channel (no bot token needed)
TEAMS_BD_WEBHOOK_URL=<from Teams channel → Connectors → Incoming Webhook>
TEAMS_ENGINEERING_WEBHOOK_URL=
TEAMS_GENERAL_WEBHOOK_URL=
```

### Transactional email (Brevo — 300/day free)
```env
EMAIL_DRIVER=smtp
EMAIL_FROM_ADDRESS=hello@arcloops.io
EMAIL_FROM_NAME=Arcloops CRM
EMAIL_SYSTEM_ADDRESS=system@arcloops.io
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<brevo login>
SMTP_PASSWORD=<brevo SMTP key>
```

### File storage — Cloudflare R2 (cheapest S3-compatible)
```env
STORAGE_TYPE=s3
STORAGE_S3_REGION=auto
STORAGE_S3_NAME=arcloops-crm
STORAGE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=<R2 access key>
AWS_SECRET_ACCESS_KEY=<R2 secret key>
```

### AI — Anthropic (MCP + SDK agents)
```env
ANTHROPIC_API_KEY=
LLM_CHAT_MODEL_DRIVER=anthropic
LLM_CHAT_MODEL=claude-sonnet-4-6
```

### Message queue
```env
MESSAGE_QUEUE_TYPE=bull-mq
# Uses REDIS_URL above — no extra config needed
```

### n8n service (set on n8n service only — not shared)
```env
N8N_HOST=n8n.arcloops.io
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
WEBHOOK_URL=https://n8n.arcloops.io/
N8N_SECURE_COOKIE=true

# n8n uses same Postgres instance, separate database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}
DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# Twenty CRM API access (for n8n to call back into CRM)
TWENTY_CRM_API_URL=https://crm.arcloops.io
TWENTY_CRM_API_KEY=<generate in Twenty: Settings → API → New token>
```

### Arcloops custom integration keys
```env
# Email campaigns
BREVO_API_KEY=

# SMS / WhatsApp Business
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+880...

# Payments
STRIPE_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=

# Meeting scheduler
CAL_COM_API_KEY=

# Certificate portal
CERTIFICATE_PORTAL_API_URL=https://certs.arcloops.io/api
CERTIFICATE_PORTAL_API_KEY=

# Client-specific secrets
KRAYONS_WEBHOOK_SECRET=
PDS_WEBHOOK_SECRET=
```

---

## Part 5 — CI/CD via GitHub Actions

### 5.1 Store in GitHub Secrets

GitHub → repo → Settings → Secrets → Actions:
```
RAILWAY_TOKEN    (Railway dashboard → Account → Tokens → New token)
```

### 5.2 Workflow — `.github/workflows/deploy.yml`

```yaml
name: CI/CD → Railway

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  test:
    name: Build & test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm lint
      - run: pnpm build

  deploy:
    name: Deploy → Railway
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - run: npm install -g @railway/cli

      - name: Deploy server
        run: railway up --service twenty-server --detach

      - name: Deploy worker
        run: railway up --service twenty-worker --detach

      - name: Deploy front
        run: railway up --service twenty-front --detach
```

---

## Part 6 — Upstream Sync in Practice

### 6.1 Monthly sync routine (30 minutes)

```bash
# Step 1: Fetch all new commits from Twenty's main repo
git fetch upstream

# Step 2: See what changed (review before merging)
git log HEAD..upstream/main --oneline
git diff HEAD..upstream/main --stat

# Step 3: Create a sync branch (don't merge directly to main)
git checkout -b upstream-sync-aug-2026

# Step 4: Merge
git merge upstream/main

# Step 5: Check branding files (these are the only files you've changed in core)
# See ARCLOOPS_OVERRIDES.md for the full list
# Re-apply overrides if upstream changed them
./scripts/apply-branding.sh

# Step 6: Verify locally
pnpm run dev
# test in browser: http://localhost:3001

# Step 7: Push and open PR for team review
git push origin upstream-sync-aug-2026
# Open PR: upstream-sync-aug-2026 → staging → review → merge → main
```

### 6.2 ARCLOOPS_OVERRIDES.md (create this file in repo root)

Track every file you've changed in core packages so after each upstream merge you
know exactly what to verify:

```markdown
# Arcloops Core File Overrides

Files changed from Twenty upstream. Check these after every upstream merge.

## Branding — packages/twenty-front/src/

| File | Change |
|---|---|
| `modules/ui/theme/constants/ThemeLight.ts` | Authority Blue + Growth Green color tokens |
| `assets/images/logo/twenty-logo.svg` | Replaced with Arcloops logo SVG |
| `assets/images/logo/twenty-logo-dark.svg` | Replaced with Arcloops logo (dark mode) |
| `index.html` | Title changed to "Arcloops CRM" |
| `public/favicon.ico` | Replaced with Arcloops favicon |
| `public/favicon.svg` | Replaced with Arcloops favicon SVG |

## Script to re-apply after merge
Run: ./scripts/apply-branding.sh
```

### 6.3 `scripts/apply-branding.sh` (create this file)

```bash
#!/bin/bash
# Re-apply Arcloops branding overrides after upstream merge
# Run this after every: git merge upstream/main

set -e

echo "Applying Arcloops branding overrides..."

# Copy logo files
cp packages/arcloops-theme/assets/twenty-logo.svg \
   packages/twenty-front/src/assets/images/logo/twenty-logo.svg

cp packages/arcloops-theme/assets/twenty-logo-dark.svg \
   packages/twenty-front/src/assets/images/logo/twenty-logo-dark.svg

cp packages/arcloops-theme/assets/favicon.ico \
   packages/twenty-front/public/favicon.ico

cp packages/arcloops-theme/assets/favicon.svg \
   packages/twenty-front/public/favicon.svg

# Apply theme patch (CSS token overrides)
cp packages/arcloops-theme/src/ThemeLight.patch.ts \
   packages/twenty-front/src/modules/ui/theme/constants/ThemeLight.ts

echo "✓ Branding overrides applied."
echo "Run: pnpm run dev — and verify logo + colours in browser."
```

Make it executable: `chmod +x scripts/apply-branding.sh`

---

## Part 7 — Arcloops Branding & Theme

All branding assets live in `packages/arcloops-theme/` — never scattered across core.
After any upstream merge, run `./scripts/apply-branding.sh` to re-apply.

### 7.1 Create the theme package

```bash
mkdir -p packages/arcloops-theme/src
mkdir -p packages/arcloops-theme/assets
```

### 7.2 Color token override

Create `packages/arcloops-theme/src/ThemeLight.patch.ts`:
This replaces Twenty's default blue with Arcloops Authority Blue and Growth Green.

```typescript
// packages/arcloops-theme/src/ThemeLight.patch.ts
// Drop this file into packages/twenty-front/src/modules/ui/theme/constants/
// Run: cp packages/arcloops-theme/src/ThemeLight.patch.ts \
//          packages/twenty-front/src/modules/ui/theme/constants/ThemeLight.ts

export const ARCLOOPS_THEME_LIGHT = {
  // Primary — Authority Blue
  color: {
    blue: {
      10: '#EBF4FB',   // --color-blue-tint
      20: '#C7DFF4',
      30: '#9EC8EC',
      40: '#75B1E4',
      50: '#4C9ADC',
      60: '#0A66C2',   // --color-blue (primary)
      70: '#0856A3',   // --color-blue-hover
      80: '#074585',
      90: '#053467',
      100: '#032249',
    },
    // Secondary — Growth Green
    green: {
      10: '#EEF9EB',   // --color-green-tint
      20: '#C7EEC0',
      30: '#9EE193',
      40: '#75D466',
      50: '#4CC739',
      60: '#2DB012',   // --color-green (primary)
      70: '#258E0E',
      80: '#1D6C0B',
      90: '#154A07',
      100: '#0D2804',
    },
  },
  // Override Twenty's default purple/violet accent with Authority Blue
  grayScale: {
    gray0:   '#FFFFFF',
    gray5:   '#F8FAFF',   // --color-site-gray
    gray10:  '#F0F4FB',
    gray15:  '#E2E8F0',   // --color-border
    gray20:  '#CBD5E1',
    gray25:  '#94A3B8',
    gray30:  '#64748B',   // --color-muted
    gray40:  '#475569',
    gray50:  '#334155',   // --color-body
    gray60:  '#1E293B',
    gray70:  '#0F172A',
    gray75:  '#0D1117',   // --color-navy
    gray80:  '#090D12',
    gray85:  '#060A0E',
    gray90:  '#040709',
    gray100: '#000000',
  },
};
```

### 7.3 Global CSS override

Create `packages/arcloops-theme/src/arcloops-overrides.css`:

```css
/* Arcloops brand overrides — imported in twenty-front after Twenty's default CSS */
:root {
  /* Authority Blue */
  --color-blue:      #0A66C2;
  --color-blue-hover: #0856A3;
  --color-blue-tint: #EBF4FB;

  /* Growth Green */
  --color-green:      #2DB012;
  --color-green-tint: #EEF9EB;

  /* Structure */
  --color-navy:      #0D1117;
  --color-indigo:    #0A2E52;
  --color-near-black: #0D0D0D;
  --color-site-gray: #F8FAFF;

  /* App chrome */
  --font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Sidebar logo area */
.arcloops-wordmark-arc { color: #0A66C2; }
.arcloops-wordmark-loops { color: #2DB012; }
```

Import in `packages/twenty-front/src/index.css` (add one line after existing imports):
```css
@import './modules/arcloops/arcloops-overrides.css';
```

Copy the file: `cp packages/arcloops-theme/src/arcloops-overrides.css packages/twenty-front/src/modules/arcloops/arcloops-overrides.css`

### 7.4 Logo replacement

Place your Arcloops logo SVGs in `packages/arcloops-theme/assets/`:
- `twenty-logo.svg` — light mode logo (Arcloops full wordmark)
- `twenty-logo-dark.svg` — dark mode version

The `apply-branding.sh` script copies these into place.

### 7.5 Page title

In `packages/twenty-front/index.html`, change:
```html
<!-- Before -->
<title>Twenty</title>

<!-- After -->
<title>Arcloops CRM</title>
```

Track this in `ARCLOOPS_OVERRIDES.md`. Re-check after each upstream merge.

---

## Part 8 — MS Teams Integration

Teams uses Incoming Webhooks — the same pattern as Slack but without a bot token.
Setup is per-channel in Teams, no Azure app registration needed for basic webhooks.

### 8.1 Create an Incoming Webhook in Teams

1. Open MS Teams → go to the channel (e.g. #bd-pipeline)
2. Channel name → three dots → Connectors
3. Find "Incoming Webhook" → Configure
4. Name: `Arcloops CRM` → upload the Arcloops logo
5. Copy the webhook URL → save as `TEAMS_BD_WEBHOOK_URL` in Railway env vars

Repeat for each channel: `#bd-pipeline`, `#engineering`, `#general`.

### 8.2 Teams notification via n8n

In n8n — create a workflow:

**Trigger:** Twenty webhook (deal.updated)
**Condition:** stage changed to "Proposal Sent"
**Action:** HTTP Request node

```
Method: POST
URL: {{ $env.TEAMS_BD_WEBHOOK_URL }}
Body (JSON):
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [
          {
            "type": "TextBlock",
            "text": "🎯 Proposal Sent",
            "weight": "Bolder",
            "size": "Medium",
            "color": "Accent"
          },
          {
            "type": "FactSet",
            "facts": [
              { "title": "Deal", "value": "{{ $json.name }}" },
              { "title": "Company", "value": "{{ $json.company.name }}" },
              { "title": "Value", "value": "{{ $json.amount }}" }
            ]
          }
        ]
      }
    }
  ]
}
```

### 8.3 Teams notification via SDK serverless function

Use this instead of (or alongside) n8n when the notification is triggered by
an Arcloops SDK event (e.g. training certified, stale deal):

```typescript
// Shared helper — packages/arcloops-extension/src/lib/teams.ts

export async function postToTeams(webhookUrl: string, title: string, facts: Record<string, string>) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium' },
            {
              type: 'FactSet',
              facts: Object.entries(facts).map(([title, value]) => ({ title, value })),
            },
          ],
        },
      }],
    }),
  });
}
```

Usage in stale deal cron:
```typescript
import { postToTeams } from '../lib/teams';

// Replace the Slack fetch call with:
await postToTeams(
  env.TEAMS_BD_WEBHOOK_URL,
  '⚠️ Stale Deals — No activity 14d+',
  Object.fromEntries(staleDeals.map(d => [d.company.name, `${d.name} — ${d.stage}`]))
);
```

### 8.4 Environment variable summary (Teams replaces Slack entirely)

```env
# REMOVE these (no Slack)
# SLACK_BOT_TOKEN=
# SLACK_BD_CHANNEL_ID=

# ADD these (Teams incoming webhooks — one per channel)
TEAMS_BD_WEBHOOK_URL=https://xxx.webhook.office.com/webhookb2/...
TEAMS_ENGINEERING_WEBHOOK_URL=https://xxx.webhook.office.com/webhookb2/...
TEAMS_GENERAL_WEBHOOK_URL=https://xxx.webhook.office.com/webhookb2/...
```

---

## Part 9 — SDK Customization (Arcloops Objects)

### 9.1 Scaffold your extension

```bash
cd packages
npx create-twenty-app arcloops-extension
cd arcloops-extension
pnpm install
```

### 9.2 Training Delivery object

`src/objects/training-delivery.ts`:
```typescript
import { defineObject, FieldType } from 'twenty-sdk/define';

export default defineObject({
  nameSingular: 'trainingDelivery',
  namePlural: 'trainingDeliveries',
  labelSingular: 'Training Delivery',
  labelPlural: 'Training Deliveries',
  icon: 'IconSchool',
  fields: [
    { name: 'title',            label: 'Programme',    type: FieldType.TEXT },
    { name: 'deliveryDate',     label: 'Date',         type: FieldType.DATE_TIME },
    { name: 'participantCount', label: 'Participants',  type: FieldType.NUMBER },
    { name: 'cohortId',         label: 'Cohort ID',    type: FieldType.TEXT },
    { name: 'facilitator',      label: 'Facilitator',  type: FieldType.TEXT },
    {
      name: 'status', label: 'Status', type: FieldType.SELECT,
      options: ['Planned', 'In Progress', 'Completed', 'Certified'],
      defaultValue: 'Planned',
    },
    {
      name: 'clientCompany', label: 'Client',
      type: FieldType.RELATION, relationObjectNameSingular: 'company',
    },
  ],
});
```

### 9.3 Certificate portal sync

`src/functions/sync-certificate.ts`:
```typescript
import { defineFunction } from 'twenty-sdk/functions';

export default defineFunction({
  name: 'syncCertificate',
  trigger: 'RECORD_UPDATE',
  objectNameSingular: 'trainingDelivery',
  condition: (record) => record.status === 'Certified',
  handler: async ({ record, env }) => {
    await fetch(`${env.CERTIFICATE_PORTAL_API_URL}/cohorts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.CERTIFICATE_PORTAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cohortId:         record.cohortId,
        programmeTitle:   record.title,
        deliveryDate:     record.deliveryDate,
        participantCount: record.participantCount,
        clientName:       record.clientCompany?.name,
      }),
    });
  },
});
```

### 9.4 Stale deal cron with Teams notification

`src/functions/stale-deal-alert.ts`:
```typescript
import { defineFunction } from 'twenty-sdk/functions';
import { postToTeams } from '../lib/teams';

export default defineFunction({
  name: 'staleDealAlert',
  trigger: 'CRON',
  schedule: '0 9 * * 1-5',   // 9am weekdays
  handler: async ({ client, env }) => {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const stale = await client.query(
      `SELECT id, name, stage, updatedAt, company { name } FROM deals
       WHERE updatedAt < $1 AND stage NOT IN ('Won','Lost')`,
      [cutoff]
    );
    if (!stale.length) return;
    await postToTeams(
      env.TEAMS_BD_WEBHOOK_URL,
      `⚠️ ${stale.length} stale deal(s) — no activity 14d+`,
      Object.fromEntries(stale.map(d => [`${d.company.name}`, `${d.name} · ${d.stage}`]))
    );
  },
});
```

### 9.5 Deploy extension

```bash
npx twenty-sdk deploy \
  --workspace https://crm.arcloops.io \
  --token $TWENTY_API_TOKEN
```

---

## Part 10 — Integration via n8n (MS Teams edition)

All external integrations route through n8n. Twenty fires webhooks → n8n handles logic.

### Configure Twenty webhooks

Settings → Webhooks → Add:
```
https://n8n.arcloops.io/webhook/twenty-contact-created
https://n8n.arcloops.io/webhook/twenty-deal-updated
https://n8n.arcloops.io/webhook/twenty-training-certified
```

### Core flows

**New contact → Brevo list sync**
```
Trigger: Twenty webhook (contact.created)
→ Brevo API: add to CRM Contacts list
```

**Deal to Proposal Sent → Teams BD channel**
```
Trigger: Twenty webhook (deal.updated, stage=Proposal Sent)
→ HTTP POST to $TEAMS_BD_WEBHOOK_URL (Adaptive Card)
```

**Deal won → Teams notification + update record**
```
Trigger: Stripe webhook (payment_intent.succeeded)
→ Twenty GraphQL: update deal stage to Won
→ HTTP POST to $TEAMS_BD_WEBHOOK_URL
```

**Cal.com booking → Twenty activity**
```
Trigger: Cal.com webhook (booking.created)
→ Match email to Twenty contact via GraphQL
→ Create Activity on matched company
```

**Training Certified → Certificate portal**
```
Trigger: Twenty webhook (trainingDelivery.updated, status=Certified)
→ Certificate Portal API: POST /cohorts
→ Twenty REST: add note with cohort ID
```

**Tally form → new contact**
```
Trigger: Tally webhook (submission)
→ Transform fields → Twenty REST: POST /contacts
→ Assign to pipeline, stage: Warm Contact
```

---

## Go-Live Checklist

### Infrastructure
- [ ] Fork `twentyhq/twenty` → `arcloops/twenty-crm` on GitHub
- [ ] `git remote add upstream https://github.com/twentyhq/twenty.git` — verified
- [ ] Railway project created; Postgres + Redis managed services added
- [ ] `railway.toml` committed to repo root (Nixpacks, no Docker)
- [ ] CNAME `crm.arcloops.io` → Railway twenty-front service
- [ ] CNAME `n8n.arcloops.io` → Railway n8n service
- [ ] Neon PostgreSQL + Upstash Redis set up for local dev

### Auth & Email
- [ ] Google OAuth app (Sign-in) configured
- [ ] Gmail sync OAuth app (separate, Gmail scopes) configured
- [ ] Brevo SMTP credentials set and verified
- [ ] Cloudflare R2 bucket created; access key generated

### Branding
- [ ] `packages/arcloops-theme/` directory created with all assets
- [ ] `scripts/apply-branding.sh` committed and marked executable
- [ ] `ARCLOOPS_OVERRIDES.md` created and lists all changed core files
- [ ] `apply-branding.sh` run and verified: logo, colours, page title correct
- [ ] Arcloops favicon in `packages/twenty-front/public/`

### MS Teams
- [ ] Incoming Webhook created in #bd-pipeline Teams channel
- [ ] Incoming Webhook created in #engineering channel
- [ ] `TEAMS_BD_WEBHOOK_URL` etc. set in Railway env vars
- [ ] Test notification sent and received in Teams

### CI/CD
- [ ] `RAILWAY_TOKEN` stored in GitHub Secrets
- [ ] `.github/workflows/deploy.yml` committed
- [ ] Branch protection on `main` — PRs required, tests must pass
- [ ] First CI run green, all three services deployed

### SDK Extension
- [ ] `packages/arcloops-extension/` scaffolded and committed
- [ ] `TrainingDelivery` object deployed to workspace
- [ ] `syncCertificate` serverless function live
- [ ] `staleDealAlert` cron live and sending to Teams
- [ ] `postToTeams` helper in `packages/arcloops-extension/src/lib/teams.ts`

### Pipeline & Team
- [ ] Deal stages: Warm Contact → Meeting Booked → Discovery → Proposal Sent → Negotiation → Won / Lost
- [ ] Swajan — admin
- [ ] Imdad — admin
- [ ] Saad — admin (BD Coaching Panel visible)
- [ ] BD hires — member role

### Ongoing maintenance
- [ ] Monthly calendar reminder set: upstream sync + merge
- [ ] `ARCLOOPS_OVERRIDES.md` reviewed after every upstream merge
- [ ] `apply-branding.sh` run after every upstream merge