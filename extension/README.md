# Nowaster browser extension

Chrome and Firefox (Manifest V3) from one codebase, built with [WXT](https://wxt.dev), React, TypeScript, Tailwind v4.
See `DESIGN.md` for decisions, permissions and the CORS notes.

## Setup

```bash
npm install
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run dev:firefox` | Dev build with reload, opens the browser |
| `npm run build` / `npm run build:firefox` | Production build to `.output/chrome-mv3` or `.output/firefox-mv3` |
| `npm run zip` / `npm run zip:firefox` | Store-ready zip |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (pattern conversion, badge formatting, rule planning and diffing, finish endpoint) |

Load a build manually: Chrome `chrome://extensions` > Developer mode > Load unpacked > `.output/chrome-mv3`;
Firefox `about:debugging` > This Firefox > Load Temporary Add-on > `.output/firefox-mv3/manifest.json`.

## Configuration

Open the extension's options page, paste an API token created in the web app (Settings, Tokens), and press
"Test connection". The token is stored in `chrome.storage.local` and sent as `X-API-Key`. It grants full account access.

The API base URL defaults to `https://nowaster.app/api` in production builds and `http://[::1]:4008/api` in dev builds. It can be changed in options for a self-hosted server. It already ends in `/api`; endpoints are paths relative to it (`/auth/me`, `/category`, `/tag`, `/session/stopwatch`, `/block-rules`).

Blocked sites: adding a site in options asks the browser for access to that domain only. With access, the site
redirects to the focus page while a session runs; without it (or if you decline), the site is still blocked but
without the redirect, and options shows "access not granted: blocked without redirect". Removing a site releases its
access unless another rule needs it. Stopping a session uses `POST /session/stopwatch/{id}/finish`; if the stop
fails the session stays active and you can retry. Start is disabled while a session runs.

Note: the machine's default npm registry may be an unreachable corporate mirror; use
`npm install --registry=https://registry.npmjs.org` if installs fail.
