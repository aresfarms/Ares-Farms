import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const dir = mkdtempSync(path.join(tmpdir(), "p6-acceptance-"));
process.env.FURLONG_RUNTIME_STATE_DIR = dir;
process.env.REPORT_SIGNING_SECRET = "p6-smoke-secret-at-least-32-characters";
process.env.NAMED_TESTER_ACCEPTANCE_BACKEND = "memory-test";
async function main() {
  const m = await import("@/lib/acceptance/namedTesterAcceptance");
  await m.recordAttestation({ testerEmail: "chudson@aresfarmsinc.com", verdict: "PASS", findings: [] });
  const r = await m.buildRollup();
  if (r.p5Blocker.status !== "CLOSED" || !r.signature || r.submittedTesters.length !== 1) throw new Error("Owner staging acceptance did not create a signed closeable rollup.");
  let duplicateBlocked = false;
  try { await m.recordAttestation({ testerEmail: "chudson@aresfarmsinc.com", verdict: "PASS", findings: [] }); } catch { duplicateBlocked = true; }
  if (!duplicateBlocked) throw new Error("Immutable owner attestation accepted a duplicate submission.");
  rmSync(dir, { recursive: true, force: true });
  console.log(JSON.stringify({ ok: true, targetRevision: r.targetRevision, blockerStatus: r.p5Blocker.status, signed: Boolean(r.signature), ownerTesterCount: r.submittedTesters.length, duplicateBlocked }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
