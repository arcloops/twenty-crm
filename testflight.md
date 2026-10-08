# Arcloops CRM — iOS TestFlight → App Store

End-to-end guide for shipping `packages/twenty-mobile` to Apple.


| Item                      | Value                                                             |
| ------------------------- | ----------------------------------------------------------------- |
| App name (ASC)            | ARCLooops CRM                                                     |
| Bundle ID                 | `io.arcloops.crm`                                                 |
| ASC Apple ID              | `6820139033`                                                      |
| SKU                       | `arcloops-crm-ios`                                                |
| ASC version page          | **1.0** Prepare for Submission                                    |
| Version in `app.config.ts`| **`1.0.0`** (matches ASC 1.0)                                     |
| Build number              | Auto-incremented by EAS (`production.autoIncrement`)              |
| Packaging                 | **Standalone npm app** (not a Yarn workspace; Node **22** on EAS) |
| API                       | `https://crm-api.arcloops.io`                                     |
| Origin (auth / web links) | `https://crm.arcloops.io`                                         |
| URL scheme                | `twenty`                                                          |
| EAS profile for store     | `production` (not `preview`)                                      |
| Expo project              | https://expo.dev/accounts/swajan.automates/projects/twenty-mobile |


---

## Run on iOS locally (before TestFlight)

```bash
cd packages/twenty-mobile
npm install
npm start          # press `i` for Simulator, or scan QR for device
```

See `commands.md` for device / tunnel / EAS.

---

## Overview (do in this order)

