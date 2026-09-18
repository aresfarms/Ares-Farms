import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { retiredExternalNotificationRegistration } from "./officialEvidenceExternalNotificationRetirementState";

export interface ExternalNotificationRetirementClosureReceipt {
  receiptId: string;
  retirementReceiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: "CLOSE_RETIREMENT";
  credentialRevocationRef: string;
  providerCallbackDisableRef: string;
  routingAliasRemovalRef: string;
  secretReferenceRemovalRef: string;
  internalQueueAuthoritative: true;
  openOperationalReferences: 0;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-retirement-closure.json",
);

const read = (): ExternalNotificationRetirementClosureReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationRetirementClosureReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

const requiredRef = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} evidence reference is required.`);
  return value.trim();
};

export function closeExternalNotificationRetirement(input: {
  registrationId: string;
  credentialRevocationRef: string;
  providerCallbackDisableRef: string;
  routingAliasRemovalRef: string;
  secretReferenceRemovalRef: string;
  internalQueueAuthoritative: boolean;
  openOperationalReferences: number;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationRetirementClosureReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Retirement closure requires an attributed actor and written reason.");
  const retirement = retiredExternalNotificationRegistration(input.registrationId);
  if (!retirement)
    throw new Error("Retirement closure requires a permanent RETIRE receipt.");
  const existing = [...read()]
    .reverse()
    .find((receipt) => receipt.registrationId === input.registrationId);
  if (existing) return existing;
  if (!input.internalQueueAuthoritative)
    throw new Error("The governed internal queue must remain authoritative at closure.");
  if (!Number.isInteger(input.openOperationalReferences) || input.openOperationalReferences !== 0)
    throw new Error("Retirement closure requires zero open operational references.");

  const row: ExternalNotificationRetirementClosureReceipt = {
    receiptId: randomUUID(),
    retirementReceiptId: retirement.receiptId,
    registrationId: retirement.registrationId,
    connectorId: retirement.connectorId,
    implementationHash: retirement.implementationHash,
    channel: retirement.channel,
    action: "CLOSE_RETIREMENT",
    credentialRevocationRef: requiredRef(input.credentialRevocationRef, "Credential revocation"),
    providerCallbackDisableRef: requiredRef(input.providerCallbackDisableRef, "Provider callback disablement"),
    routingAliasRemovalRef: requiredRef(input.routingAliasRemovalRef, "Routing alias removal"),
    secretReferenceRemovalRef: requiredRef(input.secretReferenceRemovalRef, "Secret reference removal"),
    internalQueueAuthoritative: true,
    openOperationalReferences: 0,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...read(), row]);
  return row;
}

export function listExternalNotificationRetirementClosureReceipts() {
  return read();
}

export function externalNotificationRetirementClosed(registrationId: string): boolean {
  return read().some((receipt) => receipt.registrationId === registrationId);
}
