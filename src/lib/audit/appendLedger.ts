/**
 * Core audit-ledger append contract (SERVER-ONLY).
 *
 * The canonical append-only NDJSON ledger at data/audit-ledger.ndjson. This is
 * the CORE backbone contract any unit may log through (reached by import of this
 * core module — never by importing another unit's ledger). The anonymous-token
 * substrate (borrower-experience) logs every token action here, by tokenId only
 * — NEVER a person. Same event shape the source-review flow uses.
 *
 * Uses fs — never import from client or Edge code.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const LEDGER_PATH = path.join(process.cwd(), "data", "audit-ledger.ndjson");

export interface LedgerEvent {
  ts: string;
  actorId: string;
  actorName: string;
  domain: string;
  subject: string;
  decision: string;
  reason: string;
  detail?: Record<string, unknown>;
}

export function appendLedgerEvent(e: Omit<LedgerEvent, "ts"> & { ts?: string }): LedgerEvent {
  const event: LedgerEvent = { ts: e.ts ?? new Date().toISOString(), ...e };
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(event) + "\n", "utf8");
  return event;
}

export function readLedgerEvents(filter?: { domain?: string; subject?: string }): LedgerEvent[] {
  let raw = "";
  try {
    raw = fs.readFileSync(LEDGER_PATH, "utf8");
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as LedgerEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is LedgerEvent => {
      if (!e) return false;
      if (filter?.domain && e.domain !== filter.domain) return false;
      if (filter?.subject && e.subject !== filter.subject) return false;
      return true;
    });
}
