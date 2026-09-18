import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationTombstoneIncidentReceipts } from "./officialEvidenceExternalNotificationTombstoneIncident";
import { listExternalNotificationConnectorReceipts } from "./officialEvidenceExternalNotificationConnector";
import { listExternalNotificationActivationReceipts } from "./officialEvidenceExternalNotificationActivation";
import { listExternalNotificationDryRuns } from "./officialEvidenceExternalNotificationDryRun";
import { listExternalNotificationDeliveryReceipts } from "./officialEvidenceExternalNotificationDelivery";
import { listExternalNotificationReinstatementReceipts } from "./officialEvidenceExternalNotificationReinstatement";

export type CorrectiveActionReceiptAction =
  | "OPEN_CORRECTIVE_ACTION"
  | "VERIFY_REMEDIATION"
  | "CLOSE_CORRECTIVE_ACTION";

export interface ExternalNotificationCorrectiveActionReceipt {
  receiptId: string;
  incidentResolutionReceiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: CorrectiveActionReceiptAction;
  rootCauseRef: string | null;
  credentialAuditRef: string | null;
  providerAuditRef: string | null;
  routingAuditRef: string | null;
  secretAuditRef: string | null;
  codeChangeRef: string | null;
  recurrenceEventCount: number;
  recurrenceEventRefs: string[];
  externalDeliveryBlocked: true;
  internalQueueAuthoritative: true;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-corrective-actions.json",
);

const read = (): ExternalNotificationCorrectiveActionReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationCorrectiveActionReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

function latestResolvedIncident(registrationId: string) {
  return [...listExternalNotificationTombstoneIncidentReceipts()]
    .reverse()
    .find(
      (receipt) =>
        receipt.registrationId === registrationId && receipt.action === "RESOLVE",
    ) ?? null;
}

function recurrenceRefsAfter(registrationId: string, resolvedAt: string): string[] {
  const after = (at: string) => Date.parse(at) > Date.parse(resolvedAt);
  const refs: string[] = [];
  for (const row of listExternalNotificationConnectorReceipts())
    if (
      row.registrationId === registrationId &&
      after(row.at) &&
      (row.action === "REGISTER" || row.action === "APPROVE")
    ) refs.push(`connector:${row.receiptId}:${row.action}`);
  for (const row of listExternalNotificationActivationReceipts())
    if (row.registrationId === registrationId && after(row.at) && row.action === "ACTIVATE")
      refs.push(`activation:${row.receiptId}:${row.action}`);
  for (const row of listExternalNotificationDryRuns())
    if (row.registrationId === registrationId && after(row.at))
      refs.push(`dry-run:${row.receiptId}:${row.providerStatus}`);
  for (const row of listExternalNotificationDeliveryReceipts())
    if (row.registrationId === registrationId && after(row.at))
      refs.push(`delivery:${row.receiptId}:${row.action}`);
  for (const row of listExternalNotificationReinstatementReceipts())
    if (row.registrationId === registrationId && after(row.at))
      refs.push(`reinstatement:${row.receiptId}:${row.action}`);
  return refs.sort();
}

