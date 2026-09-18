/**
 * REALITY-SEC-001 §3.6 — Abuse telemetry dashboard (SERVER-ONLY, read-only).
 *
 * Aggregates public abuse patterns WITHOUT identifying any visitor: it reads
 * the PII-free interview ledger + the reality replay ledger (decision enums
 * and hashes only — no dossiers, no raw text, no identity) and counts the
 * spec's ten panels. Anonymous session/security event identifiers only.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { REPLAY_LEDGER, type RealityReplayRecord } from "./realitySecurityReplay";
import { openRealityBlockers, realityProductionReady } from "./realitySecurityDoctrine";
import { readThreatEscalations, THREAT_REVIEW_STATES } from "./threatEscalationLedger";

const INTERVIEW_LEDGER = path.join(process.cwd(), "data", "discovery-interview-ledger.ndjson");

function readNdjson<T>(file: string): T[] {
  try {
    return fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as T);
  } catch { return []; }
}

export interface AbusePanel { key: string; count: number }

export function abuseTelemetryDashboard(): {
  doctrine: string;
  panels: AbusePanel[];
  openBlockers: string[];
  production_ready: boolean;
} {
  const interview = readNdjson<{ slot?: string }>(INTERVIEW_LEDGER);
  const replay = readNdjson<RealityReplayRecord>(REPLAY_LEDGER);
  const slotCount = (re: RegExp) => interview.filter((r) => re.test(r.slot ?? "")).length;

  const panels: AbusePanel[] = [
    { key: "Prompt-injection attempts", count: replay.filter((r) => /injection|extraction/.test(r.refusalReason ?? "")).length },
    { key: "Owner lookup attempts", count: slotCount(/refusal:ownership/) + replay.filter((r) => /ownership/.test(r.refusalReason ?? "")).length },
    { key: "Demographic/steering attempts", count: slotCount(/refusal:steering/) + replay.filter((r) => /steering/.test(r.refusalReason ?? "")).length },
    { key: "Unsafe URL attempts", count: replay.filter((r) => r.urlSandboxVerdict === "BLOCKED").length },
    { key: "Proprietary-content capture attempts", count: replay.filter((r) => /listing|proprietary/.test(r.refusalReason ?? "")).length },
    { key: "Repeated abusive sessions", count: replay.filter((r) => r.inputDecision === "ESCALATE_SECURITY").length },
    { key: "Rate-limit triggers", count: replay.filter((r) => r.inputDecision === "RATE_LIMIT").length },
    { key: "Output-gate blocks", count: replay.filter((r) => r.outputGateOk === false).length },
    { key: "Quarantine events", count: replay.filter((r) => r.inputDecision === "QUARANTINE").length },
    { key: "Security escalations", count: replay.filter((r) => r.inputDecision === "ESCALATE_SECURITY").length },
    // Threat/Violence Escalations panel (2026-06-12) — HUMAN-REVIEW queue with
    // states NEW / UNDER_REVIEW / FALSE_POSITIVE / ACTION_REQUIRED / CLOSED.
    // Server-side only: network identifiers in the underlying ledger are NEVER
    // exposed in any public UI; this panel surfaces counts only.
    { key: `Threat / Violence Escalations (states: ${THREAT_REVIEW_STATES.join("/")})`, count: readThreatEscalations().length },
  ];

  return { doctrine: "REALITY-SEC-001", panels, openBlockers: openRealityBlockers(), production_ready: realityProductionReady() };
}
