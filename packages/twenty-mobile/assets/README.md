# Mobile branding assets

| Folder | Role |
|--------|------|
| `images/` | **Shipped** — referenced by `app.config.ts` (icon, splash, Android adaptive, favicon) |
| `pack/` | Source masters + generated sizes; run `_post.py` after editing raws (excluded from EAS upload) |
| `images/_backup-twenty-defaults/` | Old Twenty Expo defaults (not used; excluded from EAS upload) |

## Brand

- Charcoal: `#38393B` / RGB `(56, 57, 59)` — splash + Android adaptive background
- App icon (`icon.png`): full mark + **CRM** wordmark, opaque
- Splash: mark + **CRM** on transparent over charcoal
- Android adaptive foreground / monochrome: **mark only** (no wordmark; stays in safe zone)

## Regenerate

```bash
cd packages/twenty-mobile
python3 assets/pack/_post.py
```

Edit raws in `pack/` (`icon-1024.png`, `splash-raw.png`, `android-fg-raw.png`, `android-mono-raw.png`), then re-run. Do not hand-edit files under `images/` unless you also update `pack/`.