const requiredRef = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} evidence reference is required.`);
  return value.trim();
};

export function openExternalNotificationCorrectiveAction(input: {
  registrationId: string;
  at?: string;
}): ExternalNotificationCorrectiveActionReceipt {
  const resolution = latestResolvedIncident(input.registrationId);
  if (!resolution)
    throw new Error("Corrective action requires a resolved tombstone incident.");
  const prior = read();
  const existing = [...prior]
    .reverse()
    .find(
      (receipt) =>
        receipt.incidentResolutionReceiptId === resolution.receiptId &&
        receipt.action === "OPEN_CORRECTIVE_ACTION",
    );
  if (existing) return existing;
  const recurrenceEventRefs = recurrenceRefsAfter(
    resolution.registrationId,
    resolution.at,
  );
  const row: ExternalNotificationCorrectiveActionReceipt = {
    receiptId: randomUUID(),
    incidentResolutionReceiptId: resolution.receiptId,
    registrationId: resolution.registrationId,
    connectorId: resolution.connectorId,
    implementationHash: resolution.implementationHash,
    channel: resolution.channel,
    action: "OPEN_CORRECTIVE_ACTION",
    rootCauseRef: null,
    credentialAuditRef: null,
    providerAuditRef: null,
    routingAuditRef: null,
    secretAuditRef: null,
    codeChangeRef: null,
    recurrenceEventCount: recurrenceEventRefs.length,
    recurrenceEventRefs,
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "system:corrective-action",
    actorName: "corrective-action",
    at: input.at ?? new Date().toISOString(),
    reason:
      "Opened mandatory corrective-action review after tombstone incident resolution; permanent retirement remains enforced.",
  };
  write([...prior, row]);
  return row;
}

export function verifyExternalNotificationCorrectiveAction(input: {
  registrationId: string;
  rootCauseRef: string;
  credentialAuditRef: string;
  providerAuditRef: string;
  routingAuditRef: string;
  secretAuditRef: string;
  codeChangeRef?: string | null;
  externalDeliveryBlocked: boolean;
  internalQueueAuthoritative: boolean;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationCorrectiveActionReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Corrective-action verification requires an attributed actor and written reason.");
  if (!input.externalDeliveryBlocked)
    throw new Error("External delivery must remain blocked during corrective action.");
  if (!input.internalQueueAuthoritative)
    throw new Error("The internal Module 45 queue must remain authoritative.");
  const resolution = latestResolvedIncident(input.registrationId);
  if (!resolution)
    throw new Error("Corrective-action verification requires a resolved tombstone incident.");
  const prior = read();
  const opened = [...prior]
    .reverse()
    .find(
      (receipt) =>
        receipt.incidentResolutionReceiptId === resolution.receiptId &&
        receipt.action === "OPEN_CORRECTIVE_ACTION",
    );
  if (!opened)
    throw new Error("Corrective action must be opened before remediation verification.");
  const recurrenceEventRefs = recurrenceRefsAfter(
    resolution.registrationId,
    resolution.at,
  );
  if (recurrenceEventRefs.length > 0)
    throw new Error(
      `Corrective action cannot be verified while ${recurrenceEventRefs.length} post-resolution resurrection event(s) remain.`,
    );
  const row: ExternalNotificationCorrectiveActionReceipt = {
    ...opened,
    receiptId: randomUUID(),
    action: "VERIFY_REMEDIATION",
    rootCauseRef: requiredRef(input.rootCauseRef, "Root cause"),
    credentialAuditRef: requiredRef(input.credentialAuditRef, "Credential audit"),
    providerAuditRef: requiredRef(input.providerAuditRef, "Provider audit"),
    routingAuditRef: requiredRef(input.routingAuditRef, "Routing audit"),
    secretAuditRef: requiredRef(input.secretAuditRef, "Secret audit"),
    codeChangeRef: input.codeChangeRef?.trim() || null,
    recurrenceEventCount: 0,
    recurrenceEventRefs: [],
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...prior, row]);
  return row;
}

export function closeExternalNotificationCorrectiveAction(input: {
  registrationId: string;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationCorrectiveActionReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Corrective-action closure requires an attributed actor and written reason.");
  const resolution = latestResolvedIncident(input.registrationId);
  if (!resolution)
    throw new Error("Corrective-action closure requires a resolved tombstone incident.");
  const prior = read();
  const latest = [...prior]
    .reverse()
    .find((receipt) => receipt.incidentResolutionReceiptId === resolution.receiptId);
  if (!latest || latest.action !== "VERIFY_REMEDIATION")
    throw new Error("Corrective action requires verified remediation before closure.");
  const recurrenceEventRefs = recurrenceRefsAfter(
    resolution.registrationId,
    resolution.at,
  );
  if (recurrenceEventRefs.length > 0)
    throw new Error("Corrective action cannot close while recurrence evidence exists.");
  const row: ExternalNotificationCorrectiveActionReceipt = {
    ...latest,
    receiptId: randomUUID(),
    action: "CLOSE_CORRECTIVE_ACTION",
    recurrenceEventCount: 0,
    recurrenceEventRefs: [],
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...prior, row]);
  return row;
}

export function listExternalNotificationCorrectiveActionReceipts() {
  return read();
}

export function correctiveActionStatus(registrationId: string):
  | "NONE"
  | "OPEN"
  | "VERIFIED"
  | "CLOSED" {
  const latest = [...read()]
    .reverse()
    .find((receipt) => receipt.registrationId === registrationId);
  if (!latest) return "NONE";
  if (latest.action === "OPEN_CORRECTIVE_ACTION") return "OPEN";
  if (latest.action === "VERIFY_REMEDIATION") return "VERIFIED";
  return "CLOSED";
}
