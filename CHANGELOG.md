# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-11-02

First tagged release of the 0.1.1 source already deployed to Netlify.

### Added
- Release workflow: validates, builds a versioned runtime-only ZIP with `SHA256SUMS`, publishes on a `v*` tag.
- `scripts/acceptance-e2e.cjs`: optional headless-Chromium acceptance test (offline launch, edit/persist/reject/reset, redeploy update).
- Validator checks that the app version, README and release notes agree.

### Fixed
- README claimed the service worker works on localhost; it registers only over HTTPS. Documentation corrected.
