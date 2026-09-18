import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationCorrectiveActionReceipts } from "./officialEvidenceExternalNotificationCorrectiveAction";
import { listExternalNotificationConnectorReceipts } from "./officialEvidenceExternalNotificationConnector";
import { listExternalNotificationActivationReceipts } from "./officialEvidenceExternalNotificationActivation";
import { listExternalNotificationDryRuns } from "./officialEvidenceExternalNotificationDryRun";
import { listExternalNotificationDeliveryReceipts } from "./officialEvidenceExternalNotificationDelivery";
import { listExternalNotificationReinstatementReceipts } from "./officialEvidenceExternalNotificationReinstatement";

export type CorrectiveActionEffectivenessAction =
  | "OPEN_EFFECTIVENESS_WINDOW"
  | "EFFECTIVENESS_CHECKPOINT_PASS"
  | "EFFECTIVENESS_CHECKPOINT_FAIL"
  | "CLOSE_EFFECTIVENESS_WINDOW";

export interface ExternalNotificationCorrectiveActionEffectivenessReceipt {
  receiptId: string;
  correctiveActionClosureReceiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: CorrectiveActionEffectivenessAction;
  checkpointNumber: number;
  requiredCheckpoints: 3;
  observationWindowHours: 72;
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
  "external-notification-corrective-action-effectiveness.json",
);

const read = (): ExternalNotificationCorrectiveActionEffectivenessReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationCorrectiveActionEffectivenessReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

function latestClosedCorrectiveAction(registrationId: string) {
  return [...listExternalNotificationCorrectiveActionReceipts()]
    .reverse()
    .find(
      (receipt) =>
        receipt.registrationId === registrationId &&
        receipt.action === "CLOSE_CORRECTIVE_ACTION",
    ) ?? null;
}

