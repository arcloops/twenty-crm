# Arcloops CRM Mobile (Expo)

Standalone Expo (managed) client for our self-hosted CRM — password + Microsoft/Google AuthSession, CRM core, views, activities, business-card People scan, Settings, dashboards, workflows, and EAS store builds.

**Not part of the Twenty Yarn monorepo.** Own `package-lock.json` + npm; EAS uses Node 22. See [commands.md](../../commands.md).

**Live API / app:** [https://crm.arcloops.io](https://crm.arcloops.io)

**Architecture & phases:** see [ARCHITECTURE.md](./ARCHITECTURE.md) (Phases 0–8 done MVP).

```bash
cd packages/twenty-mobile
npm install
npm start
```

## Architecture (keep this mental model)

| Client | Talks to | Auth style |
|--------|----------|------------|
| `twenty-front` (web) | same host | mostly **HttpOnly session cookies** |
| `twenty-mobile` (Expo) | same host | **`Authorization: Bearer <JWT>`** |

Do **not** copy the web Apollo setup (`credentials: 'include'` only). Native clients must store and send JWTs.

```
Expo app
  ├─ POST /metadata   → auth, current user, schema/settings
  ├─ POST /graphql    → People, Companies, Opportunities, custom objects
  └─ /rest/*          → same data via REST (optional)
         │
         ▼
https://crm.arcloops.io  (twenty-server behind reverse proxy)
```

## Base URLs

| Environment | Front (origin) | API |
|-------------|----------------|-----|
| Production | `https://crm.arcloops.io` | `https://crm-api.arcloops.io` |
| Local server | `http://localhost:3001` | `http://localhost:3000` (use machine LAN IP from a physical device) |

Mobile must call the **API host** for `/auth`, `/metadata`, and `/graphql`. Pointing `EXPO_PUBLIC_TWENTY_API_URL` at the front SPA host makes Microsoft/Google login open the website 404 page.

Paths (append to base):

| Purpose | Path |
|---------|------|
| Auth + metadata GraphQL | `/metadata` |
| Core / records GraphQL | `/graphql` |
| Core REST | `/rest/` |
| Metadata REST | `/rest/metadata/` |
| Public config | `GET /client-config` |
| Interactive API docs | Settings → **API & Webhooks** (after creating a key) |

Official overview: [docs.twenty.com/developers/extend/api](https://docs.twenty.com/developers/extend/api)

## Auth (user login)

All auth GraphQL lives on **`/metadata`**, not `/graphql`.

1. `getLoginTokenFromCredentials(email, password, origin)`
2. `getAuthTokensFromLoginToken(loginToken, origin)` → access + refresh tokens
3. Store both in **Expo SecureStore**
4. Send on every request:

```http
Authorization: Bearer <accessOrWorkspaceAgnosticToken>
Content-Type: application/json
```

5. Before expiry, refresh:

```graphql
mutation Renew($appToken: String!) {
  renewToken(appToken: $appToken) {
    tokens {
      accessOrWorkspaceAgnosticToken { token expiresAt }
      refreshToken { token expiresAt }
    }
  }
}
```

Pass the **refresh** token as `$appToken`.

Use this `origin` in auth mutations (must match the workspace URL):

```ts
const ORIGIN = 'https://crm.arcloops.io';
```

Workspace is encoded in the JWT — there is **no** `x-workspace-id` header.

### Quick auth sketch

```ts
const API_BASE = process.env.EXPO_PUBLIC_TWENTY_API_URL!; // https://crm.arcloops.io
const METADATA = `${API_BASE}/metadata`;
const CORE = `${API_BASE}/graphql`;

async function gql(url: string, query: string, variables: object, token?: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}
```

### API key (prototyping only)

Settings → **API & Webhooks** → create key → `Authorization: Bearer <api_key>` on `/graphql` or `/rest`.

Fine for smoke tests. Prefer **user login tokens** for a real multi-user mobile app. OAuth: [docs.twenty.com/developers/extend/oauth](https://docs.twenty.com/developers/extend/oauth).

## Suggested first milestone

1. Scaffold **full Expo** in this package (`npx create-expo-app` / Expo Router, managed workflow).
2. Env: `EXPO_PUBLIC_TWENTY_API_URL=https://crm.arcloops.io`
3. Login screen → `expo-secure-store` tokens → token refresh helper.
4. One Core query (e.g. companies list) on `/graphql`.
5. Product UI: drawer + tabs **Home · People · Pipeline · Tasks**, header menu/Search, FAB for New/Scan.
6. Ship with **EAS Build / Submit** (Phase 8 — see below).

## Phase 8 — Admin + store release

### Admin settings (read-only)

Settings hub includes permission-gated rows:

| Screen | Gate | Manage on web |
|--------|------|----------------|
| API keys | `API_KEYS_AND_WEBHOOKS` | `/settings/mcp-apis` |
| Roles | `ROLES` | `/settings/members/roles` |
| Billing | `WORKSPACE` + billing enabled | `/settings/billing` |

Create / revoke keys and edit roles stay on web.

### EAS Build / Submit

Standalone npm app — run everything from this directory (`eas.json` uses Node **22.14.0**).

```bash
cd packages/twenty-mobile
npm run build:ios    # production → App Store / TestFlight
npm run submit:ios
```

Profiles: `development` / `preview` / `production`. Do **not** commit Apple/Google secrets.

### Env vars (store)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_TWENTY_API_URL` | API base (default `https://crm.arcloops.io`) |
| `EXPO_PUBLIC_TWENTY_ORIGIN` | Auth `origin` + web deep links |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Expo EAS project id after `eas init` |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Privacy URL in app config (default Twenty legal) |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional; enables Sentry init + Expo plugin |

### Optional Sentry

```bash
yarn workspace twenty-mobile add @sentry/react-native
# set EXPO_PUBLIC_SENTRY_DSN=… then rebuild
```

Without DSN (or without the package), init is a no-op.

### Maestro smoke

Password auth must be enabled (`/client-config` → `authProviders.password`). Record smoke needs at least one workspace object on Home.

```bash
# Install Maestro CLI: https://maestro.mobile.dev
export MAESTRO_EMAIL='you@workspace.com'
export MAESTRO_PASSWORD='…'
maestro test packages/twenty-mobile/.maestro/login.yaml
maestro test packages/twenty-mobile/.maestro/record-smoke.yaml
```

Run against a simulator/emulator with a preview or local Dev Client build.

### Web-only for store

Still web-first: data-model editor, workflow builder, dense TABLE, admin impersonation, spreadsheet import, chart builder, push until device-token API.

## Run locally on iOS

**Prereqs:** Xcode (Simulator), Node **≥ 20**, `npm install` in this folder. Env: `.env` (gitignored).

```bash
cd packages/twenty-mobile
npm start          # press `i` for Simulator, or scan QR for Expo Go
npm run ios        # one-shot Simulator
```

Sign in with workspace **email/password** against `EXPO_PUBLIC_TWENTY_API_URL` (`https://crm-api.arcloops.io`).

Branding: [`assets/README.md`](./assets/README.md). Store / TestFlight: [commands.md](../../commands.md).

### Sanity checks before coding screens

```bash
# Must be JSON from the API host (not SPA HTML)
curl -sS https://crm-api.arcloops.io/client-config | head
```

If `/graphql` or `/metadata` return HTML/404, the reverse proxy is not routing API paths — fix infra before the app.

## Monorepo notes

| Package | Use for mobile? |
|---------|-----------------|
| `twenty-server` | Source of truth for API behavior; do not call DB from the app |
| `twenty-front` | Web UI only — do not reuse Linaria / cookie Apollo as-is |
| `twenty-shared` | Safe for isomorphic utils/types (`isDefined`, etc.) |
| `twenty-client-sdk` | Optional typed REST/GraphQL helpers (`/rest`, `/core`, `/metadata`) |
| `twenty-sdk` | Extension apps inside Twenty — **not** a mobile framework |
| `twenty-ui` | Web design system — expect limited RN reuse |

Place the Expo app under `packages/twenty-mobile/`. Wire Nx later if needed; getting a working Expo + Bearer auth loop matters first.

## Local twenty-server (optional)

```bash
# from repo root — only if you need a local API
bash packages/twenty-utils/setup-dev-env.sh
yarn start   # front + server + worker
```

Point Expo at `http://<your-lan-ip>:3000` from a device. Simulator can often use `localhost`.

## Do / don't

**Do**

- Use Bearer access + refresh JWTs in SecureStore
- Hit `/metadata` for auth, `/graphql` for records
- Pass `origin: 'https://crm.arcloops.io'` on auth mutations
- Read workspace-specific schema from Settings → API & Webhooks playground

**Don't**

- Rely on cookies or `credentials: 'include'` for native fetch
- Send session-cookie tokens as Bearer (server rejects that)
- Assume a static OpenAPI for all tenants — schema is **per workspace**
- Put secrets or API keys in the Expo bundle for production user auth

## References in this repo

- API path constants: `packages/twenty-shared/src/types/ApiPath.ts`
- Auth resolver (mutations): `packages/twenty-server/src/engine/core-modules/auth/auth.resolver.ts`
- Web auth flow (for comparison): `packages/twenty-front/src/modules/auth/hooks/useAuth.ts`
- REST client pattern (Bearer): `packages/twenty-client-sdk/src/rest/index.ts`
- Docs source: `packages/twenty-docs/developers/extend/api.mdx`
