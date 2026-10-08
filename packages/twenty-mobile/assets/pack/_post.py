#!/usr/bin/env python3
# Regenerate pack products from raw sources, then sync into assets/images/.
# Requires: pip install pillow
# Usage:  python3 assets/pack/_post.py   (from packages/twenty-mobile)

from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parent / 'images'
CHARCOAL = (56, 57, 59, 255)
# Row just above the CRM wordmark gap in the raw masters
MARK_CUT_Y = 603


def ensure_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert('RGBA')


def extract_mark_only(src: Path, cut_y: int, out_size: int = 1024) -> Image.Image:
    im = ensure_rgba(src)
    cropped = im.crop((0, 0, im.size[0], cut_y))
    bbox = cropped.getbbox()
    if bbox is None:
        raise SystemExit(f'no content in {src}')
    mark = cropped.crop(bbox)
    target = int(out_size * 0.62)
    scale = target / max(mark.size)
    mark = mark.resize(
        (max(1, int(mark.size[0] * scale)), max(1, int(mark.size[1] * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new('RGBA', (out_size, out_size), (0, 0, 0, 0))
    canvas.paste(
        mark,
        ((out_size - mark.size[0]) // 2, (out_size - mark.size[1]) // 2),
        mark,
    )
    return canvas


def main() -> None:
    # Master App Store / Expo icon — opaque RGB (no alpha)
    icon = ensure_rgba(HERE / 'icon-1024.png').convert('RGB')
    icon.save(HERE / 'icon.png', 'PNG')

    # Splash — full brand (mark + CRM) on transparent; Expo splash backgroundColor fills behind
    splash = ensure_rgba(HERE / 'splash-raw.png')
    splash.save(HERE / 'splash-icon.png', 'PNG')

    # Android adaptive background — solid charcoal
    bg = Image.new('RGBA', (1024, 1024), CHARCOAL)
    bg.save(HERE / 'android-icon-background.png', 'PNG')
    bg.resize((512, 512), Image.Resampling.NEAREST).save(
        HERE / 'android-icon-background-512.png',
        'PNG',
    )

    # Adaptive foreground + monochrome — mark only (safe zone; no wordmark)
    fg = extract_mark_only(HERE / 'android-fg-raw.png', MARK_CUT_Y)
    fg.save(HERE / 'android-icon-foreground.png', 'PNG')
    fg.resize((512, 512), Image.Resampling.LANCZOS).save(
        HERE / 'android-icon-foreground-512.png',
        'PNG',
    )

    mono = extract_mark_only(HERE / 'android-mono-raw.png', MARK_CUT_Y)
    mono.save(HERE / 'android-icon-monochrome.png', 'PNG')
    mono.resize((432, 432), Image.Resampling.LANCZOS).save(
        HERE / 'android-icon-monochrome-432.png',
        'PNG',
    )

    icon.resize((48, 48), Image.Resampling.LANCZOS).save(HERE / 'favicon.png', 'PNG')
    icon.resize((180, 180), Image.Resampling.LANCZOS).save(HERE / 'icon-180.png', 'PNG')
    icon.resize((120, 120), Image.Resampling.LANCZOS).save(HERE / 'icon-120.png', 'PNG')

    # iOS-style rounded preview for review only (not shipped)
    size = 512
    preview = icon.resize((size, size), Image.Resampling.LANCZOS).convert('RGBA')
    radius = int(size * 0.2237)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    sheet = Image.new('RGBA', (size, size), (247, 247, 247, 255))
    sheet.paste(preview, (0, 0), mask)
    sheet.save(HERE / 'ios-preview.png', 'PNG')

    sync = [
        'icon.png',
        'splash-icon.png',
        'favicon.png',
        'android-icon-background.png',
        'android-icon-foreground.png',
        'android-icon-monochrome.png',
    ]
    IMAGES.mkdir(parents=True, exist_ok=True)
    for name in sync:
        (IMAGES / name).write_bytes((HERE / name).read_bytes())

    print('pack ready →', HERE)
    print('synced into →', IMAGES)
    for name in sorted(p.name for p in HERE.glob('*.png') if not p.name.startswith('_')):
        im = Image.open(HERE / name)
        print(f'  {name:40s} {im.size[0]}x{im.size[1]} {im.mode}')


if __name__ == '__main__':
    main()
