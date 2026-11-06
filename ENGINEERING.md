# BES-1 pilot: Pocket

**Status:** Pilot proposal, not an operational certification.  
**Canonical standard:** [BES-1 on OBEOS](https://github.com/5K-bit/O.B.E.O.S/blob/main/docs/standards/BES-1.md) (proposed in [OBEOS PR #16](https://github.com/5K-bit/O.B.E.O.S/pull/16); merge that PR before adopting this pilot).

## Constraints that must not change

Pocket is a no-build, static PWA. No server, runtime dependencies, accounts, analytics, cloud control plane or CI package-manager migration is required by BES-1. Changes to the service worker must preserve safe offline behavior and increment the cache key when needed. The HTTPS-only destination and CSP boundaries stay intact.

## Task interface

`just` is optional. Keep native commands working.

| Command | What it checks | What it does **not** prove |
| --- | --- | --- |
| `just check` | Node source syntax and `scripts/validate.py` static/deployment checks | Browser correctness or deployed site state |
| `just browser-test` | Existing local HTTPS headless Chromium acceptance harness | Safari/iOS Home Screen behavior |
| `just serve` | Serves local static files on port 8000 (blocking process) | Service-worker/offline availability on ordinary HTTP |
| `just release-check` | Local static preflight; does not publish | Release artifact correctness or Netlify deployment |

Prerequisites: Node.js 22+, Python 3 and optional `just`. For `browser-test`, install Playwright/Chromium explicitly and provide `openssl` on PATH (see script header); it is optional, not part of current CI. There is no `setup` or `build` alias because Pocket needs neither at runtime. A `python` executable must be on PATH for the aliases (on Linux, `python3` can be used for the direct command).

## Evidence for status

- **Verified:** link Node syntax and static validator results to the exact commit; link optional Chromium results separately.
- **Released:** record GitHub release artifact verification and the actual Netlify production deploy ID, branch, URL, published state and version.
- **Operational:** on a real iPhone, install via Safari -> Add to Home Screen; reopen online and offline, edit/save destinations, reject unsafe URLs, verify update/redeployment and retained local preferences. Record device/iOS/browser/date and any failures. A mobile user-agent in Chromium is **not** a real iOS test.

## Recovery

If a deployment fails, restore the last verified Netlify deploy or revert the Git commit; avoid modifying a user's localStorage as an automatic recovery step. For delayed service-worker updates, close/reopen while online and verify the actual installed app shell; document if clearing site data would erase user preferences.

**AI assistance:** describe the generated/reviewed changes in PR.  
**Human verification:** give actual commands and witnessed iPhone acceptance; otherwise mark not run.