function recurrenceRefsAfter(registrationId: string, afterIso: string): string[] {
  const after = (at: string) => Date.parse(at) > Date.parse(afterIso);
  const refs: string[] = [];
  for (const row of listExternalNotificationConnectorReceipts())
    if (
      row.registrationId === registrationId && after(row.at) &&
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

export function openExternalNotificationCorrectiveActionEffectivenessWindow(input: {
  registrationId: string;
  at?: string;
}): ExternalNotificationCorrectiveActionEffectivenessReceipt {
  const closure = latestClosedCorrectiveAction(input.registrationId);
  if (!closure)
    throw new Error("Effectiveness monitoring requires a closed corrective action.");
  const prior = read();
  const existing = [...prior].reverse().find(
    (receipt) =>
      receipt.correctiveActionClosureReceiptId === closure.receiptId &&
      receipt.action === "OPEN_EFFECTIVENESS_WINDOW",
  );
  if (existing) return existing;
  const recurrenceEventRefs = recurrenceRefsAfter(closure.registrationId, closure.at);
  const row: ExternalNotificationCorrectiveActionEffectivenessReceipt = {
    receiptId: randomUUID(),
    correctiveActionClosureReceiptId: closure.receiptId,
    registrationId: closure.registrationId,
    connectorId: closure.connectorId,
    implementationHash: closure.implementationHash,
    channel: closure.channel,
    action: "OPEN_EFFECTIVENESS_WINDOW",
    checkpointNumber: 0,
    requiredCheckpoints: 3,
    observationWindowHours: 72,
    recurrenceEventCount: recurrenceEventRefs.length,
    recurrenceEventRefs,
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    actorId: "system:corrective-action-effectiveness",
    actorName: "corrective-action-effectiveness",
    at: input.at ?? new Date().toISOString(),
    reason: "Opened mandatory 72-hour corrective-action effectiveness window.",
  };
  write([...prior, row]);
  return row;
}

export function evaluateExternalNotificationCorrectiveActionEffectiveness(input: {
  registrationId: string;
  externalDeliveryBlocked: boolean;
  internalQueueAuthoritative: boolean;
  at?: string;
}): ExternalNotificationCorrectiveActionEffectivenessReceipt {
  if (!input.externalDeliveryBlocked)
    throw new Error("External delivery must remain blocked during effectiveness monitoring.");
  if (!input.internalQueueAuthoritative)
    throw new Error("The internal Module 45 queue must remain authoritative.");
  const closure = latestClosedCorrectiveAction(input.registrationId);
  if (!closure)
    throw new Error("Effectiveness monitoring requires a closed corrective action.");
  const prior = read();
  const opened = [...prior].reverse().find(
    (receipt) =>
      receipt.correctiveActionClosureReceiptId === closure.receiptId &&
      receipt.action === "OPEN_EFFECTIVENESS_WINDOW",
  );
  if (!opened)
    throw new Error("Effectiveness window must be opened before checkpoint evaluation.");
  const latest = [...prior].reverse().find(
    (receipt) => receipt.correctiveActionClosureReceiptId === closure.receiptId,
  );
  if (latest?.action === "CLOSE_EFFECTIVENESS_WINDOW")
    throw new Error("A closed effectiveness window cannot be changed.");
  const at = input.at ?? new Date().toISOString();
  const checkpointNumber = Math.min(3, (latest?.checkpointNumber ?? 0) + 1);
  const minimumAt = Date.parse(opened.at) + checkpointNumber * 24 * 60 * 60 * 1000;
  if (Date.parse(at) < minimumAt)
    throw new Error(`Checkpoint ${checkpointNumber} cannot occur before its 24-hour interval.`);
  const recurrenceEventRefs = recurrenceRefsAfter(closure.registrationId, closure.at);
  const passed = recurrenceEventRefs.length === 0;
  const row: ExternalNotificationCorrectiveActionEffectivenessReceipt = {
    ...opened,
    receiptId: randomUUID(),
    action: passed ? "EFFECTIVENESS_CHECKPOINT_PASS" : "EFFECTIVENESS_CHECKPOINT_FAIL",
    checkpointNumber,
    recurrenceEventCount: recurrenceEventRefs.length,
    recurrenceEventRefs,
    actorId: "system:corrective-action-effectiveness",
    actorName: "corrective-action-effectiveness",
    at,
    reason: passed
      ? `Corrective-action effectiveness checkpoint ${checkpointNumber} passed with no recurrence evidence.`
      : `Corrective-action effectiveness checkpoint ${checkpointNumber} failed because recurrence evidence was detected.`,
  };
  write([...prior, row]);
  return row;
}

export function closeExternalNotificationCorrectiveActionEffectivenessWindow(input: {
  registrationId: string;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationCorrectiveActionEffectivenessReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Effectiveness closure requires an attributed actor and written reason.");
  const closure = latestClosedCorrectiveAction(input.registrationId);
  if (!closure)
    throw new Error("Effectiveness closure requires a closed corrective action.");
  const prior = read();
  const relevant = prior.filter(
    (receipt) => receipt.correctiveActionClosureReceiptId === closure.receiptId,
  );
  const latest = relevant.at(-1);
  if (latest?.action === "CLOSE_EFFECTIVENESS_WINDOW") return latest;
  const passes = relevant.filter(
    (receipt) => receipt.action === "EFFECTIVENESS_CHECKPOINT_PASS",
  );
  if (passes.length < 3 || latest?.checkpointNumber !== 3)
    throw new Error("Effectiveness closure requires three completed clean checkpoints.");
  if (relevant.some((receipt) => receipt.action === "EFFECTIVENESS_CHECKPOINT_FAIL"))
    throw new Error("Effectiveness closure is blocked by a failed checkpoint.");
  const recurrenceEventRefs = recurrenceRefsAfter(closure.registrationId, closure.at);
  if (recurrenceEventRefs.length > 0)
    throw new Error("Effectiveness closure is blocked by recurrence evidence.");
  const row: ExternalNotificationCorrectiveActionEffectivenessReceipt = {
    ...latest,
    receiptId: randomUUID(),
    action: "CLOSE_EFFECTIVENESS_WINDOW",
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

export function listExternalNotificationCorrectiveActionEffectivenessReceipts() {
  return read();
}

export function correctiveActionEffectivenessStatus(registrationId: string):
  | "NONE" | "OPEN" | "CHECKPOINT_1" | "CHECKPOINT_2" | "CHECKPOINT_3" | "FAILED" | "CLOSED" {
  const latest = [...read()].reverse().find((receipt) => receipt.registrationId === registrationId);
  if (!latest) return "NONE";
  if (latest.action === "OPEN_EFFECTIVENESS_WINDOW") return "OPEN";
  if (latest.action === "EFFECTIVENESS_CHECKPOINT_FAIL") return "FAILED";
  if (latest.action === "CLOSE_EFFECTIVENESS_WINDOW") return "CLOSED";
  return `CHECKPOINT_${latest.checkpointNumber}` as "CHECKPOINT_1" | "CHECKPOINT_2" | "CHECKPOINT_3";
}
