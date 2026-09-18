import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { approvedExternalNotificationConnectors } from "./officialEvidenceExternalNotificationConnector";
import { listExternalNotificationDryRuns } from "./officialEvidenceExternalNotificationDryRun";
import { listExternalNotificationAssuranceReceipts } from "./officialEvidenceExternalNotificationAssurance";
import { decideExternalNotificationActivation } from "./officialEvidenceExternalNotificationActivation";
import { externalNotificationRegistrationRetired } from "./officialEvidenceExternalNotificationRetirementState";

export type ReinstatementAction =
  "REINSTATE" | "PROBATION_PASS" | "PROBATION_FAIL";
export interface ReinstatementReceipt {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: ReinstatementAction;
  dryRunReceiptId: string;
  probationRequiredDeliveries: number;
  probationAcknowledgedDeliveries: number;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-reinstatement.json",
);
const read = (): ReinstatementReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};
const write = (rows: ReinstatementReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
export function reinstateExternalNotificationConnector(input: {
  registrationId: string;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ReinstatementReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error("Reinstatement requires an attributed actor and reason.");
  const connector = approvedExternalNotificationConnectors().find(
    (x) => x.registrationId === input.registrationId,
  );
  if (!connector)
    throw new Error("Reinstatement requires a currently approved connector.");
  if (externalNotificationRegistrationRetired(connector.registrationId))
    throw new Error("Retired connector registrations cannot be reinstated.");
  const suspended = listExternalNotificationAssuranceReceipts().some(
    (x) =>
      x.registrationId === input.registrationId && x.action === "AUTO_SUSPEND",
  );
  if (!suspended)
    throw new Error(
      "Only an automatically suspended connector may be reinstated.",
    );
  const suspendedAt = [...listExternalNotificationAssuranceReceipts()]
    .reverse()
    .find(
      (x) =>
        x.registrationId === input.registrationId &&
        x.action === "AUTO_SUSPEND",
    )!.at;
  const dryRun = [...listExternalNotificationDryRuns()]
    .reverse()
    .find(
      (x) =>
        x.registrationId === input.registrationId &&
        x.providerStatus === "ACCEPTED" &&
        Date.parse(x.at) > Date.parse(suspendedAt),
    );
  if (!dryRun)
    throw new Error(
      "Reinstatement requires a fresh accepted dry run after suspension.",
    );
  const row: ReinstatementReceipt = {
    receiptId: randomUUID(),
    registrationId: connector.registrationId,
    connectorId: connector.connectorId,
    implementationHash: connector.implementationHash,
    channel: connector.channel,
    action: "REINSTATE",
    dryRunReceiptId: dryRun.receiptId,
    probationRequiredDeliveries: 3,
    probationAcknowledgedDeliveries: 0,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  decideExternalNotificationActivation({
    registrationId: connector.registrationId,
    action: "ACTIVATE",
    actorId: input.actorId,
    actorName: input.actorName,
    reason: "Reinstated into guarded probation after fresh dry run.",
    at: row.at,
  });
  write([...read(), row]);
  return row;
}
export function recordProbationOutcome(input: {
  registrationId: string;
  acknowledged: boolean;
  notificationId: string;
  at?: string;
}): ReinstatementReceipt {
  if (externalNotificationRegistrationRetired(input.registrationId))
    throw new Error("Retired connector registrations cannot continue probation.");
  const rows = read();
  const base = [...rows]
    .reverse()
    .find(
      (x) =>
        x.registrationId === input.registrationId && x.action === "REINSTATE",
    );
  if (!base) throw new Error("Connector is not in reinstatement probation.");
  const latest = [...rows]
    .reverse()
    .find((x) => x.registrationId === input.registrationId);
  if (
    latest &&
    (latest.action === "PROBATION_PASS" || latest.action === "PROBATION_FAIL")
  )
    return latest;
  const acknowledged =
    rows.filter(
      (x) =>
        x.registrationId === input.registrationId && x.action === "REINSTATE",
    ).length -
    1 +
    (input.acknowledged ? 1 : 0);
  if (!input.acknowledged) {
    decideExternalNotificationActivation({
      registrationId: input.registrationId,
      action: "REVOKE",
      actorId: "system:probation",
      actorName: "probation",
      reason: `Probation delivery ${input.notificationId} was not acknowledged.`,
      at: input.at,
    });
  }
  const action: ReinstatementAction = !input.acknowledged
    ? "PROBATION_FAIL"
    : acknowledged >= base.probationRequiredDeliveries
      ? "PROBATION_PASS"
      : "REINSTATE";
  const row: ReinstatementReceipt = {
    ...base,
    receiptId: randomUUID(),
    action,
    probationAcknowledgedDeliveries: acknowledged,
    actorId: "system:probation",
    actorName: "probation",
    at: input.at ?? new Date().toISOString(),
    reason: input.acknowledged
      ? `Probation delivery ${input.notificationId} acknowledged.`
      : `Probation delivery ${input.notificationId} failed; activation revoked.`,
  };
  write([...rows, row]);
  return row;
}
export function connectorInProbation(registrationId: string): boolean {
  const latest = [...read()]
    .reverse()
    .find((x) => x.registrationId === registrationId);
  return latest?.action === "REINSTATE";
}
export function probationRequiresInternalDualRoute(
  registrationId: string,
): boolean {
  return connectorInProbation(registrationId);
}
export function listExternalNotificationReinstatementReceipts() {
  return read();
}
