import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function ok(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-external-notify-"),
  );
  const connectors =
    await import("@/lib/property/officialEvidenceExternalNotificationConnector");
  const first = connectors.registerExternalNotificationConnector({
    connectorId: "ops-email",
    channel: "EMAIL",
    implementationHash: "a".repeat(64),
    replayEvidence: "signed replay one",
    at: "2026-07-25T22:20:00Z",
  });
  ok(
    !connectors.externalNotificationDeliveryPermitted("EMAIL"),
    "Registration alone must not permit delivery.",
  );
  connectors.decideExternalNotificationConnector({
    registrationId: first.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Reviewed credentials, delivery semantics, and replay evidence.",
    at: "2026-07-25T22:21:00Z",
  });
  ok(
    connectors.externalNotificationDeliveryPermitted("EMAIL"),
    "Current approved implementation should permit channel use.",
  );
  const second = connectors.registerExternalNotificationConnector({
    connectorId: "ops-email",
    channel: "EMAIL",
    implementationHash: "b".repeat(64),
    replayEvidence: "signed replay two",
    at: "2026-07-25T22:22:00Z",
  });
  ok(
    !connectors.externalNotificationDeliveryPermitted("EMAIL"),
    "Implementation drift must revoke prior approval.",
  );
  let staleBlocked = false;
  try {
    connectors.decideExternalNotificationConnector({
      registrationId: first.registrationId,
      decision: "APPROVE",
      actorId: "m45",
      actorName: "Module 45",
      reason: "stale",
      at: "2026-07-25T22:23:00Z",
    });
  } catch {
    staleBlocked = true;
  }
  ok(staleBlocked, "Stale implementation approval must be blocked.");
  connectors.decideExternalNotificationConnector({
    registrationId: second.registrationId,
    decision: "SUSPEND",
    actorId: "m45",
    actorName: "Module 45",
    reason: "External delivery remains disabled.",
    at: "2026-07-25T22:24:00Z",
  });
  ok(
    !connectors.externalNotificationDeliveryPermitted("EMAIL"),
    "Suspended current implementation must remain disabled.",
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-CONNECTOR-001",
        staleBlocked,
        approved: connectors.approvedExternalNotificationConnectors().length,
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
