import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

export interface OfficialEvidenceQuarantineRecord {
  quarantineId: string;
  sourceId: OfficialEvidenceSourceId;
  sourceVersion: string;
  detectedAt: string;
  reasons: string[];
  reasonHash: string;
  receiptId: string | null;
  connectorId: string | null;
  parserVersion: string | null;
  implementationHash: string | null;
  status: "open";
}

const FILE = runtimeStatePath("official-evidence", "read-quarantine.json");

export function readOfficialEvidenceQuarantine(): OfficialEvidenceQuarantineRecord[] {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")) as OfficialEvidenceQuarantineRecord[]; }
  catch { return []; }
}

export function recordOfficialEvidenceQuarantine(input: Omit<OfficialEvidenceQuarantineRecord, "quarantineId" | "detectedAt" | "reasonHash" | "status"> & { detectedAt?: string }): OfficialEvidenceQuarantineRecord {
  const reasons = [...new Set(input.reasons)].sort();
  const reasonHash = createHash("sha256").update(JSON.stringify(reasons)).digest("hex");
  const records = readOfficialEvidenceQuarantine();
  const existing = records.find((item) => item.sourceId === input.sourceId && item.sourceVersion === input.sourceVersion && item.reasonHash === reasonHash);
  if (existing) return existing;
  const record: OfficialEvidenceQuarantineRecord = { ...input, reasons, reasonHash, quarantineId: randomUUID(), detectedAt: input.detectedAt ?? new Date().toISOString(), status: "open" };
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify([...records, record], null, 2) + "\n", "utf8");
  fs.renameSync(temp, FILE);
  return record;
}
