set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]

# BES-1 optional aliases; Pocket intentionally has no dependency/build step.
default:
    @just --list

check:
    node --check app.js
    node --check service-worker.js
    python scripts/validate.py

# Optional desktop Chromium acceptance; requires Playwright, Chromium and openssl.
browser-test:
    node scripts/acceptance-e2e.cjs

# Development server only. Not equivalent to an installed iOS PWA.
serve:
    python -m http.server 8000

# Preflight only; the existing GitHub release workflow packages and verifies artifacts.
release-check:
    just check
