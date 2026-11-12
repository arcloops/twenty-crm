# Arcloops CRM mobile — commands

`packages/twenty-mobile` is a **standalone Expo app** (npm + `package-lock.json`). It is **not** a Yarn workspace. Always `cd packages/twenty-mobile` and use **npm**.

Env: `packages/twenty-mobile/.env` (API → `crm-api`).

---

## Setup (once)

```bash
cd packages/twenty-mobile
npm install
```

**Prereqs for a real iPhone:** Xcode (from App Store), Apple Developer Program membership, cable.

---

## Run on iPhone via USB (Xcode / native build)

This installs **Arcloops CRM** on the phone (not Expo Go). First run takes a while (native compile).

1. Plug in the iPhone with a cable. Unlock it → **Trust This Computer**.
2. iOS 16+: Settings → Privacy & Security → **Developer Mode** → On (reboot if asked).
3. On the Mac:

```bash
cd packages/twenty-mobile
npm run ios:device
# same as: npx expo run:ios --device
```

4. When prompted, pick your iPhone from the device list.
5. First time: choose your **Apple Team** for signing (`io.arcloops.crm`). Automatic signing is fine.

Metro starts with the app. Rebuild only when native deps / `app.config.ts` plugins change; otherwise:

```bash
npm start
# reopen the app on the phone (already installed)
```

### Open in Xcode instead

```bash
cd packages/twenty-mobile
npx expo prebuild --platform ios   # creates ios/ (gitignored)
open ios/*.xcworkspace             # or *.xcodeproj if no workspace
```

In Xcode: select your **physical iPhone** as the run destination (not a Simulator) → press **Run** (▶). Set Signing & Capabilities → Team if needed.

### If the device does not appear

```bash
# List connected devices
xcrun xctrace list devices
# or
xcrun devicectl list devices
```

- Use a data cable (not charge-only).
- Unplug/replug; unlock phone.
- Xcode → Window → Devices and Simulators → confirm the phone is listed and not “untrusted”.
- Exact device: `npx expo run:ios --device "Your iPhone Name"`

**Sign in:** workspace email/password against `https://crm-api.arcloops.io`.

---

## Run on iOS Simulator

```bash
cd packages/twenty-mobile
npm run ios
# or: npm start → press `i`
```

---

## EAS — TestFlight / App Store

App Store Connect Apple ID `6820139033`. EAS Node **22**.

```bash
cd packages/twenty-mobile
eas credentials    # first time
npm run build:ios  # uploads this package only (EAS_NO_VCS + EAS_PROJECT_ROOT)
npm run submit:ios

# Optional: compile on this Mac (needs Xcode + ~20GB free)
npm run build:ios:local

# Debug what EAS would upload
npm run build:inspect && ls /tmp/eas-mobile-archive/package.json
```

Always run from `packages/twenty-mobile`. Root `.easignore` also keeps `packages/twenty-mobile` if a monorepo upload is used (`npm run build:ios:monorepo`).

Then TestFlight → Internal Testing → install via the TestFlight app.

---

## Railway cost (8–10 users)

See **[deploy.md](./deploy.md)** — Google-only auth/sync, `RUN_WORKERS_IN_SERVER=true` (drop separate worker), memory limits, sleep policy.

```bash
# Env template + small-team compose
cp packages/twenty-docker/arcloops.env.example packages/twenty-docker/.env
# fill Google + secrets, then:
# docker compose -f packages/twenty-docker/docker-compose.arcloops.yml --env-file packages/twenty-docker/.env up -d

# After flipping providers, clear stale cron keys then restart API
bash packages/twenty-docker/scripts/clear-stale-bullmq-repeatables.sh "$REDIS_URL"
```