1. [Apple Developer — register Bundle ID](#1-register-the-bundle-id)
2. [App Store Connect — create the app](#2-create-the-app-in-app-store-connect)
3. [Expo / EAS — project + env](#3-expo--eas-one-time-setup)
4. [Apple credentials for EAS](#4-apple-credentials-for-eas)
5. [Sanity-check API](#5-sanity-check-api-before-burning-a-build)
6. [Build the store IPA](#6-build-the-store-ipa)
7. [Submit to App Store Connect](#7-submit-to-app-store-connect)
8. [TestFlight — internal testers](#8-testflight--internal-testers)
9. [TestFlight — external testers (optional)](#9-testflight--external-testers-optional)
10. [Prepare App Store listing](#10-prepare-app-store-listing)
11. [Submit for App Review](#11-submit-for-app-review)
12. [Publish / release](#12-publish--release)
13. [Later releases (version bumps)](#13-later-releases)

---



## 1. Register the Bundle ID

1. Open [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Click **+** → **App IDs** → **App**.
3. Description: e.g. `Arcloops CRM`.
4. Bundle ID → **Explicit** → `io.arcloops.crm`.
5. Enable capabilities you need now (at minimum leave defaults; add Sign in with Apple / Push later if you ship those).
6. **Continue** → **Register**.

You need an active **Apple Developer Program** membership ($99/year).

---

## 2. Create the app in App Store Connect

1. Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**.
2. Platform: **iOS**.
3. Name: `Arcloops CRM` (must be unique on the store; adjust if taken).
4. Primary language: your choice (e.g. English US).
5. Bundle ID: select `io.arcloops.crm`.
6. SKU: any unique string (e.g. `arcloops-crm-ios`).
7. User Access: Full Access (unless you need limited).
8. Create the app.



### Minimum metadata before TestFlight works well

Under the app → **App Information** / **App Privacy** / first version:


| Field              | Notes                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Privacy Policy URL | Your real URL — also set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in env |
| Category           | e.g. Business                                                    |
| Age Rating         | Complete the questionnaire                                       |
| App Privacy        | Answer data-collection questions (login, contacts/people, etc.)  |


You can use TestFlight **without** a public App Store release. Encryption / export compliance is answered when the first build lands (usually **No** for standard HTTPS-only apps that don’t ship custom crypto).

---



## 3. Expo / EAS (one-time setup)

```bash
# Expo account + CLI (skip if already installed)
npm i -g eas-cli
eas login

cd packages/twenty-mobile
eas init   # creates/links Expo project; note the project id UUID
```

**Expected “failure” with dynamic config:** `eas init` / link may error with `Cannot automatically write to dynamic config at: app.config.ts`. Ignore it — `app.config.ts` already sets `extra.eas.projectId` to `5821493b-0911-4b52-9f15-b8e241e40f8f`.

| Expo project | Value |
|--------------|--------|
| Account / slug | `@swajan.automates/twenty-mobile` |
| Dashboard | https://expo.dev/accounts/swajan.automates/projects/twenty-mobile |
| Project ID | `5821493b-0911-4b52-9f15-b8e241e40f8f` |

### Local env (`packages/twenty-mobile/.env`, gitignored)

```env
EXPO_PUBLIC_EAS_PROJECT_ID=5821493b-0911-4b52-9f15-b8e241e40f8f
EXPO_PUBLIC_TWENTY_API_URL=https://crm-api.arcloops.io
EXPO_PUBLIC_TWENTY_ORIGIN=https://crm.arcloops.io
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://www.arcloops.ai/privacy
```

**Critical:** API must be `crm-api`, not the SPA host (`crm.arcloops.io`). Wrong host breaks auth / GraphQL.

### EAS cloud env (required for remote builds)

Local `.env` is **not** uploaded to Expo by default. Set the same vars on the **production** profile:

```bash
cd packages/twenty-mobile
eas env:set …   # or use https://expo.dev → Project → Environment variables (see commands.md)
```

Or in the Expo dashboard: create variables for the **production** environment / profile:

- `EXPO_PUBLIC_EAS_PROJECT_ID` = `5821493b-0911-4b52-9f15-b8e241e40f8f`
- `EXPO_PUBLIC_TWENTY_API_URL` = `https://crm-api.arcloops.io`
- `EXPO_PUBLIC_TWENTY_ORIGIN` = `https://crm.arcloops.io`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL` = `https://www.arcloops.ai/privacy`

Optional: `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Do **not** commit Apple/Google secrets or `.env`.

---



## 4. Apple credentials for EAS

You do **not** need a Mac for cloud builds. First iOS build prompts for Apple login; or set up ahead of time:

```bash
cd packages/twenty-mobile
eas credentials
```

Recommended:

1. Create an **App Store Connect API key** (Users and Access → Integrations → App Store Connect API) with access to the app.
2. Let EAS manage the **distribution certificate** + **App Store provisioning profile** for `io.arcloops.crm`.
3. Or use Apple ID + [app-specific password](https://appleid.apple.com) when prompted.

---



## 5. Sanity-check API before burning a build

```bash
# Must be JSON, not HTML
curl -sS https://crm-api.arcloops.io/client-config | head
```

Optional local smoke:

```bash
cd packages/twenty-mobile && npm start
```

Confirm password login against production API. Password auth is the simplest first TestFlight path; OAuth (Microsoft/Google) needs the `twenty` URL scheme and correct API URL.

---



## 6. Build the store IPA

Mobile is a **standalone npm app** (`package-lock.json`). EAS uses Node **22.14.0** — independent of the Twenty monorepo’s Node 24 / Yarn constraints. Root `.easignore` uploads only `packages/twenty-mobile`.

```bash
cd packages/twenty-mobile
npm install
npm run build:ios
```

- Watch progress at [expo.dev](https://expo.dev) → your project → Builds.
- Typical cloud build: ~10–20+ minutes.
- **Do not** use `--profile preview` for TestFlight / App Store — that profile is `distribution: internal` (ad hoc), not App Store.

When the build succeeds, download the `.ipa` from the dashboard if you want a local copy; submit usually pulls it from Expo.

---



## 7. Submit to App Store Connect

```bash
cd packages/twenty-mobile

# After the production iOS build finishes:
eas submit --profile production --platform ios

# Or explicitly the latest successful build:
eas submit --latest --platform ios
```

`eas submit` uploads the IPA to App Store Connect. Apple then processes it (often **5–30+ minutes**, sometimes longer).

In App Store Connect → your app → **TestFlight** → iOS builds: wait until status is **Ready to Test** (or Processing → complete compliance questions if asked).

### First-build stalls (common)


| Blocker                                | Where to fix                                              |
| -------------------------------------- | --------------------------------------------------------- |
| Missing encryption / export compliance | TestFlight build detail → answer questionnaire            |
| Missing privacy policy / App Privacy   | App Store Connect metadata                                |
| Invalid provisioning / wrong bundle    | EAS credentials + Bundle ID match `io.arcloops.crm`       |
| Build stuck Processing                 | Wait; check Apple System Status; re-submit only if failed |


---



## 8. TestFlight — internal testers

**Internal testing** = App Store Connect users on your team (up to 100). **No** Beta App Review.

1. App Store Connect → **Users and Access** — ensure testers exist with access to the app.
2. App → **TestFlight** → **Internal Testing** → create/select a group → add the build → add testers.
3. Testers install **TestFlight** from the App Store, accept the email/App Store Connect invite, install Arcloops CRM.

Checklist for yourself on device:

- [ ] Cold launch → login screen
- [ ] Password login to production workspace
- [ ] Home / records load (People, Companies, etc.)
- [ ] Token refresh after backgrounding
- [ ] Camera / photo picker permission strings look correct (business cards)
- [ ] Settings / deep links to web where expected

---



## 9. TestFlight — external testers (optional)

**External** groups (public link or email invites) require **Beta App Review** the first time (and sometimes again after significant changes).

1. TestFlight → **External Testing** → create group → add build → fill Beta App Description / what to test.
2. Submit for Beta Review; when approved, share the public link or invites.
3. External testers also use the TestFlight app.

---



## 10. Prepare App Store listing

Do this while TestFlight is baking, or after internal sign-off. Under the app’s **iOS version** (e.g. 0.1.0):

### Required assets & copy


| Item                     | Guidance                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Screenshots              | iPhone 6.7" (and usually 6.5"/5.5" or Apple’s current required sizes). Use real product UI. |
| App Preview (optional)   | Short video                                                                                 |
| Description              | What the CRM does for your users                                                            |
| Keywords                 | Search terms (comma-separated, no competitor trademark stuffing)                            |
| Support URL              | Your support page                                                                           |
| Marketing URL (optional) | Landing page                                                                                |
| Privacy Policy URL       | Same as env / App Information                                                               |
| Copyright                | e.g. `2026 Arcloops`                                                                        |
| Age Rating               | Completed questionnaire                                                                     |
| App Privacy              | Nutrition labels — be accurate about collected data                                         |
| Review notes             | Demo account email/password if Apple must log in; note API is your hosted CRM               |




### App Review demo access

If the app requires login (it does):

1. Create a dedicated review workspace user with password auth enabled.
2. Put credentials in **App Review Information** → Sign-in required.
3. Ensure `https://crm-api.arcloops.io` is reachable worldwide and password auth is on (`/client-config` → `authProviders.password`).



### Pricing & availability

**Monetization** → Price: Free (or paid) → Availability: countries you want.

---



## 11. Submit for App Review

1. Confirm the **same build** you validated on TestFlight is selected for the App Store version.
2. Complete all yellow/missing checklist items on the version page.
3. **Add for Review** → **Submit to App Review**.

Typical review: ~24–48 hours (can be longer). Watch App Store Connect → **App Review** and email.

### If rejected

Fix the issue (metadata, login, crash, guideline), upload a **new build** if code changed (`eas build` again — build number auto-bumps), attach it to the version, reply in Resolution Center, resubmit.

---



## 12. Publish / release

After **Approved**:

1. Choose release mode (set when submitting or under the version):
  - **Manually release** — you press **Release this Version** when ready.
  - **Automatic** — goes live after approval.
  - **Scheduled** — pick a date/time.
2. App appears on the App Store (propagation can take minutes to hours).
3. Verify install from the public App Store page on a device that wasn’t only on TestFlight.

---



## 13. Later releases

Marketing version lives in `packages/twenty-mobile/app.config.ts` (`version: '0.1.0'`). Build number is managed remotely by EAS (`appVersionSource: "remote"` + `autoIncrement`).

```bash
cd packages/twenty-mobile

# 1. Bump version in app.config.ts when you want a new store version (e.g. 0.1.0 → 0.1.1 or 0.2.0)
# 2. Rebuild + submit
eas build --profile production --platform ios
eas submit --profile production --platform ios

# 3. In App Store Connect: create new version if needed → select new build → TestFlight → then Submit for Review
```

Same TestFlight path: internal first, then App Review for the store.

---



## Command cheat sheet

```bash
cd packages/twenty-mobile
npm install

# One-time
eas login
eas credentials

# Every store build
npm run build:ios
npm run submit:ios
```

---



## Repo-specific gotchas


| Gotcha                             | Fix                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Using monorepo `yarn` for mobile   | Use `cd packages/twenty-mobile && npm …` — not a Yarn workspace           |
| Using `preview` for TestFlight     | Use `production` only for App Store / TestFlight store builds             |
| API pointed at SPA                 | Set `EXPO_PUBLIC_TWENTY_API_URL=https://crm-api.arcloops.io`              |
| Privacy URL still Twenty’s default | Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` to yours (local + EAS env)           |
| OAuth broken on device             | Confirm scheme `twenty` + API URL; use password auth for first TestFlight |
| Secrets in git                     | Never commit Apple keys, `.env`, or Play credentials                      |
| First ASC submission stall         | Complete encryption Q + privacy policy + App Privacy in App Store Connect |
| Stale marketing version            | Bump `version` in `app.config.ts`; let EAS bump build numbers             |


---



## Practical cold-start order

1. Register Bundle ID `io.arcloops.crm` + create ASC app
2. `eas login` + `eas init` + local `.env` + EAS production env vars
3. `eas build --profile production --platform ios`
4. `eas submit --profile production --platform ios`
5. Answer compliance → Internal TestFlight → install on your iPhone
6. Fill store listing + screenshots + review demo login
7. Submit for App Review → release when approved

---



## References in this repo

- App config / bundle ID: `packages/twenty-mobile/app.config.ts`
- EAS profiles: `packages/twenty-mobile/eas.json`
- Mobile overview: `packages/twenty-mobile/README.md` (Phase 8)
- Quick build commands: `commands.md`

