import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { approvedExternalNotificationConnectors } from "./officialEvidenceExternalNotificationConnector";

export interface ExternalNotificationDryRunReceipt {
  receiptId: string;
  connectorId: string;
  registrationId: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  implementationHash: string;
  notificationId: string;
  idempotencyKey: string;
  payloadHash: string;
  payloadFields: string[];
  providerStatus: "ACCEPTED" | "REJECTED";
  providerReference: string | null;
  at: string;
  liveDeliveryPermitted: false;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-dry-runs.json",
);
const read = (): ExternalNotificationDryRunReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};
const write = (rows: ExternalNotificationDryRunReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
export function buildMinimalExternalNotificationPayload(input: {
  notificationId: string;
  severity: "P1" | "P2";
  slaAction: string;
  occurredAt: string;
}) {
  return {
    notificationId: input.notificationId,
    severity: input.severity,
    event: input.slaAction,
    occurredAt: input.occurredAt,
  };
}
export function runExternalNotificationDryRun(input: {
  connectorId: string;
  notificationId: string;
  severity: "P1" | "P2";
  slaAction: string;
  occurredAt: string;
  send: (
    payload: Record<string, string>,
    idempotencyKey: string,
  ) => { accepted: boolean; reference?: string };
  at?: string;
}): ExternalNotificationDryRunReceipt {
  const connector = approvedExternalNotificationConnectors().find(
    (x) => x.connectorId === input.connectorId,
  );
  if (!connector)
    throw new Error(
      "Dry run requires a currently approved connector implementation.",
    );
  const payload = buildMinimalExternalNotificationPayload(input);
  const forbidden = [
    "incidentId",
    "failedJobIds",
    "blockedJobIds",
    "reason",
    "actorName",
  ];
  if (forbidden.some((k) => k in payload))
    throw new Error("External payload contains prohibited incident detail.");
  const idempotencyKey = sha(
    `${connector.registrationId}:${input.notificationId}`,
  );
  const existing = read().find((r) => r.idempotencyKey === idempotencyKey);
  if (existing) return existing;
  const result = input.send(payload, idempotencyKey);
  const row: ExternalNotificationDryRunReceipt = {
    receiptId: randomUUID(),
    connectorId: connector.connectorId,
    registrationId: connector.registrationId,
    channel: connector.channel,
    implementationHash: connector.implementationHash,
    notificationId: input.notificationId,
    idempotencyKey,
    payloadHash: sha(JSON.stringify(payload)),
    payloadFields: Object.keys(payload).sort(),
    providerStatus: result.accepted ? "ACCEPTED" : "REJECTED",
    providerReference: result.reference ?? null,
    at: input.at ?? new Date().toISOString(),
    liveDeliveryPermitted: false,
  };
  write([...read(), row]);
  return row;
}
export function listExternalNotificationDryRuns() {
  return read();
}
export function externalNotificationLiveDeliveryPermitted() {
  return false;
}
