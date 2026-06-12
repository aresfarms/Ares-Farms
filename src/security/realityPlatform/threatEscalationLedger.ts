/**
 * Threat / Violence Escalation ledger (BUILD FIX 2026-06-12, CRITICAL) —
 * SERVER-ONLY, append-only, hash-chained.
 *
 * When ESCALATE_VIOLENT_THREAT triggers, a security review event is recorded
 * for HUMAN REVIEW. Guardrails (locked):
 *  - HUMAN REVIEW ONLY — no auto-reporting unless a separate, legally
 *    reviewed escalation policy exists;
 *  - audit trail preserved (hash chain, append-only);
 *  - NO user dossiers — the triggering message is stored as a HASH only,
 *    never raw text; no cross-event visitor linkage beyond the anonymous
 *    per-event session identifier;
 *  - IPs/network identifiers are captured only where legally available and
 *    are NEVER exposed in any public UI (this ledger is server-side only);
 *  - retention limit: review events older than THREAT_RETENTION_DAYS are
 *    eligible for purge once status is FALSE_POSITIVE or CLOSED.
 *
 * HARD RULE: violent-threat intent overrides every Navigator pathway. No
 * normal discovery flow continues after a trigger until human review clears
 * the event (the journey carries threatHold=true).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export const THREAT_LEDGER = path.join(process.cwd(), "data", "threat-escalation-ledger.ndjson");
export const THREAT_RETENTION_DAYS = 365;

const sha = (s: string) => "sha256:" + createHash("sha256").update(s, "utf8").digest("hex").slice(0, 32);

export type ThreatReviewStatus = "NEW" | "UNDER_REVIEW" | "FALSE_POSITIVE" | "ACTION_REQUIRED" | "CLOSED";
export const THREAT_REVIEW_STATES: ThreatReviewStatus[] = ["NEW", "UNDER_REVIEW", "FALSE_POSITIVE", "ACTION_REQUIRED", "CLOSED"];

export type ThreatPhraseCategory =
  | "bombing" | "arson" | "shooting" | "assault" | "sabotage" | "terrorism" | "threat-other";

export interface ThreatEscalationRecord {
  /** Anonymous per-event session identifier — NOT a visitor identity. */
  eventId: string;
  ts: string;
  status: ThreatReviewStatus;
  triggeringMessageHash: string;
  phraseCategory: ThreatPhraseCategory;
  routeDecision: "ESCALATE_VIOLENT_THREAT";
  /** Network identifier where legally available — server-side only, never public UI. */
  networkIdentifier: string | null;
  userAgent: string | null;
  pageRoute: string;
  replayRef: string;
  renderedResponseHash: string;
  prevHash?: string;
  hash?: string;
}

function lastHash(): string {
  try {
    const lines = fs.readFileSync(THREAT_LEDGER, "utf8").trim().split("\n").filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]) as ThreatEscalationRecord;
    return last.hash ?? "genesis";
  } catch { return "genesis"; }
}

export function appendThreatEscalation(input: {
  message: string;
  phraseCategory: ThreatPhraseCategory;
  networkIdentifier: string | null;
  userAgent: string | null;
  pageRoute: string;
  replayRef: string;
  renderedResponse: string;
}): ThreatEscalationRecord {
  const rec: ThreatEscalationRecord = {
    eventId: randomUUID(),
    ts: new Date().toISOString(),
    status: "NEW",
    triggeringMessageHash: sha(input.message), // hash ONLY — never raw text
    phraseCategory: input.phraseCategory,
    routeDecision: "ESCALATE_VIOLENT_THREAT",
    networkIdentifier: input.networkIdentifier,
    userAgent: input.userAgent,
    pageRoute: input.pageRoute,
    replayRef: input.replayRef,
    renderedResponseHash: sha(input.renderedResponse),
    prevHash: lastHash(),
  };
  rec.hash = sha((rec.prevHash ?? "genesis") + JSON.stringify({ ...rec, hash: undefined }));
  try {
    fs.mkdirSync(path.dirname(THREAT_LEDGER), { recursive: true });
    fs.appendFileSync(THREAT_LEDGER, JSON.stringify(rec) + "\n", "utf8");
  } catch { /* best effort — the REFUSAL still renders regardless */ }
  return rec;
}

export function readThreatEscalations(): ThreatEscalationRecord[] {
  try {
    return fs.readFileSync(THREAT_LEDGER, "utf8").trim().split("\n").filter(Boolean)
      .map((l) => JSON.parse(l) as ThreatEscalationRecord);
  } catch { return []; }
}
