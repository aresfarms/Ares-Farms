import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-corrective-action-"),
  );
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const closure = await import("../lib/property/officialEvidenceExternalNotificationRetirementClosure");
  const tombstone = await import("../lib/property/officialEvidenceExternalNotificationRetirementTombstone");
  const incident = await import("../lib/property/officialEvidenceExternalNotificationTombstoneIncident");
  const corrective = await import("../lib/property/officialEvidenceExternalNotificationCorrectiveAction");

  const registration = connector.registerExternalNotificationConnector({
    connectorId: "capa-email",
    channel: "EMAIL",
    implementationHash: "f".repeat(64),
    replayEvidence: "synthetic",
    at: "2026-07-26T03:00:00Z",
  });
  connector.decideExternalNotificationConnector({
    registrationId: registration.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "synthetic approval",
    at: "2026-07-26T03:01:00Z",
  });
  dry.runExternalNotificationDryRun({
    connectorId: registration.connectorId,
    notificationId: "capa-dry",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-26T03:02:00Z",
    send: () => ({ accepted: true }),
    at: "2026-07-26T03:02:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "synthetic activation",
    at: "2026-07-26T03:03:00Z",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "REVOKE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "synthetic revocation",
    at: "2026-07-26T03:04:00Z",
  });
  retirement.retireExternalNotificationConnector({
    registrationId: registration.registrationId,
    classification: "SECURITY_RETIREMENT",
    actorId: "m45",
    actorName: "Module 45",
    reason: "synthetic retirement",
    at: "2026-07-26T03:05:00Z",
  });
  closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "cred-audit",
    providerCallbackDisableRef: "provider-audit",
    routingAliasRemovalRef: "route-audit",
    secretReferenceRemovalRef: "secret-audit",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "synthetic closure",
    at: "2026-07-26T03:06:00Z",
  });
  tombstone.evaluateExternalNotificationRetirementTombstones("2026-07-26T03:07:00Z");
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
    implementationHash: registration.implementationHash,
    channel: registration.channel,
    action: "ACTIVATE",
    dryRunReceiptId: "synthetic",
    actorId: "red-team",
    actorName: "red-team",
    at: "2026-07-26T03:08:00Z",
    reason: "synthetic resurrection",
  });
  fs.writeFileSync(activationFile, JSON.stringify(activationRows, null, 2));
  const failure = tombstone.evaluateExternalNotificationRetirementTombstones(
    "2026-07-26T03:09:00Z",
  ).at(-1)!;
  incident.containExternalNotificationTombstoneFailure({
    registrationId: registration.registrationId,
    at: "2026-07-26T03:10:00Z",
  });
  incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "ACKNOWLEDGE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "acknowledged",
    at: "2026-07-26T03:11:00Z",
  });
  incident.decideExternalNotificationTombstoneIncident({
    registrationId: registration.registrationId,
    action: "RESOLVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "contained and resolved",
    at: "2026-07-26T03:12:00Z",
  });

  assert.throws(() => corrective.verifyExternalNotificationCorrectiveAction({
    registrationId: registration.registrationId,
    rootCauseRef: "root",
    credentialAuditRef: "cred",
    providerAuditRef: "provider",
    routingAuditRef: "route",
    secretAuditRef: "secret",
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "m45",
    actorName: "Module 45",
    reason: "must open first",
  }));

  const opened = corrective.openExternalNotificationCorrectiveAction({
    registrationId: registration.registrationId,
    at: "2026-07-26T03:13:00Z",
  });
  assert.throws(() => corrective.closeExternalNotificationCorrectiveAction({
    registrationId: registration.registrationId,
    actorId: "m45",
    actorName: "Module 45",
    reason: "cannot close before verification",
  }));
  const verified = corrective.verifyExternalNotificationCorrectiveAction({
    registrationId: registration.registrationId,
    rootCauseRef: "root-cause-report-1",
    credentialAuditRef: "credential-audit-1",
    providerAuditRef: "provider-audit-1",
    routingAuditRef: "routing-audit-1",
    secretAuditRef: "secret-audit-1",
    codeChangeRef: "commit:synthetic",
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "m45",
    actorName: "Module 45",
    reason: "remediation verified",
    at: "2026-07-26T03:14:00Z",
  });
  const closed = corrective.closeExternalNotificationCorrectiveAction({
    registrationId: registration.registrationId,
    actorId: "m45",
    actorName: "Module 45",
    reason: "corrective action closed",
    at: "2026-07-26T03:15:00Z",
  });

  assert.equal(failure.action, "TOMBSTONE_FAIL");
  assert.equal(opened.action, "OPEN_CORRECTIVE_ACTION");
  assert.equal(verified.recurrenceEventCount, 0);
  assert.equal(closed.action, "CLOSE_CORRECTIVE_ACTION");
  assert.equal(corrective.correctiveActionStatus(registration.registrationId), "CLOSED");
  console.log(JSON.stringify({
    ok: true,
    rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-CORRECTIVE-ACTION-001",
    predecessor: "3Z_EXTERNAL_NOTIFICATION_TOMBSTONE_INCIDENT",
    rootCauseBound: true,
    remediationVerified: true,
    recurrenceEvents: closed.recurrenceEventCount,
    finalAction: closed.action,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
