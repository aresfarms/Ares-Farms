import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { approvedExternalNotificationConnectors } from "./officialEvidenceExternalNotificationConnector";
import { listExternalNotificationActivationReceipts } from "./officialEvidenceExternalNotificationActivation";
import {
  EXTERNAL_NOTIFICATION_RETIREMENT_FILE,
  externalNotificationRegistrationRetired,
  listExternalNotificationRetirementReceipts,
  type ExternalNotificationRetirementClassification,
  type ExternalNotificationRetirementReceipt,
} from "./officialEvidenceExternalNotificationRetirementState";

const write = (rows: ExternalNotificationRetirementReceipt[]) => {
  fs.mkdirSync(path.dirname(EXTERNAL_NOTIFICATION_RETIREMENT_FILE), { recursive: true });
  const tmp = `${EXTERNAL_NOTIFICATION_RETIREMENT_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, EXTERNAL_NOTIFICATION_RETIREMENT_FILE);
};

export function retireExternalNotificationConnector(input: {
  registrationId: string;
  classification: ExternalNotificationRetirementClassification;
  actorId: string;
  actorName: string;
  reason: string;
  replacementRegistrationId?: string | null;
  at?: string;
}): ExternalNotificationRetirementReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Retirement requires an attributed actor and written reason.");
  if (externalNotificationRegistrationRetired(input.registrationId))
    throw new Error("Connector registration is already permanently retired.");
  const connector = approvedExternalNotificationConnectors().find(
    (candidate) => candidate.registrationId === input.registrationId,
  );
  if (!connector)
    throw new Error("Retirement requires a currently approved connector registration.");
  const revocation = [...listExternalNotificationActivationReceipts()]
    .reverse()
    .find(
      (receipt) =>
        receipt.registrationId === connector.registrationId &&
        receipt.implementationHash === connector.implementationHash &&
        receipt.action === "REVOKE",
    );
  if (!revocation)
    throw new Error("Connector must be explicitly revoked before permanent retirement.");
  if (input.replacementRegistrationId === input.registrationId)
    throw new Error("A retired connector cannot name itself as its replacement.");
  const row: ExternalNotificationRetirementReceipt = {
    receiptId: randomUUID(),
    registrationId: connector.registrationId,
    connectorId: connector.connectorId,
    implementationHash: connector.implementationHash,
    channel: connector.channel,
    action: "RETIRE",
    classification: input.classification,
    revocationReceiptId: revocation.receiptId,
    replacementRegistrationId: input.replacementRegistrationId ?? null,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...listExternalNotificationRetirementReceipts(), row]);
  return row;
}

export {
  externalNotificationRegistrationRetired,
  listExternalNotificationRetirementReceipts,
};
export type {
  ExternalNotificationRetirementClassification,
  ExternalNotificationRetirementReceipt,
};
