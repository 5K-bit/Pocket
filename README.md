# OBEOS Pocket

**OBEOS Pocket v0.1.1** is a lightweight, offline-capable iPhone Home Screen launcher for the Blackfong ecosystem. It is a static Progressive Web App (PWA): no build process, API token, external scripts, or server-side runtime is required.

## Features

- Open OBEOS company website, the Pocket source repo, OBEOS main repo, GitHub projects, Netlify, ChatGPT, or a configured Legion / DAISE HTTPS endpoint.
- Customize destinations using **Edit Links**. Browser local storage is per-device and does not sync or get committed to GitHub.
- Add from Safari to the iOS Home Screen as a standalone web app.
- Service worker stores the launcher shell for offline use and prefers fresh assets when the device is online.
- Security headers and HTTPS-only custom destination validation.

## Repository layout

All runtime files live in the **repository root**, not a nested project directory.

```
index.html              HTML launcher
styles.css              Responsive styling
app.js                  Tiles and local link editor
manifest.webmanifest    Install metadata
service-worker.js       Offline shell and asset refresh
icons/                  iOS / PWA icons
_headers                Netlify security and cache headers
netlify.toml            Publish the repository root
.github/workflows/      GitHub source validation
scripts/                Local static validation
```

## Connect an EXISTING Netlify site to GitHub (one-time setup)

Uploading code to GitHub **does not automatically update** a site originally deployed using Netlify Drop. You must connect the existing Netlify site to the repo once:

1. Open your **existing** renamed OBEOS Pocket site in the Netlify dashboard (do not create another site).
2. Open **Project configuration → Developer settings → Continuous deployment → Repository**. Select **Link repository**.
3. Choose GitHub, select `5K-bit/Pocket`, and set the production branch to `main`.
4. Use **Base directory: blank**, **Build command: blank**, **Publish directory: `.`**. The repo includes `netlify.toml` with the publish directory.
5. Save, then deploy the branch from the Netlify dashboard if it does not deploy automatically.
6. Verify the **same existing site URL** now shows `V0.1.1 / STATIC` and the **Pocket Source** shortcut. From then on, subsequent pushes to the configured production branch should trigger Netlify deploys.

If Netlify does not offer the Link repository option, see https://docs.netlify.com/build/git-workflows/repo-permissions-linking/ for the current workflow. Do not create a new site unless intentionally changing the public URL; existing iPhone shortcuts target the old domain.

## Local validation

```sh
node --check app.js
node --check service-worker.js
python3 scripts/validate.py
```

A successful validation checks runtime references, the manifest, icons, expected security settings, the Netlify configuration, and the GitHub workflow.

## iPhone workflow

- Open your existing Netlify URL in Safari → Share → Add to Home Screen → **Open as Web App** if available.
- To update source from iPhone: clone this repository in Working Copy; edit and commit; push to `main`; check Netlify Deploys; refresh the Home Screen app.
- If the app appears unchanged after deployment, fully close and reopen it while online. If needed, open the site in Safari and reload; service worker update and tab lifecycle on iOS can delay replacing the active shell.

## Security boundaries

**This version is a launcher, not a remote machine control system or availability monitor.** There is no authorization backend and no service-health probe. Never put passwords, token-bearing URLs, or unauthenticated admin endpoints in a destination. Add authenticated APIs, authorization, audit logs and explicit command approvals before enabling remote actions. A private Tailscale address alone is not enough to secure an administrative API.
