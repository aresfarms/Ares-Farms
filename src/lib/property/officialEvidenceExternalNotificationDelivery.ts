import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { buildMinimalExternalNotificationPayload } from "./officialEvidenceExternalNotificationDryRun";
import { liveExternalNotificationConnectors } from "./officialEvidenceExternalNotificationActivation";

export interface ExternalNotificationDeliveryReceipt {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  implementationHash: string;
  notificationId: string;
  idempotencyKey: string;
  payloadHash: string;
  payloadFields: string[];
  action: "ATTEMPT" | "DELIVERED" | "REJECTED" | "FAILED" | "INTERNAL_FALLBACK";
  providerReference: string | null;
  at: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-deliveries.json",
);
const read = (): ExternalNotificationDeliveryReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};
const write = (rows: ExternalNotificationDeliveryReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
export function deliverExternalNotificationLive(input: {
  connectorId: string;
  notificationId: string;
  severity: "P1" | "P2";
  slaAction: string;
  occurredAt: string;
  at?: string;
  send: (
    payload: Record<string, string>,
    idempotencyKey: string,
  ) => { accepted: boolean; reference?: string };
  fallback: (notificationId: string, reason: string) => void;
}): ExternalNotificationDeliveryReceipt[] {
  const connector = liveExternalNotificationConnectors().find(
    (x) => x.connectorId === input.connectorId,
  );
  if (!connector)
    throw new Error(
      "Live external delivery requires a currently activated connector implementation.",
    );
  const payload = buildMinimalExternalNotificationPayload(input);
  const payloadFields = Object.keys(payload).sort();
  const permitted = ["event", "notificationId", "occurredAt", "severity"];
  if (payloadFields.join(",") !== permitted.join(","))
    throw new Error("Live external payload violates the minimized contract.");
  const idempotencyKey = sha(
    `${connector.registrationId}:${input.notificationId}:live`,
  );
  const prior = read().find(
    (r) => r.idempotencyKey === idempotencyKey && r.action === "DELIVERED",
  );
  if (prior) return [prior];
  const at = input.at ?? new Date().toISOString();
  const base = {
    registrationId: connector.registrationId,
    connectorId: connector.connectorId,
    channel: connector.channel,
    implementationHash: connector.implementationHash,
    notificationId: input.notificationId,
    idempotencyKey,
    payloadHash: sha(JSON.stringify(payload)),
    payloadFields,
    at,
  };
  const receipts: ExternalNotificationDeliveryReceipt[] = [
    {
      ...base,
      receiptId: randomUUID(),
      action: "ATTEMPT",
      providerReference: null,
      reason: "Attempted governed live external notification delivery.",
    },
  ];
  try {
    const result = input.send(payload, idempotencyKey);
    if (result.accepted)
      receipts.push({
        ...base,
        receiptId: randomUUID(),
        action: "DELIVERED",
        providerReference: result.reference ?? null,
        reason: "Provider accepted the governed live notification.",
      });
    else {
      receipts.push({
        ...base,
        receiptId: randomUUID(),
        action: "REJECTED",
        providerReference: result.reference ?? null,
        reason: "Provider rejected the governed live notification.",
      });
      input.fallback(
        input.notificationId,
        "External provider rejected delivery.",
      );
      receipts.push({
        ...base,
        receiptId: randomUUID(),
        action: "INTERNAL_FALLBACK",
        providerReference: null,
        reason: "Notification retained in the governed Module 45 queue.",
      });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    receipts.push({
      ...base,
      receiptId: randomUUID(),
      action: "FAILED",
      providerReference: null,
      reason,
    });
    input.fallback(input.notificationId, reason);
    receipts.push({
      ...base,
      receiptId: randomUUID(),
      action: "INTERNAL_FALLBACK",
      providerReference: null,
      reason:
        "Notification retained in the governed Module 45 queue after provider failure.",
    });
  }
  write([...read(), ...receipts]);
  return receipts;
}
export function listExternalNotificationDeliveryReceipts() {
  return read();
}
