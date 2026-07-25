import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import {
  listIncidentSlaReceipts,
  type IncidentSeverity,
  type IncidentSlaAction,
  type IncidentSlaReceipt,
} from "./officialEvidenceIncidentSla";

export type IncidentNotificationChannel = "INTERNAL_MODULE45_QUEUE";
export type IncidentNotificationAction =
  | "CREATE"
  | "DELIVERY_ATTEMPT"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "ACKNOWLEDGED";

export interface IncidentNotificationReceipt {
  receiptId: string;
  notificationId: string;
  incidentId: string;
  slaReceiptId: string;
  slaAction: IncidentSlaAction;
  severity: IncidentSeverity;
  action: IncidentNotificationAction;
  channel: IncidentNotificationChannel;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  payloadHash: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "incident-notification-receipts.json",
);
const read = (): IncidentNotificationReceipt[] => {
  try {
    return JSON.parse(
      fs.readFileSync(FILE, "utf8"),
    ) as IncidentNotificationReceipt[];
  } catch {
    return [];
  }
};
const write = (rows: IncidentNotificationReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const hashPayload = (sla: IncidentSlaReceipt) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        incidentId: sla.incidentId,
        slaReceiptId: sla.receiptId,
        action: sla.action,
        severity: sla.severity,
        acknowledgeBy: sla.acknowledgeBy,
        resolveBy: sla.resolveBy,
        reason: sla.reason,
      }),
    )
    .digest("hex");

export function syncIncidentNotificationPackets(
  at = new Date().toISOString(),
): IncidentNotificationReceipt[] {
  const rows = read();
  const created: IncidentNotificationReceipt[] = [];
  for (const sla of listIncidentSlaReceipts()) {
    if (
      rows.some(
        (r) => r.slaReceiptId === sla.receiptId && r.action === "CREATE",
      )
    )
      continue;
    created.push({
      receiptId: randomUUID(),
      notificationId: randomUUID(),
      incidentId: sla.incidentId,
      slaReceiptId: sla.receiptId,
      slaAction: sla.action,
      severity: sla.severity,
      action: "CREATE",
      channel: "INTERNAL_MODULE45_QUEUE",
      actorId: "system:incident-notification",
      actorName: "incident-notification",
      at,
      reason: `Created ${sla.severity} notification for ${sla.action}.`,
      payloadHash: hashPayload(sla),
    });
  }
  if (created.length) write([...rows, ...created]);
  return created;
}

export function deliverPendingIncidentNotifications(input?: {
  at?: string;
  deliver?: (notification: IncidentNotificationReceipt) => void;
}): IncidentNotificationReceipt[] {
  syncIncidentNotificationPackets(input?.at);
  let rows = read();
  const emitted: IncidentNotificationReceipt[] = [];
  const creates = rows.filter((r) => r.action === "CREATE");
  for (const created of creates) {
    const history = rows.filter(
      (r) => r.notificationId === created.notificationId,
    );
    if (
      history.some(
        (r) => r.action === "DELIVERED" || r.action === "ACKNOWLEDGED",
      )
    )
      continue;
    const at = input?.at ?? new Date().toISOString();
    const attempt: IncidentNotificationReceipt = {
      ...created,
      receiptId: randomUUID(),
      action: "DELIVERY_ATTEMPT",
      at,
      reason: "Attempted delivery to the governed Module 45 internal queue.",
    };
    emitted.push(attempt);
    try {
      input?.deliver?.(created);
      emitted.push({
        ...created,
        receiptId: randomUUID(),
        action: "DELIVERED",
        at,
        reason: "Delivered to the governed Module 45 internal review queue.",
      });
    } catch (error) {
      emitted.push({
        ...created,
        receiptId: randomUUID(),
        action: "DELIVERY_FAILED",
        at,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    rows = [...rows, ...emitted.slice(-2)];
  }
  if (emitted.length) write(read().concat(emitted));
  return emitted;
}

export function acknowledgeIncidentNotification(input: {
  notificationId: string;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): IncidentNotificationReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "Notification acknowledgment requires an actor and reason.",
    );
  const rows = read();
  const created = rows.find(
    (r) => r.notificationId === input.notificationId && r.action === "CREATE",
  );
  if (!created) throw new Error("Incident notification not found.");
  if (
    !rows.some(
      (r) =>
        r.notificationId === input.notificationId && r.action === "DELIVERED",
    )
  )
    throw new Error("Only a delivered notification can be acknowledged.");
  const existing = rows.find(
    (r) =>
      r.notificationId === input.notificationId && r.action === "ACKNOWLEDGED",
  );
  if (existing) return existing;
  const receipt: IncidentNotificationReceipt = {
    ...created,
    receiptId: randomUUID(),
    action: "ACKNOWLEDGED",
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...rows, receipt]);
  return receipt;
}

export function listIncidentNotificationReceipts(): IncidentNotificationReceipt[] {
  return read();
}

export function pendingIncidentNotifications(): IncidentNotificationReceipt[] {
  const rows = read();
  return rows.filter(
    (r) =>
      r.action === "CREATE" &&
      !rows.some(
        (x) =>
          x.notificationId === r.notificationId && x.action === "ACKNOWLEDGED",
      ),
  );
}
