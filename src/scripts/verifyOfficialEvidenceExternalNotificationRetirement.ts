import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-retire-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = root;
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dryRun = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const reinstatement = await import("../lib/property/officialEvidenceExternalNotificationReinstatement");

  const registration = connector.registerExternalNotificationConnector({
    connectorId: "retirement-email",
    channel: "EMAIL",
    implementationHash: "c".repeat(64),
    replayEvidence: "synthetic replay evidence",
    at: "2026-07-25T23:00:00Z",
  });
  connector.decideExternalNotificationConnector({
    registrationId: registration.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic approval for retirement verification.",
    at: "2026-07-25T23:01:00Z",
  });
  dryRun.runExternalNotificationDryRun({
    connectorId: registration.connectorId,
    notificationId: "retirement-dry-run",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-25T23:02:00Z",
    send: () => ({ accepted: true, reference: "synthetic" }),
    at: "2026-07-25T23:02:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic activation for retirement verification.",
    at: "2026-07-25T23:03:00Z",
  });

  assert.throws(() => retirement.retireExternalNotificationConnector({
    registrationId: registration.registrationId,
    classification: "OPERATOR_DECOMMISSION",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Premature retirement must fail.",
  }));

  const revocation = activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "REVOKE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Explicitly revoked before permanent retirement.",
    at: "2026-07-25T23:04:00Z",
  });
  const receipt = retirement.retireExternalNotificationConnector({
    registrationId: registration.registrationId,
    classification: "OPERATOR_DECOMMISSION",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Connector registration permanently decommissioned.",
    at: "2026-07-25T23:05:00Z",
  });

  assert.equal(receipt.revocationReceiptId, revocation.receiptId);
  assert.equal(retirement.externalNotificationRegistrationRetired(registration.registrationId), true);
  assert.throws(() => dryRun.runExternalNotificationDryRun({
    connectorId: registration.connectorId,
    notificationId: "post-retirement-dry-run",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-25T23:06:00Z",
    send: () => ({ accepted: true }),
  }));
  assert.throws(() => activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Retired registration cannot reactivate.",
  }));
  assert.throws(() => reinstatement.reinstateExternalNotificationConnector({
    registrationId: registration.registrationId,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Retired registration cannot reinstate.",
  }));

  const replacement = connector.registerExternalNotificationConnector({
    connectorId: registration.connectorId,
    channel: "EMAIL",
    implementationHash: "d".repeat(64),
    replayEvidence: "fresh replacement replay evidence",
    at: "2026-07-25T23:07:00Z",
  });
  assert.notEqual(replacement.registrationId, registration.registrationId);
  assert.equal(retirement.externalNotificationRegistrationRetired(replacement.registrationId), false);

  console.log(JSON.stringify({
    ok: true,
    rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-RETIREMENT-001",
    action: receipt.action,
    classification: receipt.classification,
    oldRegistrationLocked: true,
    replacementRequiresFreshRegistration: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
