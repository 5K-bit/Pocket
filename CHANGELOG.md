# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-11-03

### Added
- Default shortcuts for THE LINK, CityGrid and Supabase.
- iPhone "Add to Home Screen" tip, shown once in Safari and dismissible.
- Editor shows each destination's default URL; tapping the backdrop closes it; focus moves to the first field.

### Changed
- OBEOS Website now points to `obeosite.netlify.app`. A saved copy of the old address is ignored so existing installs pick up the new one.
- Larger tap targets for Edit and Close, landscape safe-area padding, clearer hero copy.
- Service-worker cache bumped to `obeos-pocket-shell-v3`.

## [0.1.1] - 2026-11-02

First tagged release of the 0.1.1 source already deployed to Netlify.

### Added
- Release workflow: validates, builds a versioned runtime-only ZIP with `SHA256SUMS`, publishes on a `v*` tag.
- `scripts/acceptance-e2e.cjs`: optional headless-Chromium acceptance test (offline launch, edit/persist/reject/reset, redeploy update).
- Validator checks that the app version, README and release notes agree.

### Fixed
- README claimed the service worker works on localhost; it registers only over HTTPS. Documentation corrected.
