import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationRetirementClosureReceipts } from "./officialEvidenceExternalNotificationRetirementClosure";
import { listExternalNotificationActivationReceipts } from "./officialEvidenceExternalNotificationActivation";
import { listExternalNotificationDryRuns } from "./officialEvidenceExternalNotificationDryRun";
import { listExternalNotificationDeliveryReceipts } from "./officialEvidenceExternalNotificationDelivery";
import { listExternalNotificationReinstatementReceipts } from "./officialEvidenceExternalNotificationReinstatement";
import { listExternalNotificationConnectorReceipts } from "./officialEvidenceExternalNotificationConnector";

export type RetirementTombstoneAction = "TOMBSTONE_PASS" | "TOMBSTONE_FAIL";

export interface ExternalNotificationRetirementTombstoneReceipt {
  receiptId: string;
  closureReceiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: RetirementTombstoneAction;
  prohibitedEventCount: number;
  prohibitedEventRefs: string[];
  checkedThrough: string;
  actorId: "system:retirement-tombstone";
  actorName: "retirement-tombstone";
  at: string;
  reason: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-retirement-tombstone.json",
);

const read = (): ExternalNotificationRetirementTombstoneReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationRetirementTombstoneReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

function prohibitedRefsAfter(registrationId: string, closedAt: string): string[] {
  const after = (at: string) => Date.parse(at) > Date.parse(closedAt);
  const refs: string[] = [];

  for (const row of listExternalNotificationConnectorReceipts())
    if (
      row.registrationId === registrationId &&
      after(row.at) &&
      (row.action === "APPROVE" || row.action === "REGISTER")
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

export function evaluateExternalNotificationRetirementTombstones(
  at = new Date().toISOString(),
): ExternalNotificationRetirementTombstoneReceipt[] {
  const prior = read();
  const created: ExternalNotificationRetirementTombstoneReceipt[] = [];
  for (const closure of listExternalNotificationRetirementClosureReceipts()) {
    const prohibitedEventRefs = prohibitedRefsAfter(closure.registrationId, closure.at);
    const action: RetirementTombstoneAction =
      prohibitedEventRefs.length === 0 ? "TOMBSTONE_PASS" : "TOMBSTONE_FAIL";
    const latest = [...prior, ...created]
      .reverse()
      .find((row) => row.registrationId === closure.registrationId);
    if (
      latest?.action === action &&
      latest.prohibitedEventRefs.join("|") === prohibitedEventRefs.join("|")
    ) continue;
    created.push({
      receiptId: randomUUID(),
      closureReceiptId: closure.receiptId,
      registrationId: closure.registrationId,
      connectorId: closure.connectorId,
      implementationHash: closure.implementationHash,
      channel: closure.channel,
      action,
      prohibitedEventCount: prohibitedEventRefs.length,
      prohibitedEventRefs,
      checkedThrough: at,
      actorId: "system:retirement-tombstone",
      actorName: "retirement-tombstone",
      at,
      reason:
        action === "TOMBSTONE_PASS"
          ? "No post-closure resurrection event was detected."
          : "Post-closure connector resurrection evidence was detected; the registration remains permanently blocked.",
    });
  }
  if (created.length) write([...prior, ...created]);
  return created;
}

export function listExternalNotificationRetirementTombstoneReceipts() {
  return read();
}

export function retirementTombstoneHealthy(registrationId: string): boolean {
  const latest = [...read()].reverse().find((row) => row.registrationId === registrationId);
  return latest?.action === "TOMBSTONE_PASS";
}
