import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const dir = mkdtempSync(path.join(tmpdir(), "p6-acceptance-"));
process.env.FURLONG_RUNTIME_STATE_DIR = dir; process.env.REPORT_SIGNING_SECRET = "p6-smoke-secret-at-least-32-characters";
async function main() {
const m = await import("@/lib/acceptance/namedTesterAcceptance");
const c = m.recordAttestation({ testerEmail: "chudson@aresfarmsinc.com", verdict: "PASS", findings: [] });
let r = m.buildRollup(); if (r.p5Blocker.status !== "OPEN" || r.submittedTesters.length !== 1) throw new Error("One tester incorrectly closed the blocker.");
const s = m.recordAttestation({ testerEmail: "stuart@aresfarmsinc.com", verdict: "PASS_WITH_FINDINGS", findings: [{ category: "USABILITY", severity: "LOW", summary: "Navigation label should be clearer." }] });
r = m.buildRollup(); if (r.p5Blocker.status !== "CLOSED" || !r.signature || r.submittedTesters.length !== 2) throw new Error("Two valid attestations did not create a signed closeable rollup.");
if (c.testerEmail === s.testerEmail) throw new Error("Tester identities were not independent.");
rmSync(dir, { recursive: true, force: true }); console.log(JSON.stringify({ ok: true, targetRevision: r.targetRevision, blockerStatus: r.p5Blocker.status, signed: Boolean(r.signature) }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
