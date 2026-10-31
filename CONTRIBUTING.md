# Contributing to Pocket

Pocket is a small, dependency-free, installable web launcher. Keep changes focused on its actual v0.1.1 behavior.

## Local checks

```sh
node --check app.js
node --check service-worker.js
python3 scripts/validate.py
```

## Ground rules

- Keep the app static and deployable from the repository root with no build command.
- Do not add tracking scripts, analytics, remote-control features or embedded credentials.
- Render user-controlled values through safe DOM APIs, not `innerHTML`.
- Preserve the HTTPS-only URL rule and content security headers; do not weaken them silently.
- When changing cached assets, increment the service-worker cache version and test offline/online updates.
- Manual acceptance on an iPhone is required for claims about iOS Home Screen behavior; static CI is not a substitute.
- Document changes and unsupported behaviors in the README.

## Submitting changes

Open an issue with the observed behavior, expected result and repeatable steps (without personal URLs or secrets). Pull requests should link the relevant issue, pass the checks, and identify any iOS tests performed.
