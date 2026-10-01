// Shared Supabase client — used read-only by index.html (public hub) and
// read/write by admin.html once signed in. Loaded from esm.sh so there's no
// npm install / build step, matching this project's single-file-tools setup.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR-PROJECT")) {
  throw new Error(
    "Missing Supabase config. Copy config.example.js to config.js and fill in SUPABASE_URL / SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
