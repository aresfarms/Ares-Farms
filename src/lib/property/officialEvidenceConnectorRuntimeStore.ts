import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import type { OfficialEvidenceConnectorRegistration } from "./officialEvidenceConnectorRegistry";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

export interface ConnectorReviewReceipt {
  receiptId: string;
  connectorId: string;
  sourceId: OfficialEvidenceSourceId;
  decision: "REGISTER" | "CHANGE_REVIEW_REQUIRED" | "APPROVE" | "SUSPEND";
  actorId: string;
  actorName: string;
  decidedAt: string;
  reason: string;
  parserVersion: string;
  implementationHash?: string;
}

export interface DurableConnectorRegistryState {
  registrations: OfficialEvidenceConnectorRegistration[];
  receipts: ConnectorReviewReceipt[];
}

const FILE = runtimeStatePath("official-evidence", "connector-registry.json");

export function readDurableConnectorRegistry(): DurableConnectorRegistryState {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")) as DurableConnectorRegistryState; }
  catch { return { registrations: [], receipts: [] }; }
}

export function writeDurableConnectorRegistry(state: DurableConnectorRegistryState): void {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, FILE);
}
