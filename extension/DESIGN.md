# Nowaster browser extension — design

Status: draft. Branch: `main`.

## Decisions

| Area | Decision |
| --- | --- |
| Browsers | Chrome and Firefox (Manifest V3, one codebase via WXT) |
| Auth | Personal API token created in web settings, sent as `X-API-Key` |
| Block list | One global list per user, stored in a new `block_rule` table |
| Sessions | Quick start creates a stopwatch session with category, tags, project and task |
| Styling | Dark-only, mirrors the web app's design tokens (see below) |

## Auth

- The user creates a token in Settings → Tokens (`POST /auth/tokens`, with optional `expiresInDays`).
- The extension's options page stores the token in `chrome.storage.local` and sends it as the `X-API-Key` header.
- Tokens grant full account access. The options page must say so and link to token revocation.
- Revoking a token in settings invalidates the extension immediately, because each request is checked against `api_tokens`.

## Backend changes

- **CORS:** `allow_origin` only permits the frontend URL and `*.nowaster.app`. Extension requests are expected to bypass CORS through `host_permissions` (see Still to verify).
- **Finish endpoint:** `POST /session/stopwatch/{id}/finish` with body `{ "endTime": <RFC3339, optional> }` returns `{status, data}` where `data` is the created fixed session.
- **Block list:** migration for `block_rule` (`id`, `user_id`, `pattern`, `created_at`, unique on `(user_id, pattern)`), CRUD routes, and a settings page. Run `cargo sqlx prepare` after adding queries.

## Data used

- Categories and tags: `/category`, `/tag` (tags carry `allowed_categories`; both have `last_used_at`).
- Projects and tasks: `/project`, `/task`.
- Sessions: `GET/POST/PATCH /session/stopwatch`, `POST /session/stopwatch/{id}/finish`.
- Templates: `/session/template`.

## Styling

Mirror the web app so the extension reads as part of the same product.

- **Theme:** dark only. The web app has no light theme, so none is needed.
- **Tokens:** copy the HSL variables from `next-frontend/styles/globals.css` (`--background`, `--foreground`, `--primary` pink `322 65% 48%`, `--purple-primary` `262 60% 45%`, `--card`, `--border`, `--muted-foreground`, `--radius: 0.5rem`) into one `tokens.css` in the extension. Don't import `globals.css` directly because it is wired to Next and its Tailwind config.
- **Accents:** the pink-to-purple gradient (`--gradient-primary`) for the primary action and the active-session card. Keep it to one or two places per screen.
- **Font:** Inter, loaded with `@fontsource/inter` (self-hosted, since extension pages cannot load Google Fonts at runtime without CSP changes).
- **Stack:** Tailwind v4, `class-variance-authority`, `tailwind-merge`, `lucide-react` icons. Copy the shadcn primitives the extension needs (button, input, badge, card, switch, dialog, command for the tag picker). Copy rather than share, since the two builds differ and there is no shared package.
- **Popup:** about 360px wide, scrollable, with the active session pinned at the top.
- **Options page:** full width, same primitives. Holds the token field, the block list and the account section.
- **Motion:** keep it restrained. Use the existing `pulse` keyframe for the live-timer dot and nothing else.

## Behaviour decisions

- **Toolbar badge:** shows elapsed time while a session runs (`45m`, then `1h05`), since the badge text is limited to about four characters. A `chrome.alarms` tick updates it once a minute. The badge clears when the session stops.
- **Stop:** single click, no confirmation, one call: `POST /session/stopwatch/{id}/finish` with the end time the user sees (now). On success, or on 404 (the session is already gone, for example stopped in the web app), the extension clears its local session. Any other error keeps the session active locally and shows an error in the popup so the user can retry. Sessions keep their start and end times and stay editable in the web app.
- **Start while active:** the Start button is disabled while a session is active, with the note "Stop the current session to start another". This assumes the backend rejects a second active stopwatch (not confirmed; if concurrent sessions are allowed this is a follow-up).
- **Site access (all sites at install):** `host_permissions` is `<all_urls>`, granted once at install. The extension never calls `permissions.request`, so there are no per-site prompts. Trade-off: the extension can reach every site, which is broader than the minimum needed. Blocking alone would not need it; redirecting to `focus.html` does. This was chosen for UX over least privilege.
- **Redirect per rule:** when a session starts, every block pattern becomes a `redirect` rule to `focus.html`. `focus.html` stays in `web_accessible_resources`, which Firefox needs for redirects.

## Still to verify

- **CORS for extension fetches (investigated from the extension side, not yet run against the real server).**
  Conclusion: no backend CORS change is needed as long as the extension holds a host permission for the API origin.
  - Chrome MV3: `fetch` from the service worker and from extension pages (popup, options, focus) to an origin covered by `host_permissions` is exempt from CORS checks (no preflight, response readable). Only content scripts are still subject to CORS, and this extension has none. The request carries `Origin: chrome-extension://<id>`, but the Rust `CorsLayer` only adds response headers and never rejects by origin, so the server is unaffected.
  - Firefox MV3: same rule for background and extension pages. `<all_urls>` is granted at install, so extension fetches to the API (production or a dev override) skip CORS. If a user revokes host access in Firefox, requests fall back to normal CORS with `Origin: moz-extension://<uuid>`, which the backend allows in local and sandbox only.
  - Chrome host access for redirects: a `redirect` action needs host access to the request URL, which `<all_urls>` provides; a `block` action would not. Not yet run in a real browser; verify that a listed site redirects to the focus page in Chrome and Firefox.
  - Narrower host access (optional per-domain grants) was considered and rejected for UX. See Site access above.
  - Firefox CORS fallback (allow `chrome-extension://*` and `moz-extension://*`) is still relevant if the user denies the API host permission; keep it as the backend fallback. Confidence: Chrome about 90%, Firefox about 80%. Verify with one real request from the built extension in each browser (Test connection button) before releasing.
- **Finish endpoint:** `POST /session/stopwatch/{id}/finish` replaces the earlier two-call flow (`POST /session/fixed` then `DELETE`), which was not atomic. It is added by the backend in parallel and has been tested here only against a stubbed `fetch` in unit tests, not a live server.
- **Read DTO casing:** `ReadCategoryDto` and `ReadTagDetailsDto` serialise `last_used_at` (snake_case) but `allowedCategories` (camelCase). The extension reads `last_used_at`.
