/**
 * REALITY-SEC-001 §3.8 — Reality security replay (SERVER-ONLY).
 *
 * Every security-relevant Navigator event is recorded as a hash-chained,
 * append-only replay record so the full guard pipeline of any turn can be
 * reconstructed: input-guard decision → scrubbed fields → context zones →
 * URL sandbox result → privacy-firewall decision → output-gate result →
 * refusal reason → evidence bundle hash → final rendered-output hash.
 * Aligns with TECH-LEDGER-001 / TECH-REPLAY-001 (same chainAppend pattern as
 * the audit ledgers). PII-free: hashes and decision enums only — never the
 * visitor's raw text.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

export const REPLAY_LEDGER = path.join(process.cwd(), "data", "reality-security-replay.ndjson");

const sha = (s: string) => "sha256:" + createHash("sha256").update(s, "utf8").digest("hex").slice(0, 32);

export interface RealityReplayRecord {
  ts: string;
  inputDecision: string;
  scrubbedFieldCount: number;
  contextZones: string[];
  urlSandboxVerdict: string | null;
  privacyFirewallOk: boolean;
  outputGateOk: boolean;
  refusalReason: string | null;
  evidenceBundleHash: string;
  renderedOutputHash: string;
  prevHash?: string;
  hash?: string;
}

export function hashEvidence(parts: string[]): string {
  return sha(parts.sort().join("\n"));
}
export function hashOutput(text: string): string {
  return sha(text);
}

/** Append a chained replay record. Never throws (security logging must not break the product). */
export function appendReplay(rec: RealityReplayRecord): void {
  try {
    fs.mkdirSync(path.dirname(REPLAY_LEDGER), { recursive: true });
    let prevHash = "GENESIS";
    try {
      const lines = fs.readFileSync(REPLAY_LEDGER, "utf8").trim().split("\n");
      const last = JSON.parse(lines[lines.length - 1]) as RealityReplayRecord;
      prevHash = last.hash ?? "GENESIS";
    } catch { /* first record */ }
    const content = JSON.stringify({ ...rec, prevHash, hash: undefined });
    const hash = sha(prevHash + content);
    fs.appendFileSync(REPLAY_LEDGER, JSON.stringify({ ...rec, prevHash, hash }) + "\n", "utf8");
  } catch { /* never break the conversation for a log write */ }
}

/** Verify the chain end-to-end (replayability gate). */
export function verifyReplayChain(file = REPLAY_LEDGER): { ok: boolean; records: number; brokenAt: number | null } {
  let lines: string[];
  try { lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean); } catch { return { ok: true, records: 0, brokenAt: null }; }
  let prev = "GENESIS";
  for (let i = 0; i < lines.length; i++) {
    const rec = JSON.parse(lines[i]) as RealityReplayRecord;
    if (rec.prevHash !== prev) return { ok: false, records: lines.length, brokenAt: i };
    const content = JSON.stringify({ ...rec, hash: undefined });
    if (rec.hash !== sha(prev + content)) return { ok: false, records: lines.length, brokenAt: i };
    prev = rec.hash!;
  }
  return { ok: true, records: lines.length, brokenAt: null };
}
