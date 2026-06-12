/**
 * verify:secret-scan — local secret-pattern gate (Tier 1A).
 * Lightweight complement to CI gitleaks: scans tracked source/config for
 * common credential shapes. Fails on any hit. Patterns are conservative
 * (high-signal) to avoid false-positive fatigue.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";

const PATTERNS: Array<[string, RegExp]> = [
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["Private key block", /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{36,}/],
  ["Stripe live secret", /sk_live_[A-Za-z0-9]{20,}/],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["Generic assigned secret", /(api[_-]?key|secret|password)\s*[:=]\s*["'][A-Za-z0-9+/]{24,}["']/i],
];

// Test-fixture allowlist — files whose PURPOSE is to contain credential-shaped
// strings as detector inputs (each justified; anything else stays scanned):
const FIXTURE_ALLOWLIST = new Set([
  "src/scripts/verifyNoPersonalDocsSmokeTest.ts", // PEM block is the detector's test input
  "src/scripts/authActivationPolicySmokeTest.ts", // fake secret exercises the auth policy
]);

const files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !/\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|woff2?)$/i.test(f))
  .filter((f) => !FIXTURE_ALLOWLIST.has(f));

const hits: string[] = [];
for (const f of files) {
  let src = "";
  try { src = fs.readFileSync(f, "utf8"); } catch { continue; }
  for (const [name, re] of PATTERNS) {
    if (re.test(src)) hits.push(`${f}: ${name}`);
  }
}
console.log(`verify:secret-scan — ${files.length} tracked files scanned.`);
if (hits.length) {
  console.error(`\n✗  FAIL — possible secrets:`);
  for (const h of hits) console.error(`    ✗ ${h}`);
  process.exit(1);
}
console.log("✓  verify:secret-scan PASS — no credential-shaped content in tracked files.");
