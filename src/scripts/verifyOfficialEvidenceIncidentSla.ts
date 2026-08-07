import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-incident-sla-"),
  );
  const incidents =
    await import("@/lib/property/officialEvidenceSteadyStateIncident");
  const sla = await import("@/lib/property/officialEvidenceIncidentSla");
  const opened = incidents.openSteadyStateIncident({
    executionId: "steady-sla-1",
    finalPacketId: "packet-sla-1",
    failedJobIds: [],
    blockedJobIds: ["blocked-1"],
    at: "2026-07-25T20:00:00Z",
  });
  ok(opened, "A blocked execution must open an incident.");
  const assigned = sla.assignIncidentSla(opened);
  ok(assigned.severity === "P1", "Blocked jobs must receive P1 severity.");
  ok(
    assigned.acknowledgeBy === "2026-07-25T20:15:00.000Z",
    "P1 acknowledgment target must be 15 minutes.",
  );
  const breaches = sla.evaluateIncidentSlaBreaches("2026-07-25T20:16:00Z");
  ok(
    breaches.some((row) => row.action === "ACK_BREACH"),
    "Missed acknowledgment must breach.",
  );
  incidents.decideSteadyStateIncident({
    incidentId: opened.incidentId,
    action: "ACKNOWLEDGE",
    actorId: "module45",
    actorName: "Module 45",
    reason: "Incident accepted for investigation.",
    at: "2026-07-25T20:17:00Z",
  });
  const later = sla.evaluateIncidentSlaBreaches("2026-07-26T00:01:00Z");
  ok(
    later.some((row) => row.action === "RESOLUTION_BREACH"),
    "Missed P1 resolution target must breach.",
  );
  ok(
    sla.listIncidentSlaReceipts().filter((row) => row.action === "ACK_BREACH")
      .length === 1,
    "Breach receipts must be idempotent.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-INCIDENT-SLA-001",
        severity: assigned.severity,
        actions: sla.listIncidentSlaReceipts().map((row) => row.action),
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
