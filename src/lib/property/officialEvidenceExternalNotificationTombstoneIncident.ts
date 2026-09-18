import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationRetirementTombstoneReceipts } from "./officialEvidenceExternalNotificationRetirementTombstone";

export type TombstoneIncidentAction =
  | "CONTAIN"
  | "ACKNOWLEDGE"
  | "RESOLVE"
  | "ESCALATE";

export interface ExternalNotificationTombstoneIncidentReceipt {
  receiptId: string;
  tombstoneReceiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: TombstoneIncidentAction;
  severity: "SEV_1";
  externalDeliveryBlocked: true;
  internalQueueAuthoritative: true;
  offendingEventRefs: string[];
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-tombstone-incidents.json",
);

const read = (): ExternalNotificationTombstoneIncidentReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationTombstoneIncidentReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

function latestFailure(registrationId: string) {
  return [...listExternalNotificationRetirementTombstoneReceipts()]
    .reverse()
    .find(
      (receipt) =>
        receipt.registrationId === registrationId &&
        receipt.action === "TOMBSTONE_FAIL",
    ) ?? null;
}

export function containExternalNotificationTombstoneFailure(input: {
  registrationId: string;
  at?: string;
}): ExternalNotificationTombstoneIncidentReceipt {
  const failure = latestFailure(input.registrationId);
  if (!failure)
    throw new Error("Containment requires a TOMBSTONE_FAIL receipt.");
  const prior = read();
  const existing = [...prior]
    .reverse()
    .find(
      (receipt) =>
        receipt.tombstoneReceiptId === failure.receiptId &&
        receipt.action === "CONTAIN",
    );
  if (existing) return existing;
  const row: ExternalNotificationTombstoneIncidentReceipt = {
    receiptId: randomUUID(),
    tombstoneReceiptId: failure.receiptId,
    registrationId: failure.registrationId,
    connectorId: failure.connectorId,
    implementationHash: failure.implementationHash,
    channel: failure.channel,
    action: "CONTAIN",
    severity: "SEV_1",
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    offendingEventRefs: [...failure.prohibitedEventRefs],
    actorId: "system:tombstone-containment",
    actorName: "tombstone-containment",
    at: input.at ?? new Date().toISOString(),
    reason:
      "Post-closure resurrection evidence triggered immediate fail-closed containment; external delivery remains blocked and the internal queue remains authoritative.",
  };
  write([...prior, row]);
  return row;
}

export function decideExternalNotificationTombstoneIncident(input: {
  registrationId: string;
  action: Exclude<TombstoneIncidentAction, "CONTAIN">;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationTombstoneIncidentReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Tombstone incident decisions require an attributed actor and written reason.");
  const failure = latestFailure(input.registrationId);
  if (!failure)
    throw new Error("Tombstone incident decision requires a TOMBSTONE_FAIL receipt.");
  const prior = read();
  const containment = [...prior]
    .reverse()
    .find(
      (receipt) =>
        receipt.tombstoneReceiptId === failure.receiptId &&
        receipt.action === "CONTAIN",
    );
  if (!containment)
    throw new Error("Tombstone failure must be contained before human disposition.");
  const latest = [...prior]
    .reverse()
    .find((receipt) => receipt.tombstoneReceiptId === failure.receiptId);
  if (latest?.action === "RESOLVE")
    throw new Error("A resolved tombstone incident cannot be changed.");
  if (input.action === "RESOLVE" && latest?.action !== "ACKNOWLEDGE")
    throw new Error("Resolution requires prior Module 45 acknowledgment.");
  const row: ExternalNotificationTombstoneIncidentReceipt = {
    ...containment,
    receiptId: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...prior, row]);
  return row;
}

export function listExternalNotificationTombstoneIncidentReceipts() {
  return read();
}

export function tombstoneIncidentStatus(registrationId: string):
  | "NONE"
  | "CONTAINED"
  | "ACKNOWLEDGED"
  | "ESCALATED"
  | "RESOLVED" {
  const latest = [...read()]
    .reverse()
    .find((receipt) => receipt.registrationId === registrationId);
  if (!latest) return "NONE";
  if (latest.action === "CONTAIN") return "CONTAINED";
  if (latest.action === "ACKNOWLEDGE") return "ACKNOWLEDGED";
  if (latest.action === "ESCALATE") return "ESCALATED";
  return "RESOLVED";
}
