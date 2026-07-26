import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const runtime = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-institutional-closure-"),
  );
  process.env.FURLONG_RUNTIME_STATE_DIR = runtime;
  const dir = path.join(runtime, "official-evidence");
  fs.mkdirSync(dir, { recursive: true });
  const registrationId = "reg-4c";
  const base = {
    registrationId,
    connectorId: "closure-email",
    implementationHash: "e".repeat(64),
    channel: "EMAIL",
  };
  fs.writeFileSync(
    path.join(dir, "external-notification-tombstone-incidents.json"),
    JSON.stringify([
      {
        ...base,
        receiptId: "incident-resolve",
        tombstoneReceiptId: "tombstone-fail",
        action: "RESOLVE",
        severity: "SEV_1",
        externalDeliveryBlocked: true,
        internalQueueAuthoritative: true,
        offendingEventRefs: ["activation:bad"],
        actorId: "m45-a",
        actorName: "M45 A",
        at: "2026-01-01T00:00:00Z",
        reason: "resolved",
      },
    ]),
  );
  fs.writeFileSync(
    path.join(dir, "external-notification-corrective-actions.json"),
    JSON.stringify([
      {
        ...base,
        receiptId: "capa-close",
        incidentResolutionReceiptId: "incident-resolve",
        action: "CLOSE_CORRECTIVE_ACTION",
        rootCauseRef: "root",
        credentialAuditRef: "credential",
        providerAuditRef: "provider",
        routingAuditRef: "routing",
        secretAuditRef: "secret",
        codeChangeRef: "commit",
        recurrenceEventCount: 0,
        recurrenceEventRefs: [],
        externalDeliveryBlocked: true,
        internalQueueAuthoritative: true,
        actorId: "m45-a",
        actorName: "M45 A",
        at: "2026-01-02T00:00:00Z",
        reason: "closed",
      },
    ]),
  );
  fs.writeFileSync(
    path.join(
      dir,
      "external-notification-corrective-action-effectiveness.json",
    ),
    JSON.stringify([
      {
        ...base,
        receiptId: "effect-close",
        correctiveActionClosureReceiptId: "capa-close",
        action: "CLOSE_EFFECTIVENESS_WINDOW",
        checkpointNumber: 3,
        requiredCheckpoints: 3,
        observationWindowHours: 72,
        recurrenceEventCount: 0,
        recurrenceEventRefs: [],
        externalDeliveryBlocked: true,
        internalQueueAuthoritative: true,
        actorId: "m45-a",
        actorName: "M45 A",
        at: "2026-01-05T00:00:00Z",
        reason: "72 hours clean",
      },
    ]),
  );
  fs.writeFileSync(
    path.join(dir, "external-notification-retirement-tombstone.json"),
    JSON.stringify([
      {
        ...base,
        receiptId: "tombstone-pass",
        closureReceiptId: "retire-close",
        action: "TOMBSTONE_PASS",
        prohibitedEventCount: 0,
        prohibitedEventRefs: [],
        checkedThrough: "2026-01-05T00:00:00Z",
        actorId: "system:retirement-tombstone",
        actorName: "retirement-tombstone",
        at: "2026-01-05T00:00:00Z",
        reason: "clean",
      },
    ]),
  );
  const closure =
    await import("../lib/property/officialEvidenceExternalNotificationInstitutionalClosure");
  assert.throws(() =>
    closure.attestExternalNotificationInstitutionalClosure({
      registrationId,
      attestationScope: "full chain",
      externalDeliveryBlocked: true,
      internalQueueAuthoritative: true,
      actorId: "m45-a",
      actorName: "M45 A",
      reason: "same actor",
    }),
  );
  const receipt = closure.attestExternalNotificationInstitutionalClosure({
    registrationId,
    attestationScope:
      "incident, remediation, effectiveness, and tombstone evidence",
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "m45-b",
    actorName: "M45 B",
    reason: "independent closure attestation",
    at: "2026-01-05T01:00:00Z",
  });
  assert.equal(receipt.action, "ATTEST_INSTITUTIONAL_CLOSURE");
  assert.match(receipt.evidenceSnapshotHash, /^[a-f0-9]{64}$/);
  assert.equal(receipt.independentFromEffectivenessCloser, true);
  assert.equal(
    closure.externalNotificationInstitutionallyClosed(registrationId),
    true,
  );
  const duplicate = closure.attestExternalNotificationInstitutionalClosure({
    registrationId,
    attestationScope: "same",
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "m45-c",
    actorName: "M45 C",
    reason: "duplicate",
  });
  assert.equal(duplicate.receiptId, receipt.receiptId);
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-INSTITUTIONAL-CLOSURE-001",
        predecessor: "4B_EXTERNAL_NOTIFICATION_CORRECTIVE_ACTION_EFFECTIVENESS",
        independentActorRequired: true,
        evidenceSnapshotHash: receipt.evidenceSnapshotHash,
        finalAction: receipt.action,
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
