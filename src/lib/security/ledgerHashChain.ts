/**
 * Ledger hash chain — tamper-evident append-only NDJSON (Tier 2B).
 *
 * Each appended event gains { prevHash, hash } where
 * hash = sha256(prevHash + canonical(payload)). Editing or deleting any chained
 * line breaks every subsequent hash; verifyLedgerChain detects it. Legacy
 * (pre-chain) lines are grandfathered: verification starts at the first
 * chained entry and reports how many legacy lines precede it.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const GENESIS = "GENESIS";

function canonical(payload: Record<string, unknown>): string {
  const rest: Record<string, unknown> = {};
  for (const k of Object.keys(payload).sort()) {
    if (k === "hash" || k === "prevHash") continue;
    rest[k] = payload[k];
  }
  return JSON.stringify(rest);
}
function digest(prevHash: string, payload: Record<string, unknown>): string {
  return createHash("sha256").update(prevHash + canonical(payload)).digest("hex");
}

/** Append payload with chain fields; returns the chained record. */
export function chainAppend(filePath: string, payload: Record<string, unknown>): Record<string, unknown> {
  let prevHash = GENESIS;
  try {
    const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const e = JSON.parse(lines[i]);
      if (typeof e.hash === "string") { prevHash = e.hash; break; }
    }
  } catch { /* first entry */ }
  const record = { ...payload, prevHash, hash: digest(prevHash, payload) };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
  return record;
}

/** Verify the chain; returns ok + where it broke + legacy (pre-chain) count. */
export function verifyLedgerChain(filePath: string): { ok: boolean; chained: number; legacy: number; brokenAt: number | null } {
  let lines: string[];
  try { lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean); } catch { return { ok: true, chained: 0, legacy: 0, brokenAt: null }; }
  let prevHash = GENESIS, chained = 0, legacy = 0;
  for (let i = 0; i < lines.length; i++) {
    let e: Record<string, unknown>;
    try { e = JSON.parse(lines[i]); } catch { return { ok: false, chained, legacy, brokenAt: i }; }
    if (typeof e.hash !== "string") {
      if (chained === 0) { legacy++; continue; }
      return { ok: false, chained, legacy, brokenAt: i };
    }
    if (e.prevHash !== prevHash || digest(prevHash, e) !== e.hash) return { ok: false, chained, legacy, brokenAt: i };
    prevHash = e.hash as string; chained++;
  }
  return { ok: true, chained, legacy, brokenAt: null };
}
