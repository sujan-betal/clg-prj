"""
Generates the placeholder images the seeded gallery rows point at.

    python backend/scripts/make_gallery_images.py

The gallery endpoint stores image_url values like /gallery/campus-entrance.jpg.
Without real files the frontend renders broken images, so this writes one
gradient SVG per gallery entry and rewrites the URLs to match.

Safe to re-run: existing files are left alone.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from xml.sax.saxutils import escape

BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
ADMIN_PW = "Admin@1234"
OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend", "public", "gallery",
)

# Brand-ish gradients so the placeholder set still looks deliberate.
PALETTES = [
    ("#7a1030", "#c24060"),
    ("#0b5252", "#1f8f86"),
    ("#93355c", "#e08a3c"),
    ("#2b2d42", "#5c6378"),
    ("#1d3557", "#457b9d"),
    ("#5a189a", "#9d4edd"),
]


def call(token, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}


def slug(title):
    return "-".join(title.lower().split()).replace("&", "and")


def svg(title, index):
    c1, c2 = PALETTES[index % len(PALETTES)]
    label = escape(title.upper())
    size = 26 if len(title) <= 16 else 20
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <circle cx="660" cy="120" r="180" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="500" r="220" fill="#ffffff" opacity="0.05"/>
  <text x="50%" y="50%" fill="#ffffff" opacity="0.92"
        font-family="Georgia, serif" font-size="{size}" font-weight="bold"
        text-anchor="middle" dominant-baseline="middle">{label}</text>
</svg>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    _, r = call(None, "POST", "/api/auth/login", {"username": "admin", "password": ADMIN_PW})
    token = (r.get("data") or {}).get("access_token")
    if not token:
        print("Could not log in as admin.")
        sys.exit(1)

    status, r = call(None, "GET", "/api/public/gallery")
    items = r.get("data") or []
    if not items:
        print("No gallery items found. Run bulk_seed.py first.")
        sys.exit(1)

    written, updated = 0, 0
    for i, item in enumerate(items):
        name = slug(item["title"])
        path = os.path.join(OUT_DIR, f"{name}.svg")
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                f.write(svg(item["title"], i))
            written += 1

        new_url = f"/gallery/{name}.svg"
        if item.get("image_url") != new_url:
            call(token, "PUT", f"/api/admin/gallery/{item['id']}", {"image_url": new_url})
            updated += 1

    print(f"wrote {written} images, updated {updated} gallery rows")
    print(f"output: {OUT_DIR}")


if __name__ == "__main__":
    main()