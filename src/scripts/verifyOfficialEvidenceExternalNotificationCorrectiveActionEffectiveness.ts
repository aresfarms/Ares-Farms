import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-corrective-effectiveness-"),
  );
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const closure = await import("../lib/property/officialEvidenceExternalNotificationRetirementClosure");
  const tombstone = await import("../lib/property/officialEvidenceExternalNotificationRetirementTombstone");
  const incident = await import("../lib/property/officialEvidenceExternalNotificationTombstoneIncident");
  const corrective = await import("../lib/property/officialEvidenceExternalNotificationCorrectiveAction");
  const effectiveness = await import("../lib/property/officialEvidenceExternalNotificationCorrectiveActionEffectiveness");

  const reg = connector.registerExternalNotificationConnector({
    connectorId: "effectiveness-email",
    channel: "EMAIL",
    implementationHash: "f".repeat(64),
    replayEvidence: "synthetic",
    at: "2026-01-01T00:00:00Z",
  });
  connector.decideExternalNotificationConnector({ registrationId: reg.registrationId, decision: "APPROVE", actorId: "m45", actorName: "M45", reason: "approve", at: "2026-01-01T00:01:00Z" });
  dry.runExternalNotificationDryRun({ connectorId: reg.connectorId, notificationId: "dry", severity: "P1", slaAction: "ASSIGN", occurredAt: "2026-01-01T00:02:00Z", send: () => ({ accepted: true }), at: "2026-01-01T00:02:00Z" });
  activation.decideExternalNotificationActivation({ registrationId: reg.registrationId, action: "ACTIVATE", actorId: "m45", actorName: "M45", reason: "activate", at: "2026-01-01T00:03:00Z" });
  activation.decideExternalNotificationActivation({ registrationId: reg.registrationId, action: "REVOKE", actorId: "m45", actorName: "M45", reason: "revoke", at: "2026-01-01T00:04:00Z" });
  retirement.retireExternalNotificationConnector({ registrationId: reg.registrationId, classification: "OPERATOR_DECOMMISSION", actorId: "m45", actorName: "M45", reason: "retire", at: "2026-01-01T00:05:00Z" });
  closure.closeExternalNotificationRetirement({ registrationId: reg.registrationId, credentialRevocationRef: "cred", providerCallbackDisableRef: "callback", routingAliasRemovalRef: "alias", secretReferenceRemovalRef: "secret", internalQueueAuthoritative: true, openOperationalReferences: 0, actorId: "m45", actorName: "M45", reason: "close", at: "2026-01-01T00:06:00Z" });
  tombstone.evaluateExternalNotificationRetirementTombstones("2026-01-01T00:07:00Z");
  const stateFile = path.join(process.env.FURLONG_RUNTIME_STATE_DIR!, "official-evidence", "external-notification-activation.json");
  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  state.push({ receiptId: "stale-activation", registrationId: reg.registrationId, connectorId: reg.connectorId, implementationHash: reg.implementationHash, channel: reg.channel, action: "ACTIVATE", actorId: "bad", actorName: "bad", at: "2026-01-01T00:08:00Z", reason: "red team" });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  tombstone.evaluateExternalNotificationRetirementTombstones("2026-01-01T00:09:00Z");
  incident.containExternalNotificationTombstoneFailure({ registrationId: reg.registrationId, at: "2026-01-01T00:10:00Z" });
  incident.decideExternalNotificationTombstoneIncident({ registrationId: reg.registrationId, action: "ACKNOWLEDGE", actorId: "m45", actorName: "M45", reason: "ack", at: "2026-01-01T00:11:00Z" });
  incident.decideExternalNotificationTombstoneIncident({ registrationId: reg.registrationId, action: "RESOLVE", actorId: "m45", actorName: "M45", reason: "resolve", at: "2026-01-01T00:12:00Z" });
  // Remove synthetic recurrence before remediation proof, preserving the prior tombstone receipt.
  fs.writeFileSync(stateFile, JSON.stringify(state.filter((row: { receiptId: string }) => row.receiptId !== "stale-activation"), null, 2));
  corrective.openExternalNotificationCorrectiveAction({ registrationId: reg.registrationId, at: "2026-01-01T00:13:00Z" });
  corrective.verifyExternalNotificationCorrectiveAction({ registrationId: reg.registrationId, rootCauseRef: "root", credentialAuditRef: "cred-audit", providerAuditRef: "provider-audit", routingAuditRef: "routing-audit", secretAuditRef: "secret-audit", codeChangeRef: "commit", externalDeliveryBlocked: true, internalQueueAuthoritative: true, actorId: "m45", actorName: "M45", reason: "verified", at: "2026-01-01T00:14:00Z" });
  corrective.closeExternalNotificationCorrectiveAction({ registrationId: reg.registrationId, actorId: "m45", actorName: "M45", reason: "closed", at: "2026-01-01T00:15:00Z" });

  assert.throws(() => effectiveness.evaluateExternalNotificationCorrectiveActionEffectiveness({ registrationId: reg.registrationId, externalDeliveryBlocked: true, internalQueueAuthoritative: true, at: "2026-01-02T00:15:00Z" }));
  effectiveness.openExternalNotificationCorrectiveActionEffectivenessWindow({ registrationId: reg.registrationId, at: "2026-01-01T00:16:00Z" });
  assert.throws(() => effectiveness.evaluateExternalNotificationCorrectiveActionEffectiveness({ registrationId: reg.registrationId, externalDeliveryBlocked: true, internalQueueAuthoritative: true, at: "2026-01-01T12:16:00Z" }));
  const c1 = effectiveness.evaluateExternalNotificationCorrectiveActionEffectiveness({ registrationId: reg.registrationId, externalDeliveryBlocked: true, internalQueueAuthoritative: true, at: "2026-01-02T00:16:00Z" });
  const c2 = effectiveness.evaluateExternalNotificationCorrectiveActionEffectiveness({ registrationId: reg.registrationId, externalDeliveryBlocked: true, internalQueueAuthoritative: true, at: "2026-01-03T00:16:00Z" });
  assert.throws(() => effectiveness.closeExternalNotificationCorrectiveActionEffectivenessWindow({ registrationId: reg.registrationId, actorId: "m45", actorName: "M45", reason: "too early" }));
  const c3 = effectiveness.evaluateExternalNotificationCorrectiveActionEffectiveness({ registrationId: reg.registrationId, externalDeliveryBlocked: true, internalQueueAuthoritative: true, at: "2026-01-04T00:16:00Z" });
  const closed = effectiveness.closeExternalNotificationCorrectiveActionEffectivenessWindow({ registrationId: reg.registrationId, actorId: "m45", actorName: "M45", reason: "72 hours clean", at: "2026-01-04T00:17:00Z" });
  assert.equal(c1.action, "EFFECTIVENESS_CHECKPOINT_PASS");
  assert.equal(c2.checkpointNumber, 2);
  assert.equal(c3.checkpointNumber, 3);
  assert.equal(closed.action, "CLOSE_EFFECTIVENESS_WINDOW");
  assert.equal(effectiveness.correctiveActionEffectivenessStatus(reg.registrationId), "CLOSED");
  console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-CORRECTIVE-ACTION-EFFECTIVENESS-001", predecessor: "4A_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION", observationWindowHours: 72, requiredCheckpoints: 3, finalAction: closed.action }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
