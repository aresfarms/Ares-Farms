/**
 * verify:repo-secrets — asserts the repo contains NO real secrets (GCP
 * readiness §6). Scans git-TRACKED files for common live-credential patterns
 * and confirms the secret-bearing files are gitignored. Documented secret
 * NAMES (e.g. DATABASE_URL) are expected; secret VALUES are not.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

const SECRET_PATTERNS: [RegExp, string][] = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key material"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key id"],
  [/\bsk_live_[0-9a-zA-Z]{20,}\b/, "Stripe live secret key"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "Google API key"],
  [/\bghp_[0-9A-Za-z]{36}\b/, "GitHub personal access token"],
  [/"private_key_id"\s*:/, "GCP service-account JSON"],
  [/\bpostgres(?:ql)?:\/\/[^\s"']+:[^\s"'@]+@(?!localhost|127\.0\.0\.1|db:)/, "non-local DB URL with embedded password"],
];

// Deliberate SYNTHETIC fixtures (tests that prove secrets are REFUSED) — each
// entry must be a test/verifier file, reviewed before adding.
const FIXTURE_ALLOWLIST = new Set([
  "src/scripts/verifyRepoSecrets.ts",          // the pattern definitions themselves
  "src/scripts/verifyNoPersonalDocsSmokeTest.ts", // synthetic '-----BEGIN RSA PRIVATE KEY-----\\nABCD...' refusal fixture
]);

const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !/\.(png|jpg|jpeg|webp|ico|pdf|geojson|ndjson|csv|svg|woff2?)$/i.test(f))
  // Archived THIRD-PARTY page snapshots (image-rights evidence) legitimately
  // contain those sites' own public client keys — not Furlong secrets.
  .filter((f) => !f.startsWith("docs/image-rights-evidence/"))
  // .example files document secret NAMES with placeholder values by design.
  .filter((f) => !/\.example$/.test(f));

let scanned = 0;
for (const f of tracked) {
  let body = "";
  try { body = fs.readFileSync(f, "utf8"); } catch { continue; }
  scanned++;
  if (FIXTURE_ALLOWLIST.has(f)) continue;
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(body)) fail.push(`${label} pattern found in tracked file: ${f}`);
  }
}

// Secret-bearing files must be gitignored, and none may be tracked.
const gitignore = fs.existsSync(".gitignore") ? fs.readFileSync(".gitignore", "utf8") : "";
ok(/\.env/.test(gitignore), ".env* is gitignored");
ok(!tracked.some((f) => /^\.env(\..+)?$/.test(f) && !/\.example$/.test(f)), "no .env file is git-tracked");
ok(!tracked.some((f) => /service-account.*\.json$/i.test(f)), "no service-account JSON is git-tracked");

if (fail.length) {
  console.error(`\n✗  verify:repo-secrets FAIL — ${fail.length}:`);
  for (const f of fail) console.error("    ✗ " + f);
  process.exit(1);
}
console.log(`✓  verify:repo-secrets PASS — ${scanned} tracked files scanned, no live-credential patterns; .env gitignored and untracked; no service-account JSON tracked.`);
process.exit(0);
