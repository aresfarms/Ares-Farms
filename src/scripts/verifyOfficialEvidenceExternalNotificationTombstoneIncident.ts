import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-tombstone-incident-"),
  );
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dryRun = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const closure = await import("../lib/property/officialEvidenceExternalNotificationRetirementClosure");
  const tombstone = await import("../lib/property/officialEvidenceExternalNotificationRetirementTombstone");
  const incident = await import("../lib/property/officialEvidenceExternalNotificationTombstoneIncident");

  const registration = connector.registerExternalNotificationConnector({
    connectorId: "incident-email",
    channel: "EMAIL",
    implementationHash: "f".repeat(64),
    replayEvidence: "synthetic",
    at: "2026-07-26T02:00:00Z",
  });
  connector.decideExternalNotificationConnector({
    registrationId: registration.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic approval.",
    at: "2026-07-26T02:01:00Z",
  });
  dryRun.runExternalNotificationDryRun({
    connectorId: registration.connectorId,
    notificationId: "incident-dry-run",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-26T02:02:00Z",
    send: () => ({ accepted: true, reference: "synthetic" }),
    at: "2026-07-26T02:02:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic activation.",
    at: "2026-07-26T02:03:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "REVOKE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic revocation.",
    at: "2026-07-26T02:04:00Z",
  });
  retirement.retireExternalNotificationConnector({
    registrationId: registration.registrationId,
    classification: "SECURITY_RETIREMENT",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic retirement.",
    at: "2026-07-26T02:05:00Z",
  });
  closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "cred-revoked",
    providerCallbackDisableRef: "callback-disabled",
    routingAliasRemovalRef: "alias-removed",
    secretReferenceRemovalRef: "secret-removed",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic closure.",
    at: "2026-07-26T02:06:00Z",
  });
  assert.throws(() => incident.containExternalNotificationTombstoneFailure({
    registrationId: registration.registrationId,
  }));

  const activationFile = path.join(
    process.env.FURLONG_RUNTIME_STATE_DIR!,
    "official-evidence",
    "external-notification-activation.json",
  );
  const activationRows = JSON.parse(fs.readFileSync(activationFile, "utf8"));
  activationRows.push({
    receiptId: "synthetic-resurrection",
    registrationId: registration.registrationId,
    connectorId: registration.connectorId,
    channel: "EMAIL",
    implementationHash: registration.implementationHash,
    action: "ACTIVATE",
    actorId: "red-team",
    actorName: "red-team",
    at: "2026-07-26T02:07:00Z",
    reason: "Injected resurrection evidence.",
  });
  fs.writeFileSync(activationFile, JSON.stringify(activationRows, null, 2) + "\n");
  const [failure] = tombstone.evaluateExternalNotificationRetirementTombstones(
    "2026-07-26T02:08:00Z",
  );
  assert.equal(failure.action, "TOMBSTONE_FAIL");
  assert.throws(() => incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "ACKNOWLEDGE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Cannot acknowledge before containment.",
  }));
  const contained = incident.containExternalNotificationTombstoneFailure({
    registrationId: registration.registrationId,
    at: "2026-07-26T02:09:00Z",
  });
  assert.equal(contained.externalDeliveryBlocked, true);
  assert.equal(contained.internalQueueAuthoritative, true);
  assert.equal(contained.severity, "SEV_1");
  const acknowledged = incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "ACKNOWLEDGE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Acknowledged and investigation opened.",
    at: "2026-07-26T02:10:00Z",
  });
  assert.equal(acknowledged.action, "ACKNOWLEDGE");
  const resolved = incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "RESOLVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic resurrection source removed; permanent block reconfirmed.",
    at: "2026-07-26T02:11:00Z",
  });
  assert.equal(resolved.action, "RESOLVE");
  assert.equal(incident.tombstoneIncidentStatus(registration.registrationId), "RESOLVED");
  assert.throws(() => incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "ESCALATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Resolved incident cannot change.",
  }));

  console.log(JSON.stringify({
    ok: true,
    rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-TOMBSTONE-INCIDENT-001",
    failure: failure.action,
    containment: contained.action,
    severity: contained.severity,
    finalDisposition: resolved.action,
    externalDeliveryBlocked: resolved.externalDeliveryBlocked,
    internalQueueAuthoritative: resolved.internalQueueAuthoritative,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
