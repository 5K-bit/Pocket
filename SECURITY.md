# Pocket security policy

## Scope

Pocket v0.2.0 is a **static launcher**, not a remote management interface. It provides no accounts, server API, token store, device control, or service-health monitoring.

## Boundaries and caveats

- **Links:** the editor requires HTTPS URLs without embedded username/password. HTTPS is a transport property, not proof that a destination is trustworthy.
- **Local settings:** editable links are kept in browser `localStorage` without encryption or synchronization. Browser-profile access can expose them; clearing website data can erase them.
- **Offline:** a service worker caches same-origin application assets for launch. Linked external websites and dashboards are outside that cache.
- **Browser policies:** Netlify headers include a Content Security Policy and other defenses. They do not secure a separate site opened by a Pocket shortcut.
- **Deployment:** keep production branch protections and repository access appropriate for a public-facing app. A successful GitHub commit does not establish that Netlify published it.
- **Future integrations:** require independently authenticated and authorized APIs, least privilege, CSRF/origin protections where relevant, request logging and explicit operator approval before adding commands. A private network alone is insufficient.

## Responsible disclosure

Prefer GitHub's **Security → Report a vulnerability** (if enabled) to report a security problem privately. Include version, browser, steps to reproduce and impact. Do not include live credentials, production tokens, or sensitive private endpoints.

For non-sensitive defects, open a GitHub issue.
