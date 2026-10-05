# Twenty Mobile (Expo)

Starter notes for building a React Native / Expo client against our self-hosted Twenty CRM.

**Live API / app:** [https://crm.arcloops.io](https://crm.arcloops.io)

There is no first-party mobile app in upstream Twenty. This package is where our Expo app lives. It talks to the **same** `twenty-server` APIs as `twenty-front` — it does **not** need a separate backend.

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

| Environment | Base URL |
|-------------|----------|
| Production | `https://crm.arcloops.io` |
| Local server | `http://localhost:3000` (use machine LAN IP from a physical device) |

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

1. Scaffold Expo in this package (`npx create-expo-app` / Expo Router).
2. Env: `EXPO_PUBLIC_TWENTY_API_URL=https://crm.arcloops.io`
3. Login screen → SecureStore tokens → token refresh helper.
4. One Core query (e.g. companies list) on `/graphql`.
5. Then product UI (tabs, record detail, etc.).

### Sanity checks before coding screens

```bash
# Should return JSON (not the SPA HTML)
curl -sS https://crm.arcloops.io/client-config | head

# With an API key from Settings → API & Webhooks
curl -sS -X POST https://crm.arcloops.io/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ companies(first: 3) { edges { node { id name } } } }"}'
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
