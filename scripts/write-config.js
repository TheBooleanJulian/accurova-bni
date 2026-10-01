// Zeabur build step — writes config.js from this service's environment
// variables so the Supabase URL/key and LuxSync URL never need to be
// committed to the repo. Runs via `npm run build` (see package.json).
// Local dev doesn't need this: just copy config.example.js to config.js by
// hand, same as before.
const fs = require("fs");
const path = require("path");

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`write-config: missing required env var(s): ${missing.join(", ")}`);
  process.exit(1);
}

const luxsyncUrl = process.env.LUXSYNC_URL || "https://luxsync-v3.thebooleanjulian.dev";

const contents = `// Generated at build time by scripts/write-config.js from this service's
// Zeabur environment variables. Do not edit directly — edit the env vars
// instead (Zeabur dashboard -> service -> Variables) and redeploy.
export const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_ANON_KEY)};
export const LUXSYNC_URL = ${JSON.stringify(luxsyncUrl)};
`;

fs.writeFileSync(path.join(__dirname, "..", "config.js"), contents);
console.log("write-config: wrote config.js");
