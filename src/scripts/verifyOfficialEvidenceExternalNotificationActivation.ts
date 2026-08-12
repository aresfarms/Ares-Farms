import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(
    path.join(os.tmpdir(), "furlong-ext-activation-"),
  );
  const connector =
    await import("../lib/property/officialEvidenceExternalNotificationConnector");
  const dry =
    await import("../lib/property/officialEvidenceExternalNotificationDryRun");
  const activation =
    await import("../lib/property/officialEvidenceExternalNotificationActivation");
  const hash = "a".repeat(64);
  const reg = connector.registerExternalNotificationConnector({
    connectorId: "sandbox-email",
    channel: "EMAIL",
    implementationHash: hash,
    replayEvidence: "replay",
  });
  let blocked = false;
  try {
    activation.decideExternalNotificationActivation({
      registrationId: reg.registrationId,
      action: "ACTIVATE",
      actorId: "m45",
      actorName: "Module 45",
      reason: "premature",
    });
  } catch {
    blocked = true;
  }
  if (!blocked)
    throw new Error(
      "Activation must fail before connector approval and dry run.",
    );
  connector.decideExternalNotificationConnector({
    registrationId: reg.registrationId,
    decision: "APPROVE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "approved for test",
  });
  dry.runExternalNotificationDryRun({
    connectorId: reg.connectorId,
    notificationId: "notice-1",
    severity: "P1",
    slaAction: "ACK_BREACH",
    occurredAt: new Date().toISOString(),
    send: () => ({ accepted: true, reference: "sandbox-1" }),
  });
  if (activation.externalNotificationLiveDeliveryPermitted("EMAIL"))
    throw new Error("Dry run must not enable live delivery.");
  activation.decideExternalNotificationActivation({
    registrationId: reg.registrationId,
    action: "ACTIVATE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "separate live activation",
  });
  if (!activation.externalNotificationLiveDeliveryPermitted("EMAIL"))
    throw new Error(
      "Current approved and dry-run-certified connector should activate.",
    );
  activation.decideExternalNotificationActivation({
    registrationId: reg.registrationId,
    action: "REVOKE",
    actorId: "m45",
    actorName: "Module 45",
    reason: "revoke test",
  });
  if (activation.externalNotificationLiveDeliveryPermitted("EMAIL"))
    throw new Error("Revocation must disable live delivery.");
  console.log(
    JSON.stringify(
      {
        ok: true,
        rule: "OFFICIAL-EVIDENCE-EXTERNAL-NOTIFICATION-ACTIVATION-001",
        prematureBlocked: blocked,
        liveAfterRevoke: false,
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
