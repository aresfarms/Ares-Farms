import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-tombstone-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = root;
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dryRun = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const closure = await import("../lib/property/officialEvidenceExternalNotificationRetirementClosure");
  const tombstone = await import("../lib/property/officialEvidenceExternalNotificationRetirementTombstone");

  const registration = connector.registerExternalNotificationConnector({
    connectorId: "tombstone-email",
    channel: "EMAIL",
    implementationHash: "e".repeat(64),
    replayEvidence: "synthetic tombstone replay evidence",
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
    notificationId: "tombstone-dry-run",
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
    classification: "OPERATOR_DECOMMISSION",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic retirement.",
    at: "2026-07-26T02:05:00Z",
  });
  closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "secret-manager:revoked",
    providerCallbackDisableRef: "provider:callback-disabled",
    routingAliasRemovalRef: "routing:alias-removed",
    secretReferenceRemovalRef: "runtime:secret-ref-removed",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic closure.",
    at: "2026-07-26T02:06:00Z",
  });

  const pass = tombstone.evaluateExternalNotificationRetirementTombstones("2026-07-26T02:07:00Z")[0];
  assert.equal(pass.action, "TOMBSTONE_PASS");
  assert.equal(tombstone.retirementTombstoneHealthy(registration.registrationId), true);

  const activationFile = path.join(root, "official-evidence", "external-notification-activation.json");
  const rows = JSON.parse(fs.readFileSync(activationFile, "utf8"));
  rows.push({
    ...rows[0],
    receiptId: "synthetic-resurrection-receipt",
    action: "ACTIVATE",
    at: "2026-07-26T02:08:00Z",
    reason: "Injected stale activation evidence for verifier red-team.",
  });
  fs.writeFileSync(activationFile, JSON.stringify(rows, null, 2) + "\n");

  const fail = tombstone.evaluateExternalNotificationRetirementTombstones("2026-07-26T02:09:00Z")[0];
  assert.equal(fail.action, "TOMBSTONE_FAIL");
  assert.equal(fail.prohibitedEventCount, 1);
  assert.equal(tombstone.retirementTombstoneHealthy(registration.registrationId), false);

  const replacement = connector.registerExternalNotificationConnector({
    connectorId: registration.connectorId,
    channel: "EMAIL",
    implementationHash: "f".repeat(64),
    replayEvidence: "fresh replacement registration",
    at: "2026-07-26T02:10:00Z",
  });
  assert.notEqual(replacement.registrationId, registration.registrationId);
  const noNew = tombstone.evaluateExternalNotificationRetirementTombstones("2026-07-26T02:11:00Z");
  assert.equal(noNew.length, 0);

  console.log(JSON.stringify({
    ok: true,
    rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-RETIREMENT-TOMBSTONE-001",
    cleanOutcome: pass.action,
    redTeamOutcome: fail.action,
    resurrectionBlocked: true,
    replacementRegistrationIndependent: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
