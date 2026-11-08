// Zeabur build step — copies the static files into dist/ and writes
// dist/config.js from this service's environment variables, so the
// Supabase URL/key never need to be committed to the repo. Runs via
// `npm run build` (see package.json + zbpack.json's output_dir: "dist").
//
// zbpack.json's output_dir is what keeps this service in Zeabur's static
// file mode (served by Caddy) instead of being run as a Node.js server —
// without it, a bare package.json makes Zeabur assume this is a Node app
// and try to start a server entry point that doesn't exist.
//
// Local dev doesn't need any of this: just copy config.example.js to
// config.js by hand and open index.html/admin.html directly.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`build: missing required env var(s): ${missing.join(", ")}`);
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of ["index.html", "admin.html", "assets"]) {
  fs.cpSync(path.join(root, entry), path.join(dist, entry), { recursive: true });
}

const luxsyncUrl = process.env.LUXSYNC_URL || "https://luxsync-v3.thebooleanjulian.dev";

const configContents = `// Generated at build time by scripts/build.js from this service's Zeabur
// environment variables. Do not edit directly — edit the env vars instead
// (Zeabur dashboard -> service -> Variables) and redeploy.
export const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_ANON_KEY)};
export const LUXSYNC_URL = ${JSON.stringify(luxsyncUrl)};
`;

fs.writeFileSync(path.join(dist, "config.js"), configContents);
console.log("build: wrote dist/ (index.html, admin.html, assets/, config.js)");
