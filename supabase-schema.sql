-- Accurova BNI gallery hub schema.
-- Run this in the Supabase project's SQL editor (Database -> SQL Editor -> New query).
--
-- Photos are NOT stored here or in Supabase Storage. Each gallery just
-- points at the Google Drive folder its deliverables already live in.
-- LuxSync (https://github.com/TheBooleanJulian/luxsync-v3) is the shared
-- Drive-reading, image-caching layer — assets/luxsync.js calls its public
-- API to list/render a gallery's photos. This table only holds the
-- metadata LuxSync has no concept of.

create table if not exists galleries (
  id text primary key,
  name text not null,
  gallery_date date not null,
  status text not null default 'processing' check (status in ('online', 'processing', 'archived')),
  -- Nullable: a "processing" gallery may not have its Drive folder set up yet.
  drive_folder_id text,
  -- Optional manual pick for the hub card's cover photo. When unset, no
  -- cover is shown (unlike xymiku-site, this hub doesn't list the Drive
  -- folder client-side to find a fallback cover, to stay under LuxSync's
  -- rate limit on the public page).
  cover_drive_file_id text,
  -- Fallback link for galleries with no drive_folder_id yet (e.g. a preview
  -- gallery hosted elsewhere). Ignored once drive_folder_id is set — the
  -- card then always links to that folder's LuxSync gallery instead.
  external_url text,
  -- Vertical crop bias for the cover photo in its fixed-aspect card box.
  cover_position text not null default 'center' check (cover_position in ('top', 'center', 'bottom')),
  -- Manual image count for galleries with no drive_folder_id — there's no
  -- API to count those automatically. Leave unset to hide the count.
  image_count_override int,
  created_at timestamptz not null default now()
);

-- Public archive: anyone can read. Writes only from a signed-in Supabase
-- Auth user whose email matches ADMIN_EMAIL below (admin.html) — never from
-- the anon key alone.
alter table galleries enable row level security;

create policy "public read galleries" on galleries for select using (true);

-- Replace ADMIN_EMAIL with the email of the account(s) that should be able
-- to use admin.html. Create that user in Supabase Auth -> Users -> Add user
-- (do NOT enable public sign-ups). To allow more than one admin, change
-- this to: auth.jwt() ->> 'email' = ANY(array['a@x.com', 'b@x.com'])
create policy "admin write galleries" on galleries for all
  using (auth.jwt() ->> 'email' = 'ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'ADMIN_EMAIL');
