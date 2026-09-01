# Phase 3 status — Branding

Done locally on 2026-08-31 against verified paths in this tree. The older
`ThemeLight.ts` / `src/assets/images/logo/` / `public/favicon.*` list is stale
and was not used.

## What was done

1. Searched `twenty-front` for title, favicon, and logo paths.
2. Created `packages/arcloops-theme/` as the branding source of truth.
3. Listed every **core** file that was actually changed in
   [`ARCLOOPS_OVERRIDES.md`](../ARCLOOPS_OVERRIDES.md).
4. Added [`scripts/apply-branding.sh`](../scripts/apply-branding.sh) (executable).
   It copies only when the destination already exists, then updates the HTML
   title. Ran once; dests that are missing were skipped.
5. Applied chrome branding: page title is **Arcloops CRM**; the one existing
   Twenty logo SVG was replaced with a simple mark placeholder.

Product tokens (not wired into twenty-ui / twenty-front CSS):

- Authority Blue `#0A66C2`
- Growth Green `#2DB012`
- Navy `#0D1117`

## Exact files

### New (Arcloops-owned)

| Path | Purpose |
|---|---|
| `packages/arcloops-theme/assets/twenty-logo.svg` | Square mark (Authority Blue + white A + green bar). |
| `packages/arcloops-theme/assets/favicon.svg` | Same mark at 32×32. Not copied — dest missing. |
| `packages/arcloops-theme/assets/arcloops-wordmark.svg` | “Arc” / “loops” wordmark for Settings upload. |
| `packages/arcloops-theme/src/arcloops-tokens.css` | CSS custom properties for the three brand colors. |
| `scripts/apply-branding.sh` | Re-apply after upstream merge. |
| `ARCLOOPS_OVERRIDES.md` | Core override inventory. |
| `docs/phase-3-status.md` | This file. |

### Core files actually changed

| Path | Change |
|---|---|
| `packages/twenty-front/index.html` | `<title>`, `og:title`, `twitter:title` → `Arcloops CRM`. |
| `packages/twenty-front/public/images/integrations/twenty-logo.svg` | Replaced with the Arcloops mark placeholder. |

### Referenced but not edited

These still point at `/images/integrations/twenty-logo.svg` and now render the
new mark without a TSX edit:

- `packages/twenty-front/src/modules/onboarding/components/OnboardingHeader.tsx`
- `packages/twenty-front/src/modules/onboarding/components/OnboardingPulsingLogo.tsx`
- `packages/twenty-front/src/modules/onboarding/components/import-contacts/OnboardingImportPreviewSyncBadge.tsx`
- `packages/twenty-front/src/modules/applications/components/AppConnectionHeader.tsx`

`PageFavicon` (`packages/twenty-front/src/modules/ui/utilities/page-favicon/components/PageFavicon.tsx`)
still uses the workspace logo when set, otherwise
`DEFAULT_WORKSPACE_LOGO` (remote Twenty PNG). That is why Settings logo upload
matters more than a missing `public/favicon.ico`.

## What still needs a human

1. **Workspace Settings logo + name** — Settings → General: set workspace name
   to `Arcloops` (or `Arcloops CRM`) and upload
   `packages/arcloops-theme/assets/arcloops-wordmark.svg` (or a real brand
   asset when design has one). This is the supported hook for sidebar / tab
   favicon; it does not require more core edits.
2. **Replace placeholder SVGs** — the mark and wordmark are geometric
   placeholders, not official brand files. Drop real SVGs into
   `packages/arcloops-theme/assets/` (keep the same filenames for the mark)
   and re-run `./scripts/apply-branding.sh`.
3. **UAT visual check** — after the workspace logo is uploaded (and after
   front is rebuilt/redeployed so `index.html` + `twenty-logo.svg` ship):
   confirm tab title, onboarding pulse logo, and sidebar workspace mark.
4. **Favicon PNG set (optional)** — `index.html` and `manifest.json` still
   reference `/images/icons/android/…` and `/images/icons/ios/…`, which are
   **not in this checkout**. Do not invent a PNG tree. If a designer exports
   icons later, add them to `public/images/icons/` first, then extend the
   script.
5. **Do not patch `twenty-ui` ThemeLight** unless product later asks to
   recolor the whole CRM. Tokens stay in `arcloops-tokens.css` until then.

Phase 3 exit from the plan: UAT shows Arcloops name/logo, and
`ARCLOOPS_OVERRIDES.md` lists every core file actually changed. Name/logo on
UAT wait on step 1 and a front deploy.
