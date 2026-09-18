import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-retirement-closure-"),
  );
  const connector = await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dryRun = await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation = await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const retirement = await import("../lib/property/officialEvidenceExternalNotificationRetirement");
  const closure = await import("../lib/property/officialEvidenceExternalNotificationRetirementClosure");

  const registration = connector.registerExternalNotificationConnector({
    connectorId: "closure-email",
    channel: "EMAIL",
    implementationHash: "e".repeat(64),
    replayEvidence: "synthetic closure replay evidence",
    at: "2026-07-26T00:00:00Z",
  });

  assert.throws(() => closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "cred-1",
    providerCallbackDisableRef: "callback-1",
    routingAliasRemovalRef: "alias-1",
    secretReferenceRemovalRef: "secret-1",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Closure before retirement must fail.",
  }));

  connector.decideExternalNotificationConnector({
    registrationId: registration.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic approval.",
  });
  dryRun.runExternalNotificationDryRun({
    connectorId: registration.connectorId,
    notificationId: "closure-dry-run",
    severity: "P1",
    slaAction: "ASSIGN",
    occurredAt: "2026-07-26T00:01:00Z",
    send: () => ({ accepted: true, reference: "synthetic" }),
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic activation.",
  });
  activation.decideExternalNotificationActivation({
    registrationId: registration.registrationId,
    action: "REVOKE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic revocation.",
  });
  retirement.retireExternalNotificationConnector({
    registrationId: registration.registrationId,
    classification: "OPERATOR_DECOMMISSION",
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic retirement.",
  });

  assert.throws(() => closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "cred-1",
    providerCallbackDisableRef: "callback-1",
    routingAliasRemovalRef: "alias-1",
    secretReferenceRemovalRef: "secret-1",
    internalQueueAuthoritative: false,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Internal queue loss must fail.",
  }));
  assert.throws(() => closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "cred-1",
    providerCallbackDisableRef: "callback-1",
    routingAliasRemovalRef: "alias-1",
    secretReferenceRemovalRef: "secret-1",
    internalQueueAuthoritative: true,
    openOperationalReferences: 1,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Open references must fail.",
  }));

  const receipt = closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "secret-manager-version-disabled:synthetic",
    providerCallbackDisableRef: "provider-callback-disabled:synthetic",
    routingAliasRemovalRef: "routing-alias-removed:synthetic",
    secretReferenceRemovalRef: "runtime-secret-ref-removed:synthetic",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Synthetic decommission evidence complete.",
    at: "2026-07-26T00:10:00Z",
  });

  assert.equal(receipt.action, "CLOSE_RETIREMENT");
  assert.equal(closure.externalNotificationRetirementClosed(registration.registrationId), true);
  assert.equal(closure.closeExternalNotificationRetirement({
    registrationId: registration.registrationId,
    credentialRevocationRef: "ignored",
    providerCallbackDisableRef: "ignored",
    routingAliasRemovalRef: "ignored",
    secretReferenceRemovalRef: "ignored",
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: "m45",
    actorName: "Module 45",
    reason: "Idempotent retry.",
  }).receiptId, receipt.receiptId);

  console.log(JSON.stringify({
    ok: true,
    rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-RETIREMENT-CLOSURE-001",
    action: receipt.action,
    predecessor: "3W_EXTERNAL_NOTIFICATION_RETIREMENT",
    internalQueueAuthoritative: receipt.internalQueueAuthoritative,
    openOperationalReferences: receipt.openOperationalReferences,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
