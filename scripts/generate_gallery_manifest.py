#!/usr/bin/env python3

import json
import plistlib
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GALLERY_DIR = ROOT / "media" / "gallery"
OUTPUT_FILE = ROOT / "gallery-manifest.js"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def read_finder_comment(path: Path) -> str:
    attr_name = "com.apple.metadata:kMDItemFinderComment"
    try:
        raw = subprocess.check_output(
            ["xattr", "-p", attr_name, str(path)],
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""

    try:
        value = plistlib.loads(raw)
    except Exception:
        return ""

    if isinstance(value, str):
        return value.strip()

    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item.strip():
                return item.strip()

    return ""


def humanize_filename(path: Path) -> str:
    stem = path.stem
    stem = re.sub(r"^IMG[_-]?", "", stem, flags=re.IGNORECASE)
    stem = re.sub(r"^DSC[_-]?", "", stem, flags=re.IGNORECASE)
    stem = stem.replace("_", " ").replace("-", " ").strip()
    return stem or path.stem


def build_manifest():
    images = []
    if not GALLERY_DIR.exists():
        return images

    for path in sorted(GALLERY_DIR.iterdir()):
        if not path.is_file():
            continue
        if path.name.startswith("."):
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        caption = read_finder_comment(path) or humanize_filename(path)
        images.append(
            {
                "src": f"media/gallery/{path.name}",
                "alt": caption,
                "captionEn": caption,
                "captionZh": caption,
            }
        )
    return images


def main():
    manifest = build_manifest()
    content = "window.GALLERY_IMAGES = " + json.dumps(
        manifest, ensure_ascii=False, indent=2
    ) + ";\n"
    OUTPUT_FILE.write_text(content, encoding="utf-8")
    print(f"Wrote {len(manifest)} gallery items to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
