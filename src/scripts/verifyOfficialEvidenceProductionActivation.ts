import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-production-activation-"));
  process.env.EVIDENCE_REPLAY_SIGNING_SECRET = "activation-test-secret";
  const production = await import("@/lib/property/officialEvidenceProductionRecomputationHandlers");
  const activation = await import("@/lib/property/officialEvidenceRecomputationActivation");
  const registry = await import("@/lib/property/officialEvidenceRecomputationHandlerRegistry");
  production.ensureProductionRecomputationBindings("2026-07-25T19:00:00Z");
  const first = registry.listGovernedRecomputationHandlers();
  ok(first.length === 4, "Four production handlers must be durably initialized.");
  production.ensureProductionRecomputationBindings("2026-07-25T19:01:00Z");
  ok(registry.listGovernedRecomputationHandlers().length === 4, "Rebinding after restart must be idempotent.");
  const state = activation.evidenceRecomputationActivationStatus();
  ok(!state.ready, "Scheduler activation must remain blocked before replay proof and approval.");
  ok(state.details.every((item) => item.registered && item.status === "pending" && !item.ready), "Every production binding must begin pending.");
  console.log(JSON.stringify({ ok:true, rule:"OFFICIAL-EVIDENCE-PRODUCTION-ACTIVATION-001", ready:state.ready, handlers:state.details }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
