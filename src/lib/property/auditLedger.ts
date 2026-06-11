/**
 * Audit ledger — append-only NDJSON record of operator decisions (SERVER-ONLY).
 *
 * Every source approve/reject/hold is written here with who · when · source ·
 * decision · reason. This is the accountability trail the audit / anonymous-token
 * test will later verify. File lives under data/ (git-ignored; runtime state).
 *
 * Uses fs — never import from client or Edge code.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { chainAppend } from "@/lib/security/ledgerHashChain";

const LEDGER_PATH = path.join(process.cwd(), "data", "audit-ledger.ndjson");
export const AUDIT_LEDGER_PATH = LEDGER_PATH;

export interface AuditEvent {
  ts: string; // ISO timestamp
  actorId: string;
  actorName: string;
  domain: string; // e.g. "source-review"
  subject: string; // e.g. source id
  decision: string; // APPROVE | REJECT | HOLD
  reason: string;
  detail?: Record<string, unknown>;
}

export function appendAuditEvent(e: Omit<AuditEvent, "ts"> & { ts?: string }): AuditEvent {
  const event: AuditEvent = { ts: e.ts ?? new Date().toISOString(), ...e };
  // Tamper-evident hash chain (control J): each entry carries prevHash + hash;
  // editing/deleting any chained line breaks verifyLedgerChain.
  chainAppend(LEDGER_PATH, event as unknown as Record<string, unknown>);
  return event;
}

export function readAuditEvents(filter?: { domain?: string; subject?: string }): AuditEvent[] {
  let raw = "";
  try { raw = fs.readFileSync(LEDGER_PATH, "utf8"); } catch { return []; }
  const events = raw
    .split("\n")
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l) as AuditEvent; } catch { return null; } })
    .filter((e): e is AuditEvent => !!e);
  return events.filter(
    (e) => (!filter?.domain || e.domain === filter.domain) && (!filter?.subject || e.subject === filter.subject),
  );
}
