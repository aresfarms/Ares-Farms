import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v: unknown, m: string): asserts v {
  if (!v) throw new Error(m);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-steady-"),
  );
  const m = await import("@/lib/property/officialEvidenceSteadyStateIncident");
  const none = m.openSteadyStateIncident({
    executionId: "healthy",
    finalPacketId: "p1",
    failedJobIds: [],
    blockedJobIds: [],
  });
  ok(none === null, "Healthy execution must not open incident.");
  const opened = m.openSteadyStateIncident({
    executionId: "e1",
    finalPacketId: "p1",
    failedJobIds: ["j1"],
    blockedJobIds: [],
    at: "2026-07-25T22:00:00Z",
  });
  ok(opened?.action === "OPEN", "Failure must open incident.");
  m.decideSteadyStateIncident({
    incidentId: opened!.incidentId,
    action: "ACKNOWLEDGE",
    actorId: "op",
    actorName: "Operator",
    reason: "Investigating.",
  });
  ok(
    m.openSteadyStateIncidents().length === 1,
    "Acknowledged incident remains open.",
  );
  m.decideSteadyStateIncident({
    incidentId: opened!.incidentId,
    action: "RESOLVE",
    actorId: "op",
    actorName: "Operator",
    reason: "Corrected and verified.",
  });
  ok(
    m.openSteadyStateIncidents().length === 0,
    "Resolved incident must close.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-STEADY-STATE-INCIDENT-001",
        receipts: m.listSteadyStateIncidentReceipts().map((x) => x.action),
      },
      null,
      2,
    ),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
