# Accurova BNI — Gallery Hub

A single page listing every BNI event gallery (LuxSync-backed Google Drive
folders) with a search bar, plus an admin dashboard to add/edit/remove
galleries. Same function as [xymiku-site](../xymiku-site)'s gallery
archive + admin dashboard (`app/gallery`, `app/admin`), built as a
dependency-free static site instead of a Next.js app. Locally there's no
npm install or build step; the only build step that exists
(`scripts/write-config.js`) runs on Zeabur to inject env vars into
`config.js` so the Supabase URL/key never need to be committed.

## How it works

- **`index.html`** — public hub. Loads every row from the `galleries`
  Supabase table, renders a searchable grid of cards, and links each card to
  its LuxSync gallery page (lightbox/download built in) or an external URL.
- **`admin.html`** — password-gated dashboard (Supabase Auth) with a form to
  add galleries and a table to edit/delete existing ones.
- **`assets/luxsync.js`** — talks to the shared [LuxSync](https://github.com/TheBooleanJulian/luxsync-v3)
  instance for thumbnails and the gallery page URL. This hub never stores or
  serves photo bytes itself.
- **`assets/supabase-client.js` / `assets/galleries.js`** — thin Supabase
  client + row-to-view mapping, mirroring `xymiku-site/lib/data.ts`.
- **`supabase-schema.sql`** — the `galleries` table + row-level-security
  policies (public read, admin-only write).

## Setup

1. **Create a Supabase project** (dedicated to this app — kept separate from
   xymiku-site's project so BNI data and admin users don't mix with
   XYMIKU39's).
2. In the Supabase SQL editor, run `supabase-schema.sql`. Before running,
   replace `ADMIN_EMAIL` in the last policy with the email of the account
   that should be able to use `admin.html`.
3. In Supabase Auth → Users, add that user manually (do **not** enable
   public sign-ups).
4. Copy `config.example.js` to `config.js` and fill in:
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — from Supabase project settings →
     API. The anon key is safe to ship to the browser; RLS policies in
     `supabase-schema.sql` are what actually gate writes.
   - `LUXSYNC_URL` — defaults to the shared `luxsync-v3` instance; only
     change this if galleries should be served from a different LuxSync
     deployment.
5. Open `index.html` directly, or serve the folder with any static file
   server (e.g. `python -m http.server`) for local testing — ES module
   imports require `http(s)://`, not `file://`.

## Adding a gallery

Via `admin.html`, sign in and fill in the "Add gallery" form:

| Field | Notes |
|---|---|
| ID (slug) | Primary key, e.g. `2026-03-networking-mixer` |
| Name | Displayed on the card |
| Date | Used for sort order and the displayed date |
| Status | `online` / `processing` (not yet indexed) / `archived` |
| Drive folder ID | The Google Drive folder ID the deliverables live in. Leave blank if not organized into Drive yet. |
| Cover Drive file ID | Optional — picks a specific file as the card's cover photo |
| External URL | Fallback link used only while Drive folder ID is unset |
| Cover crop | Vertical crop bias (`center`/`top`/`bottom`) for the cover image |
| # override | Manual image count, only meaningful when there's no Drive folder |

Once a Drive folder ID is set, the card always links to that folder's
LuxSync gallery page, regardless of what External URL holds.

## Deployment

Zeabur Git-connected service, tracking `main`. `config.js` is gitignored
(it's per-deployment and the repo should stay portable), so instead
`scripts/write-config.js` runs as the Zeabur build step (`npm run build`,
see `package.json`) and writes `config.js` from this service's environment
variables right before the static files are served.

Set these in the Zeabur dashboard (service → Variables):

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | From Supabase project settings → API |
| `SUPABASE_ANON_KEY` | yes | The publishable/anon key — safe to expose client-side |
| `LUXSYNC_URL` | no | Defaults to the shared `luxsync-v3` instance |

The build fails loudly (non-zero exit) if `SUPABASE_URL` or
`SUPABASE_ANON_KEY` is missing, so a misconfigured service won't silently
deploy a broken site.

## Dependencies

- [`@supabase/supabase-js`](https://github.com/supabase/supabase-js) v2,
  loaded from `esm.sh` at runtime — no npm install. Already used elsewhere
  in the fleet (xymiku-site), not a new dependency to maintain.
- Google Fonts (Space Grotesk, JetBrains Mono) per the global design system.

No runtime frameworks. `package.json` exists only to give Zeabur a `build`
script to run (`scripts/write-config.js`, stdlib Node, no dependencies) —
it's not installing or bundling anything.
