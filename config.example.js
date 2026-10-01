// Copy this file to config.js and fill in your values, then deploy both.
// config.js is gitignored — these are per-deployment values, not secrets
// (the Supabase anon key is safe to ship to the browser; row-level-security
// policies in supabase-schema.sql are what actually gate writes, not this
// key — same approach xymiku-site uses for lib/supabase.ts).

export const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";

// LuxSync (https://github.com/TheBooleanJulian/luxsync-v3) is the shared
// Drive-reading, image-caching layer. This hub never stores photo bytes —
// each gallery row just points at a Drive folder id, and LuxSync serves the
// thumbnails/full images and the actual browsing/lightbox/download page.
export const LUXSYNC_URL = "https://luxsync-v3.thebooleanjulian.dev";
