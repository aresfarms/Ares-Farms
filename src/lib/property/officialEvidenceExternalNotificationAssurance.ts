import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationDeliveryReceipts } from "./officialEvidenceExternalNotificationDelivery";
import { decideExternalNotificationActivation } from "./officialEvidenceExternalNotificationActivation";

export type DeliveryAssuranceAction =
  "ACKNOWLEDGED" | "ACK_TIMEOUT" | "DELIVERY_INCIDENT" | "AUTO_SUSPEND";
export interface DeliveryAssuranceReceipt {
  receiptId: string;
  action: DeliveryAssuranceAction;
  registrationId: string;
  connectorId: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  implementationHash: string;
  notificationId: string;
  deliveryReceiptId: string;
  providerReference: string | null;
  acknowledgeBy: string;
  at: string;
  actorId: string;
  actorName: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-assurance.json",
);
const read = (): DeliveryAssuranceReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};
const write = (rows: DeliveryAssuranceReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const ackMinutes = (channel: "EMAIL" | "SMS" | "PAGER") =>
  channel === "PAGER" ? 5 : channel === "SMS" ? 10 : 30;
const deadline = (at: string, channel: "EMAIL" | "SMS" | "PAGER") =>
  new Date(Date.parse(at) + ackMinutes(channel) * 60_000).toISOString();

export function acknowledgeExternalNotificationDelivery(input: {
  deliveryReceiptId: string;
  providerReference: string;
  actorId?: string;
  actorName?: string;
  reason?: string;
  at?: string;
}): DeliveryAssuranceReceipt {
  if (!input.providerReference.trim())
    throw new Error("Provider acknowledgment reference is required.");
  const delivery = listExternalNotificationDeliveryReceipts().find(
    (row) =>
      row.receiptId === input.deliveryReceiptId && row.action === "DELIVERED",
  );
  if (!delivery)
    throw new Error("Accepted external delivery receipt not found.");
  const existing = read().find(
    (row) =>
      row.deliveryReceiptId === delivery.receiptId &&
      row.action === "ACKNOWLEDGED",
  );
  if (existing) return existing;
  const row: DeliveryAssuranceReceipt = {
    receiptId: randomUUID(),
    action: "ACKNOWLEDGED",
    registrationId: delivery.registrationId,
    connectorId: delivery.connectorId,
    channel: delivery.channel,
    implementationHash: delivery.implementationHash,
    notificationId: delivery.notificationId,
    deliveryReceiptId: delivery.receiptId,
    providerReference: input.providerReference,
    acknowledgeBy: deadline(delivery.at, delivery.channel),
    at: input.at ?? new Date().toISOString(),
    actorId: input.actorId ?? "system:provider-callback",
    actorName: input.actorName ?? "provider-callback",
    reason: input.reason ?? "Provider delivery acknowledgment received.",
  };
  write([...read(), row]);
  return row;
}

export function evaluateExternalNotificationAcknowledgments(
  at = new Date().toISOString(),
): DeliveryAssuranceReceipt[] {
  const rows = read();
  const created: DeliveryAssuranceReceipt[] = [];
  const deliveries = listExternalNotificationDeliveryReceipts().filter(
    (row) => row.action === "DELIVERED",
  );
  for (const delivery of deliveries) {
    const history = [...rows, ...created].filter(
      (row) => row.deliveryReceiptId === delivery.receiptId,
    );
    if (
      history.some(
        (row) => row.action === "ACKNOWLEDGED" || row.action === "ACK_TIMEOUT",
      )
    )
      continue;
    const acknowledgeBy = deadline(delivery.at, delivery.channel);
    if (Date.parse(at) <= Date.parse(acknowledgeBy)) continue;
    const base = {
      registrationId: delivery.registrationId,
      connectorId: delivery.connectorId,
      channel: delivery.channel,
      implementationHash: delivery.implementationHash,
      notificationId: delivery.notificationId,
      deliveryReceiptId: delivery.receiptId,
      providerReference: delivery.providerReference,
      acknowledgeBy,
      at,
      actorId: "system:delivery-assurance",
      actorName: "delivery-assurance",
    };
    created.push({
      ...base,
      receiptId: randomUUID(),
      action: "ACK_TIMEOUT",
      reason: `Provider acknowledgment was not received by ${acknowledgeBy}.`,
    });
    created.push({
      ...base,
      receiptId: randomUUID(),
      action: "DELIVERY_INCIDENT",
      reason:
        "External notification delivery confirmation incident opened; internal queue remains authoritative.",
    });
    const connectorTimeouts = [...rows, ...created].filter(
      (row) =>
        row.registrationId === delivery.registrationId &&
        row.action === "ACK_TIMEOUT",
    ).length;
    if (
      connectorTimeouts >= 3 &&
      ![...rows, ...created].some(
        (row) =>
          row.registrationId === delivery.registrationId &&
          row.action === "AUTO_SUSPEND",
      )
    ) {
      decideExternalNotificationActivation({
        registrationId: delivery.registrationId,
        action: "REVOKE",
        actorId: "system:delivery-assurance",
        actorName: "delivery-assurance",
        reason:
          "Automatically revoked after three unacknowledged external deliveries.",
        at,
      });
      created.push({
        ...base,
        receiptId: randomUUID(),
        action: "AUTO_SUSPEND",
        reason:
          "Connector live activation revoked after three acknowledgment timeouts.",
      });
    }
  }
  if (created.length) write([...read(), ...created]);
  return created;
}
export function listExternalNotificationAssuranceReceipts() {
  return read();
}
