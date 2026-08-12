import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { listExternalNotificationCorrectiveActionReceipts } from "./officialEvidenceExternalNotificationCorrectiveAction";
import { listExternalNotificationCorrectiveActionEffectivenessReceipts } from "./officialEvidenceExternalNotificationCorrectiveActionEffectiveness";
import { listExternalNotificationTombstoneIncidentReceipts } from "./officialEvidenceExternalNotificationTombstoneIncident";
import { listExternalNotificationRetirementTombstoneReceipts } from "./officialEvidenceExternalNotificationRetirementTombstone";

export interface ExternalNotificationInstitutionalClosureAttestation {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  implementationHash: string;
  channel: "EMAIL" | "SMS" | "PAGER";
  action: "ATTEST_INSTITUTIONAL_CLOSURE";
  effectivenessClosureReceiptId: string;
  correctiveActionClosureReceiptId: string;
  incidentResolutionReceiptId: string;
  evidenceSnapshotHash: string;
  attestationScope: string;
  externalDeliveryBlocked: true;
  internalQueueAuthoritative: true;
  independentFromEffectivenessCloser: true;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}

const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-institutional-closure.json",
);

const read = (): ExternalNotificationInstitutionalClosureAttestation[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
};

const write = (rows: ExternalNotificationInstitutionalClosureAttestation[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function attestExternalNotificationInstitutionalClosure(input: {
  registrationId: string;
  attestationScope: string;
  externalDeliveryBlocked: boolean;
  internalQueueAuthoritative: boolean;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationInstitutionalClosureAttestation {
  if (
    !input.actorId.trim() ||
    !input.actorName.trim() ||
    !input.reason.trim() ||
    !input.attestationScope.trim()
  )
    throw new Error(
      "Institutional closure requires an attributed independent actor, scope, and written reason.",
    );
  if (!input.externalDeliveryBlocked)
    throw new Error(
      "External delivery must remain blocked at institutional closure.",
    );
  if (!input.internalQueueAuthoritative)
    throw new Error(
      "The internal Module 45 queue must remain authoritative at institutional closure.",
    );

  const effectiveness = [
    ...listExternalNotificationCorrectiveActionEffectivenessReceipts(),
  ]
    .reverse()
    .find(
      (row) =>
        row.registrationId === input.registrationId &&
        row.action === "CLOSE_EFFECTIVENESS_WINDOW",
    );
  if (!effectiveness)
    throw new Error(
      "Institutional closure requires a closed corrective-action effectiveness window.",
    );
  if (effectiveness.actorId === input.actorId)
    throw new Error(
      "Institutional closure must be attested by an actor independent from the effectiveness-window closer.",
    );

  const corrective = [...listExternalNotificationCorrectiveActionReceipts()]
    .reverse()
    .find(
      (row) =>
        row.registrationId === input.registrationId &&
        row.action === "CLOSE_CORRECTIVE_ACTION",
    );
  if (!corrective)
    throw new Error(
      "Institutional closure requires a closed corrective action.",
    );
  const incident = [...listExternalNotificationTombstoneIncidentReceipts()]
    .reverse()
    .find(
      (row) =>
        row.registrationId === input.registrationId && row.action === "RESOLVE",
    );
  if (!incident)
    throw new Error(
      "Institutional closure requires a resolved tombstone incident.",
    );
  const latestIncident = [
    ...listExternalNotificationTombstoneIncidentReceipts(),
  ]
    .reverse()
    .find((row) => row.registrationId === input.registrationId);
  if (latestIncident?.action !== "RESOLVE")
    throw new Error(
      "Institutional closure is blocked while the latest tombstone incident is unresolved.",
    );

  const prior = read();
  const existing = [...prior]
    .reverse()
    .find((row) => row.registrationId === input.registrationId);
  if (existing) return existing;

  const evidence = {
    incident: listExternalNotificationTombstoneIncidentReceipts().filter(
      (row) => row.registrationId === input.registrationId,
    ),
    corrective: listExternalNotificationCorrectiveActionReceipts().filter(
      (row) => row.registrationId === input.registrationId,
    ),
    effectiveness:
      listExternalNotificationCorrectiveActionEffectivenessReceipts().filter(
        (row) => row.registrationId === input.registrationId,
      ),
    tombstone: listExternalNotificationRetirementTombstoneReceipts().filter(
      (row) => row.registrationId === input.registrationId,
    ),
  };
  const row: ExternalNotificationInstitutionalClosureAttestation = {
    receiptId: randomUUID(),
    registrationId: effectiveness.registrationId,
    connectorId: effectiveness.connectorId,
    implementationHash: effectiveness.implementationHash,
    channel: effectiveness.channel,
    action: "ATTEST_INSTITUTIONAL_CLOSURE",
    effectivenessClosureReceiptId: effectiveness.receiptId,
    correctiveActionClosureReceiptId: corrective.receiptId,
    incidentResolutionReceiptId: incident.receiptId,
    evidenceSnapshotHash: hash(evidence),
    attestationScope: input.attestationScope.trim(),
    externalDeliveryBlocked: true,
    internalQueueAuthoritative: true,
    independentFromEffectivenessCloser: true,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...prior, row]);
  return row;
}

export function listExternalNotificationInstitutionalClosureAttestations() {
  return read();
}
export function externalNotificationInstitutionallyClosed(
  registrationId: string,
): boolean {
  return read().some((row) => row.registrationId === registrationId);
}
