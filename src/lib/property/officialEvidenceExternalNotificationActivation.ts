import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { approvedExternalNotificationConnectors } from "./officialEvidenceExternalNotificationConnector";
import { listExternalNotificationDryRuns } from "./officialEvidenceExternalNotificationDryRun";

export type ExternalNotificationActivationAction = "ACTIVATE" | "REVOKE";
export interface ExternalNotificationActivationReceipt {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  implementationHash: string;
  dryRunReceiptId: string;
  dryRunPayloadHash: string;
  action: ExternalNotificationActivationAction;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-activation.json",
);
const read = (): ExternalNotificationActivationReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};
const write = (rows: ExternalNotificationActivationReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
export function decideExternalNotificationActivation(input: {
  registrationId: string;
  action: ExternalNotificationActivationAction;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationActivationReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "External notification activation requires an attributed actor and reason.",
    );
  const connector = approvedExternalNotificationConnectors().find(
    (x) => x.registrationId === input.registrationId,
  );
  if (!connector)
    throw new Error(
      "Activation requires a currently approved connector implementation.",
    );
  const dryRun = [...listExternalNotificationDryRuns()]
    .reverse()
    .find(
      (x) =>
        x.registrationId === connector.registrationId &&
        x.implementationHash === connector.implementationHash &&
        x.providerStatus === "ACCEPTED" &&
        x.liveDeliveryPermitted === false,
    );
  if (!dryRun)
    throw new Error(
      "Activation requires a successful current dry-run receipt.",
    );
  const row: ExternalNotificationActivationReceipt = {
    receiptId: randomUUID(),
    registrationId: connector.registrationId,
    connectorId: connector.connectorId,
    channel: connector.channel,
    implementationHash: connector.implementationHash,
    dryRunReceiptId: dryRun.receiptId,
    dryRunPayloadHash: dryRun.payloadHash,
    action: input.action,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...read(), row]);
  return row;
}
export function listExternalNotificationActivationReceipts() {
  return read();
}
export function liveExternalNotificationConnectors() {
  const approved = approvedExternalNotificationConnectors();
  const rows = read();
  return approved.filter((connector) => {
    const latest = [...rows]
      .reverse()
      .find((x) => x.registrationId === connector.registrationId);
    return (
      latest?.action === "ACTIVATE" &&
      latest.implementationHash === connector.implementationHash
    );
  });
}
export function externalNotificationLiveDeliveryPermitted(
  channel: "EMAIL" | "SMS" | "PAGER",
) {
  return liveExternalNotificationConnectors().some(
    (x) => x.channel === channel,
  );
}
