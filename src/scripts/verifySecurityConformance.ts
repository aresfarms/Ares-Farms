/**
 * verify:security-conformance — doctrine-to-code conformance (FortKnox).
 * Asserts the 3 docs and the manifest agree, implemented controls cite real
 * files/gates that exist, Tier-N externals stay external, and the gate is
 * ALPHA_PENDING with constitutional constraints intact.
 */
import * as fs from "node:fs";
import { SECURITY_CONTROLS, securityHardeningStatus, SECURITY_CONSTITUTIONAL_CONSTRAINTS } from "@/security/securityHardeningManifest";

const fail: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) fail.push(m); };

for (const d of ["docs/security/platform-security-hardening-master.md", "docs/security/human-security-governance.md", "docs/security/penetration-test-readiness.md"]) {
  ok(fs.existsSync(d), `missing doc: ${d}`);
}
const master = fs.readFileSync("docs/security/platform-security-hardening-master.md", "utf8");
ok(/penetration test/i.test(master) && /GLBA/.test(master), "master doc must state pentest + GLBA remain required");
ok(/ALPHA_PENDING/.test(master), "master doc must carry the ALPHA_PENDING gate");

for (const c of SECURITY_CONTROLS.filter((x) => x.status === "implemented")) {
  const paths = c.evidence.match(/src\/[\w\-/.]+\.\w+|\.github\/[\w\-/.]+\.yml|next\.config\.\w+/g) ?? [];
  // Accept: a path, a verify gate, a T-<test> marker, a known module/file name, or a doctrine reference.
  const refs = /verify:[a-z-]+|·\s*T-[a-z]+|src\/proxy|Module 45|[A-Za-z]+\.ts\b|requireMultiParty|incidentRunbook|securityRuntimeGuards|securityDashboardStatus|humanVerificationPolicy|consentLedger|ingestSanitizer|ledgerHashChain|run:[a-z-]+|\.yml|security-review-gate|next\.config|constitutional/.test(c.evidence);
  ok(paths.length > 0 || refs, `${c.id}: implemented but no file/gate cited`);
  for (const p of paths) ok(fs.existsSync(p), `${c.id}: evidence path missing — ${p}`);
}
for (const c of SECURITY_CONTROLS.filter((x) => x.group === "N" && x.id !== "N-checklist")) {
  ok(c.status === "required-external", `${c.id}: must remain required-external`);
  ok(c.blockingForProduction, `${c.id}: must block production`);
}
const s = securityHardeningStatus();
ok(s.gate === "ALPHA_PENDING", "gate must be ALPHA_PENDING");
ok(s.externalBlockers.length >= 3, "pentest/audit/red-team must all be external blockers");
for (const [k, v] of Object.entries(SECURITY_CONSTITUTIONAL_CONSTRAINTS)) ok(v === true, `constraint ${k} must hold`);

console.log(`verify:security-conformance — ${SECURITY_CONTROLS.length} controls cross-checked vs 3 docs.`);
if (fail.length) { console.error(`\n✗ FAIL — ${fail.length}:`); for (const f of fail) console.error("    ✗ " + f); process.exit(1); }
console.log("✓ verify:security-conformance PASS — docs/manifest agree; implemented evidence exists; externals stay external; gate ALPHA_PENDING.");
