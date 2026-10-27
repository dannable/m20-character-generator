#!/usr/bin/env python3
"""Generate web-sized WebP derivatives of the tarot card art.

Source:  app/public/tarot/*.png        (79 PNGs, up to 8.8 MB each; git-ignored)
Output:  app/public/tarot/webp/<name>.webp   face cards, 800 px tall, <= 300 KB
         app/public/tarot/thumb/<name>.webp  thumbnails, 400 px tall, <= 60 KB

js/tarot.js loads the thumbnail for deck backs and 1x screens, the webp face
for 2x screens, and the original PNG only when a card is tapped to zoom.
Both output folders are git-ignored like the PNGs; run this after restoring
the PNGs on a fresh checkout. Unchanged cards are skipped unless --force.

Usage: python3 tools/make_tarot_derivatives.py [--force] [--src app/public/tarot]
Needs Pillow (python3 -m pip install pillow).
"""
import argparse
import io
import os
import sys
from pathlib import Path

try:
    from PIL import Image, PngImagePlugin
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install pillow")

# Some cards carry multi-megabyte text chunks (generator metadata); Pillow refuses
# them at its 1 MB default
PngImagePlugin.MAX_TEXT_CHUNK = 64 * 1024 * 1024

ROOT = Path(__file__).resolve().parent.parent
VARIANTS = {
    # folder: (height px, size limit bytes, starting quality)
    "webp":  (800, 300 * 1024, 88),
    "thumb": (400, 60 * 1024, 82),
}


def encode(img, height, limit, quality):
    """Resize to `height` and lower the WebP quality until the file fits `limit`."""
    w, h = img.size
    scaled = img.resize((round(w * height / h), height), Image.LANCZOS)
    q = quality
    while True:
        buf = io.BytesIO()
        scaled.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= limit or q <= 40:
            return buf.getvalue(), q
        q -= 4


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=str(ROOT / "app/public/tarot"), help="folder holding the card PNGs")
    ap.add_argument("--force", action="store_true", help="regenerate even when the derivative is newer than the PNG")
    args = ap.parse_args()
    src = Path(args.src)
    pngs = sorted(src.glob("*.png"))
    if not pngs:
        sys.exit(f"no PNGs in {src}")

    totals = {k: [0, 0] for k in VARIANTS}  # files, bytes
    for png in pngs:
        img = None
        for folder, (height, limit, quality) in VARIANTS.items():
            out = src / folder / (png.stem + ".webp")
            out.parent.mkdir(exist_ok=True)
            if not args.force and out.exists() and out.stat().st_mtime >= png.stat().st_mtime:
                totals[folder][0] += 1
                totals[folder][1] += out.stat().st_size
                continue
            if img is None:
                img = Image.open(png)
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            data, q = encode(img, height, limit, quality)
            out.write_bytes(data)
            totals[folder][0] += 1
            totals[folder][1] += len(data)
            print(f"{folder}/{out.name:34} {len(data) / 1024:6.0f} KB  q={q}")

    print()
    for folder, (n, size) in totals.items():
        print(f"{folder}: {n} files, {size / 1024 / 1024:.1f} MB total, {size / n / 1024:.0f} KB average")


if __name__ == "__main__":
    main()
