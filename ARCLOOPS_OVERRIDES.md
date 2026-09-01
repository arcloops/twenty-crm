# Arcloops Core File Overrides

Files changed from Twenty upstream. Re-check after every `git merge upstream/main`,
then run `./scripts/apply-branding.sh`.

Paths were verified against this tree on 2026-08-31. The older deployment doc’s
`ThemeLight.ts`, `src/assets/images/logo/`, and `public/favicon.*` targets do
**not** exist here. Do not invent them.

## Branding — packages/twenty-front/

| File | Why |
|---|---|
| `index.html` | Document `<title>`, `og:title`, and `twitter:title` set to `Arcloops CRM`. Favicon `<link>` hrefs (`/images/icons/android/…`, `/images/icons/ios/192.png`) are unchanged because those files are not on disk. |
| `public/images/integrations/twenty-logo.svg` | Only Twenty logo file that exists in this checkout. Referenced by onboarding and app-connection chrome (`OnboardingHeader`, `OnboardingPulsingLogo`, `OnboardingImportPreviewSyncBadge`, `AppConnectionHeader`). Replaced with the Arcloops mark placeholder. |

## Not changed (verified missing or wrong hook)

| Path / hook | Why left alone |
|---|---|
| `packages/twenty-front/src/modules/ui/theme/constants/ThemeLight.ts` | Does not exist. Theme tokens live in `twenty-ui` (`packages/twenty-ui/src/theme/constants/ThemeLight.ts`). Patching that would recolor the whole app. |
| `packages/twenty-front/src/assets/images/logo/twenty-logo.svg` | Does not exist. |
| `packages/twenty-front/public/favicon.ico` | Does not exist. |
| `packages/twenty-front/public/favicon.svg` | Does not exist. |
| `packages/twenty-front/public/images/icons/**` | Referenced by `index.html` / `manifest.json` but absent from `public/`. |
| `DefaultWorkspaceLogo.ts` | Remote Twenty placeholder URL. In-app sidebar favicon comes from **workspace Settings logo**, not this constant. |
| TSX files that mention `/images/integrations/twenty-logo.svg` | Path is unchanged; they pick up the replaced SVG. |

## Source of truth (not core)

| File | Role |
|---|---|
| `packages/arcloops-theme/assets/twenty-logo.svg` | Square mark copied onto the verified logo path. |
| `packages/arcloops-theme/assets/favicon.svg` | Favicon placeholder. Not copied (no dest). |
| `packages/arcloops-theme/assets/arcloops-wordmark.svg` | Wordmark for a human to upload in Settings. |
| `packages/arcloops-theme/src/arcloops-tokens.css` | Authority Blue `#0A66C2`, Growth Green `#2DB012`, navy `#0D1117`. Not imported into twenty-front. |

## Script to re-apply after merge

```bash
./scripts/apply-branding.sh
```
