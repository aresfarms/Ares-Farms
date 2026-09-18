import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";

export type ExternalNotificationChannel = "EMAIL" | "SMS" | "PAGER";
export type ExternalConnectorDecision = "APPROVE" | "SUSPEND";

export interface ExternalNotificationConnectorRegistration {
  registrationId: string;
  connectorId: string;
  channel: ExternalNotificationChannel;
  implementationHash: string;
  credentialMode: "SECRET_MANAGER_REFERENCE";
  deliverySemantics: "AT_LEAST_ONCE_WITH_IDEMPOTENCY_KEY";
  replayEvidenceHash: string;
  registeredAt: string;
}

export interface ExternalNotificationConnectorReceipt {
  receiptId: string;
  registrationId: string;
  connectorId: string;
  channel: ExternalNotificationChannel;
  implementationHash: string;
  action: "REGISTER" | ExternalConnectorDecision;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "external-notification-connectors.json",
);

type State = {
  registrations: ExternalNotificationConnectorRegistration[];
  receipts: ExternalNotificationConnectorReceipt[];
};

const read = (): State => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
  } catch {
    return { registrations: [], receipts: [] };
  }
};

const write = (state: State) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

export function registerExternalNotificationConnector(input: {
  connectorId: string;
  channel: ExternalNotificationChannel;
  implementationHash: string;
  replayEvidence: string;
  at?: string;
}): ExternalNotificationConnectorRegistration {
  if (
    !input.connectorId.trim() ||
    !/^[a-f0-9]{64}$/i.test(input.implementationHash) ||
    !input.replayEvidence.trim()
  )
    throw new Error(
      "Connector registration requires an ID, SHA-256 implementation hash, and replay evidence.",
    );
  const state = read();
  const existing = [...state.registrations]
    .reverse()
    .find(
      (row) =>
        row.connectorId === input.connectorId &&
        row.implementationHash === input.implementationHash.toLowerCase(),
    );
  if (existing) return existing;
  const registration: ExternalNotificationConnectorRegistration = {
    registrationId: randomUUID(),
    connectorId: input.connectorId.trim(),
    channel: input.channel,
    implementationHash: input.implementationHash.toLowerCase(),
    credentialMode: "SECRET_MANAGER_REFERENCE",
    deliverySemantics: "AT_LEAST_ONCE_WITH_IDEMPOTENCY_KEY",
    replayEvidenceHash: sha(input.replayEvidence),
    registeredAt: input.at ?? new Date().toISOString(),
  };
  const receipt: ExternalNotificationConnectorReceipt = {
    receiptId: randomUUID(),
    registrationId: registration.registrationId,
    connectorId: registration.connectorId,
    channel: registration.channel,
    implementationHash: registration.implementationHash,
    action: "REGISTER",
    actorId: "system:connector-registry",
    actorName: "connector-registry",
    at: registration.registeredAt,
    reason: "Registered external notification connector for governed review.",
  };
  write({
    registrations: [...state.registrations, registration],
    receipts: [...state.receipts, receipt],
  });
  return registration;
}

export function decideExternalNotificationConnector(input: {
  registrationId: string;
  decision: ExternalConnectorDecision;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): ExternalNotificationConnectorReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "Connector decision requires an attributed actor and reason.",
    );
  const state = read();
  const registration = state.registrations.find(
    (row) => row.registrationId === input.registrationId,
  );
  if (!registration)
    throw new Error("External notification connector registration not found.");
  const latest = [...state.registrations]
    .reverse()
    .find((row) => row.connectorId === registration.connectorId);
  if (latest?.registrationId !== registration.registrationId)
    throw new Error(
      "Only the current connector implementation may be reviewed.",
    );
  const receipt: ExternalNotificationConnectorReceipt = {
    receiptId: randomUUID(),
    registrationId: registration.registrationId,
    connectorId: registration.connectorId,
    channel: registration.channel,
    implementationHash: registration.implementationHash,
    action: input.decision,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write({ ...state, receipts: [...state.receipts, receipt] });
  return receipt;
}

export function listExternalNotificationConnectorRegistrations() {
  return read().registrations;
}

export function listExternalNotificationConnectorReceipts() {
  return read().receipts;
}

export function approvedExternalNotificationConnectors() {
  const state = read();
  return state.registrations.filter((registration) => {
    const latestRegistration = [...state.registrations]
      .reverse()
      .find((row) => row.connectorId === registration.connectorId);
    const latestDecision = [...state.receipts]
      .reverse()
      .find(
        (row) =>
          row.registrationId === registration.registrationId &&
          (row.action === "APPROVE" || row.action === "SUSPEND"),
      );
    return (
      latestRegistration?.registrationId === registration.registrationId &&
      latestDecision?.action === "APPROVE"
    );
  });
}

export function externalNotificationDeliveryPermitted(
  channel: ExternalNotificationChannel,
): boolean {
  return approvedExternalNotificationConnectors().some(
    (registration) => registration.channel === channel,
  );
}
