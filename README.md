# Accurova BNI — Gallery Hub

A single page listing every BNI event gallery (LuxSync-backed Google Drive
folders) with a search bar, plus an admin dashboard to add/edit/remove
galleries. Same function as [xymiku-site](../xymiku-site)'s gallery
archive + admin dashboard (`app/gallery`, `app/admin`), built as a
dependency-free static site instead of a Next.js app. Locally there's no
npm install or build step; the only build step that exists
(`scripts/build.js`) runs on Zeabur to inject env vars into `dist/config.js`
so the Supabase URL/key never need to be committed.

Styled white/red (BNI brand) rather than the dark void/teal global design
system — a deliberate per-project deviation.

## How it works

- **`index.html`** — public hub. Loads every row from the `galleries`
  Supabase table, renders a searchable grid of cards, and links each card to
  its LuxSync gallery page (lightbox/download built in) or an external URL.
  Image counts come straight from `image_count_cache` — index.html makes no
  LuxSync calls itself (see "Photo counts" below).
- **`admin.html`** — password-gated dashboard (Supabase Auth) with a form to
  add galleries and a table to edit/delete existing ones. The ID field
  auto-fills a slug from Name until edited by hand. The table's Images
  column shows each Drive-backed gallery's cached count with a per-row
  refresh button, plus a "Refresh all counts" button above the table.
- **`assets/luxsync.js`** — talks to the shared [LuxSync](https://github.com/TheBooleanJulian/luxsync-v3)
  instance for thumbnails, the gallery page URL, and (via `listDriveFolder`,
  called only from admin.html) image counts. This hub never stores or
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

## Photo counts

Counts for Drive-folder galleries are **cached, not live** — `image_count_cache`
on the `galleries` row, refreshed only when an admin clicks "Refresh"
(per-row) or "Refresh all counts" in `admin.html`. The public hub and the
rest of the admin table just read that cached value; nothing on `index.html`
calls LuxSync.

This is a deliberate choice over fetching live on every page view: LuxSync's
`/api/gallery` is rate-limited to 20/min, and a few concurrent visitors to a
live-fetching hub could exhaust that shared budget on their own. The
tradeoff is that counts go stale between refreshes — bump them by hand after
adding photos to a gallery's Drive folder, or periodically if you want to
stay current without thinking about it (no automatic/scheduled refresh is
wired up; that would need a service-role credential with table write
access, deliberately not added here to keep this a credential-light static
site — see git history if that tradeoff changes).

## Deployment

Zeabur Git-connected service, tracking `main`. `config.js` is gitignored
(it's per-deployment and the repo should stay portable), so instead
`scripts/build.js` runs as the Zeabur build step (`npm run build`, see
`package.json`) and copies `index.html`/`admin.html`/`assets/` into
`dist/`, writing `dist/config.js` from this service's environment
variables.

`zbpack.json`'s `output_dir: "dist"` is required, not optional — Zeabur's
builder (zbpack) treats any repo with a `package.json` as a Node.js app by
default, and without a declared `output_dir` it tries to run `dist/` as a
server rather than serve it as static files (this broke the first version
of this build step: a `package.json` with no `output_dir` deployed as a
Node server with no entry point and crash-looped). `output_dir` is what
keeps it in static file mode, served by Caddy like before.

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
