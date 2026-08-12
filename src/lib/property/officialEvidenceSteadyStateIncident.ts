import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";

export type SteadyStateIncidentAction =
  "OPEN" | "ACKNOWLEDGE" | "ESCALATE" | "RESOLVE";
export interface SteadyStateIncidentReceipt {
  receiptId: string;
  incidentId: string;
  action: SteadyStateIncidentAction;
  actorId: string;
  actorName: string;
  at: string;
  reason: string;
  executionId: string;
  finalPacketId: string;
  failedJobIds: string[];
  blockedJobIds: string[];
}
const FILE = runtimeStatePath(
  "official-evidence",
  "steady-state-incidents.json",
);
const read = (): SteadyStateIncidentReceipt[] => {
  try {
    return JSON.parse(
      fs.readFileSync(FILE, "utf8"),
    ) as SteadyStateIncidentReceipt[];
  } catch {
    return [];
  }
};
const write = (rows: SteadyStateIncidentReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
export function openSteadyStateIncident(input: {
  executionId: string;
  finalPacketId: string;
  failedJobIds: string[];
  blockedJobIds: string[];
  at?: string;
}): SteadyStateIncidentReceipt | null {
  if (!input.failedJobIds.length && !input.blockedJobIds.length) return null;
  const existing = read().find(
    (r) => r.executionId === input.executionId && r.action === "OPEN",
  );
  if (existing) return existing;
  const row: SteadyStateIncidentReceipt = {
    receiptId: randomUUID(),
    incidentId: randomUUID(),
    action: "OPEN",
    actorId: "system:steady-state-monitor",
    actorName: "steady-state-monitor",
    at: input.at ?? new Date().toISOString(),
    reason:
      "Recurring evidence recomputation produced failed or blocked jobs after the guarded rollback window.",
    executionId: input.executionId,
    finalPacketId: input.finalPacketId,
    failedJobIds: input.failedJobIds,
    blockedJobIds: input.blockedJobIds,
  };
  write([...read(), row]);
  return row;
}
export function decideSteadyStateIncident(input: {
  incidentId: string;
  action: Exclude<SteadyStateIncidentAction, "OPEN">;
  actorId: string;
  actorName: string;
  reason: string;
  at?: string;
}): SteadyStateIncidentReceipt {
  if (!input.actorId.trim() || !input.actorName.trim() || !input.reason.trim())
    throw new Error(
      "Incident decision requires an attributed actor and reason.",
    );
  const rows = read();
  const base = rows.find(
    (r) => r.incidentId === input.incidentId && r.action === "OPEN",
  );
  if (!base) throw new Error("Steady-state incident not found.");
  const latest = [...rows]
    .reverse()
    .find((r) => r.incidentId === input.incidentId);
  if (latest?.action === "RESOLVE" && input.action !== "ESCALATE")
    throw new Error("Resolved incident requires escalation to reopen.");
  const row: SteadyStateIncidentReceipt = {
    ...base,
    receiptId: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    actorName: input.actorName,
    at: input.at ?? new Date().toISOString(),
    reason: input.reason,
  };
  write([...rows, row]);
  return row;
}
export function listSteadyStateIncidentReceipts(): SteadyStateIncidentReceipt[] {
  return read();
}
export function openSteadyStateIncidents(): SteadyStateIncidentReceipt[] {
  const rows = read();
  const ids = [
    ...new Set(
      rows.filter((r) => r.action === "OPEN").map((r) => r.incidentId),
    ),
  ];
  return ids
    .map((id) => [...rows].reverse().find((r) => r.incidentId === id)!)
    .filter((r) => r.action !== "RESOLVE");
}
