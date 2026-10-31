#!/usr/bin/env python3
"""Static OBEOS Pocket deployment checks; no third-party dependencies."""
from pathlib import Path
import json
import re
import tomllib

root = Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
manifest = json.loads((root / "manifest.webmanifest").read_text(encoding="utf-8"))
service_worker = (root / "service-worker.js").read_text(encoding="utf-8")
headers = (root / "_headers").read_text(encoding="utf-8")
netlify = tomllib.loads((root / "netlify.toml").read_text(encoding="utf-8"))

assert netlify["build"]["publish"] == ".", "Netlify publish directory must be repo root"
assert "Content-Security-Policy" in headers and "nosniff" in headers
assert "Cache-Control: no-cache" in headers
assert manifest["display"] == "standalone"
assert manifest["start_url"] == "./"
assert (root / ".github/workflows/validate.yml").is_file()
for path in ["index.html", "styles.css", "app.js", "manifest.webmanifest", "service-worker.js", "icons/icon-192.png", "icons/icon-512.png"]:
    assert (root / path).is_file(), f"Missing runtime asset: {path}"
for attr, path in re.findall(r'(?i)(src|href)="(\./[^"#?]+)"', html):
    assert (root / path.removeprefix("./")).is_file(), f"Broken {attr} reference: {path}"
for icon in manifest["icons"]:
    icon_path = root / icon["src"].removeprefix("./")
    assert icon_path.is_file() and icon_path.stat().st_size, f"Missing icon: {icon_path}"
assert "obeos-pocket-shell-v2" in service_worker
assert "https://github.com/5K-bit/Pocket" in (root / "app.js").read_text()
print("OBEOS Pocket static validation: PASS")
