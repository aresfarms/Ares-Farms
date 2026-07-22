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
const LOCK_TIMEOUT_MS = 5_000;
const STALE_LOCK_MS = 30_000;
const LOCK_RETRY_MS = 10;
const lockWaitBuffer = new Int32Array(new SharedArrayBuffer(4));

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

function withLedgerLock<T>(filePath: string, operation: () => T): T {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lockPath = `${filePath}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let lockFd: number | null = null;

  while (lockFd === null) {
    try {
      lockFd = fs.openSync(lockPath, "wx", 0o600);
    } catch (error) {
      const code = error instanceof Error && "code" in error
        ? String((error as NodeJS.ErrnoException).code)
        : null;
      if (code !== "EEXIST") throw error;

      const lockAge = Date.now() - (fs.statSync(lockPath).mtimeMs || Date.now());
      if (lockAge > STALE_LOCK_MS) {
        fs.unlinkSync(lockPath);
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for the audit-ledger lock: ${path.basename(filePath)}`);
      }
      Atomics.wait(lockWaitBuffer, 0, 0, LOCK_RETRY_MS);
    }
  }

  try {
    return operation();
  } finally {
    fs.closeSync(lockFd);
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // A stale-lock recovery may already have removed it; the append itself is complete.
    }
  }
}

/** Append payload with chain fields; returns the chained record. */
export function chainAppend(filePath: string, payload: Record<string, unknown>): Record<string, unknown> {
  return withLedgerLock(filePath, () => {
    let prevHash = GENESIS;
    try {
      const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const e = JSON.parse(lines[i]);
        if (typeof e.hash === "string") { prevHash = e.hash; break; }
      }
    } catch { /* first entry */ }
    const record = { ...payload, prevHash, hash: digest(prevHash, payload) };
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", {
      encoding: "utf8",
      mode: 0o600,
    });
    return record;
  });
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
