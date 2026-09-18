import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import {
  listSteadyStateIncidentReceipts,
  type SteadyStateIncidentReceipt,
} from "./officialEvidenceSteadyStateIncident";

export type IncidentSeverity = "P1" | "P2";
export type IncidentSlaAction = "ASSIGN" | "ACK_BREACH" | "RESOLUTION_BREACH";
export interface IncidentSlaReceipt {
  receiptId: string;
  incidentId: string;
  action: IncidentSlaAction;
  at: string;
  severity: IncidentSeverity;
  acknowledgeBy: string;
  resolveBy: string;
  reason: string;
}
const FILE = runtimeStatePath(
  "official-evidence",
  "steady-state-incident-sla.json",
);
const read = (): IncidentSlaReceipt[] => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as IncidentSlaReceipt[];
  } catch {
    return [];
  }
};
const write = (rows: IncidentSlaReceipt[]) => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
};
const severityFor = (incident: SteadyStateIncidentReceipt): IncidentSeverity =>
  incident.blockedJobIds.length > 0 || incident.failedJobIds.length >= 3
    ? "P1"
    : "P2";
const targets = (severity: IncidentSeverity) =>
  severity === "P1"
    ? { acknowledgeMinutes: 15, resolveMinutes: 240 }
    : { acknowledgeMinutes: 60, resolveMinutes: 1440 };

export function assignIncidentSla(
  incident: SteadyStateIncidentReceipt,
): IncidentSlaReceipt {
  const rows = read();
  const existing = rows.find(
    (row) => row.incidentId === incident.incidentId && row.action === "ASSIGN",
  );
  if (existing) return existing;
  const severity = severityFor(incident);
  const target = targets(severity);
  const opened = Date.parse(incident.at);
  const row: IncidentSlaReceipt = {
    receiptId: randomUUID(),
    incidentId: incident.incidentId,
    action: "ASSIGN",
    at: incident.at,
    severity,
    acknowledgeBy: new Date(
      opened + target.acknowledgeMinutes * 60_000,
    ).toISOString(),
    resolveBy: new Date(opened + target.resolveMinutes * 60_000).toISOString(),
    reason: `${severity} operational response targets assigned from failed and blocked recomputation evidence.`,
  };
  write([...rows, row]);
  return row;
}
export function evaluateIncidentSlaBreaches(
  at = new Date().toISOString(),
): IncidentSlaReceipt[] {
  const incidentRows = listSteadyStateIncidentReceipts();
  const slaRows = read();
  const now = Date.parse(at);
  const created: IncidentSlaReceipt[] = [];
  const opens = incidentRows.filter((row) => row.action === "OPEN");
  for (const incident of opens) {
    const assignment = assignIncidentSla(incident);
    const history = incidentRows.filter(
      (row) => row.incidentId === incident.incidentId,
    );
    const resolved = history.some((row) => row.action === "RESOLVE");
    const acknowledged = history.some(
      (row) =>
        row.action === "ACKNOWLEDGE" ||
        row.action === "ESCALATE" ||
        row.action === "RESOLVE",
    );
    const existing = [...slaRows, ...created].filter(
      (row) => row.incidentId === incident.incidentId,
    );
    if (
      !acknowledged &&
      now > Date.parse(assignment.acknowledgeBy) &&
      !existing.some((row) => row.action === "ACK_BREACH")
    ) {
      created.push({
        ...assignment,
        receiptId: randomUUID(),
        action: "ACK_BREACH",
        at,
        reason: `${assignment.severity} incident was not acknowledged by ${assignment.acknowledgeBy}.`,
      });
    }
    if (
      !resolved &&
      now > Date.parse(assignment.resolveBy) &&
      !existing.some((row) => row.action === "RESOLUTION_BREACH")
    ) {
      created.push({
        ...assignment,
        receiptId: randomUUID(),
        action: "RESOLUTION_BREACH",
        at,
        reason: `${assignment.severity} incident was not resolved by ${assignment.resolveBy}.`,
      });
    }
  }
  if (created.length) write([...read(), ...created]);
  return created;
}
export function listIncidentSlaReceipts(): IncidentSlaReceipt[] {
  return read();
}
export function incidentSlaStatus(
  incidentId: string,
): IncidentSlaReceipt | null {
  return (
    [...read()].reverse().find((row) => row.incidentId === incidentId) ?? null
  );
}
