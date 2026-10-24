# Security

## Reporting

Email <bynrnworld@gmail.com>. Please do not open a public issue for a suspected vulnerability.
Include the version, browser, reproduction steps and impact. Acknowledgement within 5 working days.

## Attack surface

Time Architect is a static, offline game. Its runtime surface is intentionally minimal:

- no backend, no API calls, no cookies, no auth, no third-party scripts, no ads;
- local `localStorage` only;
- same-origin static files plus a service worker;
- untrusted input is limited to keyboard, pointer and gamepad events.

## Built-in protections

- All dynamic text inserted into screens is escaped (`src/ui/screens.js`).
- No `eval`, `new Function`, `innerHTML` from user input, or remote code loading.
- Level data is compiled from source, not fetched.
- Saves are parsed defensively, type-checked, clamped and recovered from a backup.
- The development server blocks path traversal and sends `X-Content-Type-Options: nosniff` and
  `Referrer-Policy: no-referrer`.
- The service worker caches same-origin GETs only.

## Deployment guidance

- Serve over HTTPS.
- Set a Content-Security-Policy such as
  `default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`.
  The inline style attributes used by templates require `style-src 'unsafe-inline'`.
- Keep the service worker cache version current.
- Do not add analytics or ad SDKs without updating `PRIVACY.md` and the in-game privacy screen.

## Secrets

The repository contains no keys or credentials. Android signing keys, store credentials and any
future ad unit IDs must stay outside version control.
