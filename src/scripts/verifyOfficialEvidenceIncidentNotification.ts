import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function ok(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-incident-notification-"),
  );
  const incidents =
    await import("@/lib/property/officialEvidenceSteadyStateIncident");
  const sla = await import("@/lib/property/officialEvidenceIncidentSla");
  const notifications =
    await import("@/lib/property/officialEvidenceIncidentNotification");

  const incident = incidents.openSteadyStateIncident({
    executionId: "execution-notify-1",
    finalPacketId: "packet-notify-1",
    failedJobIds: [],
    blockedJobIds: ["blocked-1"],
    at: "2026-07-25T10:00:00Z",
  });
  ok(incident, "Incident must open.");
  const assignment = sla.assignIncidentSla(incident);
  const created = notifications.syncIncidentNotificationPackets(
    "2026-07-25T10:00:01Z",
  );
  ok(created.length === 1, "Assignment must create one notification.");
  ok(
    created[0].slaReceiptId === assignment.receiptId,
    "Packet must bind SLA receipt.",
  );

  const delivered = notifications.deliverPendingIncidentNotifications({
    at: "2026-07-25T10:00:02Z",
  });
  ok(
    delivered.map((r) => r.action).join(",") === "DELIVERY_ATTEMPT,DELIVERED",
    "Delivery must record attempt and success.",
  );
  const second = notifications.deliverPendingIncidentNotifications({
    at: "2026-07-25T10:00:03Z",
  });
  ok(second.length === 0, "Delivered notification must not redeliver.");

  const notificationId = created[0].notificationId;
  notifications.acknowledgeIncidentNotification({
    notificationId,
    actorId: "module45-1",
    actorName: "Module 45 Reviewer",
    reason: "Reviewed the P1 assignment.",
    at: "2026-07-25T10:00:04Z",
  });
  ok(
    notifications.pendingIncidentNotifications().length === 0,
    "Acknowledged notification must leave no pending item.",
  );

  sla.evaluateIncidentSlaBreaches("2026-07-25T10:16:00Z");
  notifications.syncIncidentNotificationPackets("2026-07-25T10:16:01Z");
  let failed = false;
  const attempts = notifications.deliverPendingIncidentNotifications({
    at: "2026-07-25T10:16:02Z",
    deliver: () => {
      failed = true;
      throw new Error("Internal queue unavailable.");
    },
  });
  ok(failed, "Failure adapter must be invoked.");
  ok(
    attempts.some((r) => r.action === "DELIVERY_FAILED"),
    "Failed delivery must be recorded.",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-INCIDENT-NOTIFICATION-001",
        actions: notifications
          .listIncidentNotificationReceipts()
          .map((r) => r.action),
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
